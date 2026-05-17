import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)!
    const userId = decoded.userId

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search') || ''
    const customerId = searchParams.get('customerId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    let where: any = {
      createdBy: userId
    }

    // Filter by specific customer if customerId is provided
    if (customerId) {
      where.customerId = parseInt(customerId)
    }

    // Filter by date range if provided
    if (startDate && endDate) {
      const endOfDay = new Date(endDate)
      endOfDay.setHours(23, 59, 59, 999)
      where.pickupDate = {
        gte: new Date(startDate),
        lte: endOfDay
      }
    } else if (startDate) {
      where.pickupDate = {
        gte: new Date(startDate)
      }
    } else if (endDate) {
      const endOfDay = new Date(endDate)
      endOfDay.setHours(23, 59, 59, 999)
      where.pickupDate = {
        lte: endOfDay
      }
    }
    
    console.log('Collections API where clause:', where) // Debug log
    
    if (search && !customerId) {
      where.OR = [
        { trackingNo: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { phone: { contains: search } } },
        { productType: { contains: search } }
      ]
    }

    const [collections, total] = await Promise.all([
      prisma.delivery.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          },
          cargo: {
            select: {
              id: true,
              trackingNo: true,
              description: true,
              quantity: true,
              transportCost: true,
              customerId: true,
              customer: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.delivery.count({ where })
    ])

    const mappedCollections = collections.map((item: any) => {
      // Calculate cost for each collection
      let collectionCost = 0
      let costDescription = ''
      let remainingBags = 0
      
      // Extract bagsToProcess and original cargo quantity from notes field
      let bagsProcessed = 0
      let originalCargoQuantity = 0
      
      if (item.notes && item.notes.includes('bags:')) {
        const bagsMatch = item.notes.match(/bags:(\d+)/)
        bagsProcessed = bagsMatch ? parseInt(bagsMatch[1]) : 0
      }
      
      if (item.notes && item.notes.includes('originalCargoQty:')) {
        const originalQtyMatch = item.notes.match(/originalCargoQty:(\d+)/)
        originalCargoQuantity = originalQtyMatch ? parseInt(originalQtyMatch[1]) : 0
      }
      
      // Fallback calculations if not found in notes
      if (bagsProcessed === 0) {
        bagsProcessed = item.productType === 'processed_rice' ? 
          Math.floor(parseFloat(item.quantity) / 50) : // Estimate bags from kg
          parseFloat(item.quantity) // For stored bags, quantity is in bags
      }

      console.log('Collection item debug:', {
        id: item.id,
        notes: item.notes,
        bagsProcessed: bagsProcessed,
        originalCargoQuantity: originalCargoQuantity,
        currentCargoQuantity: item.cargo?.quantity,
        productType: item.productType
      })

      if (item.productType === 'processed_rice') {
        // For processed rice: fair transport cost based on actual bags processed
        let transportCost = 0
        let fairTransportCost = 0
        let remainingBagsAtTime = 0
        
        if (item.cargo && bagsProcessed && originalCargoQuantity > 0) {
          // Fair transport cost: Only charge for bags actually processed
          remainingBagsAtTime = originalCargoQuantity - bagsProcessed
          fairTransportCost = Math.round((bagsProcessed / originalCargoQuantity) * (item.cargo.transportCost || 0))
          transportCost = fairTransportCost
        }
        collectionCost = (60 * parseFloat(item.quantity)) + transportCost // Total cost = processing + transport
        costDescription = `60 Tsh/kg × ${item.quantity} kg = ${(60 * parseFloat(item.quantity)).toLocaleString()} Tsh + ${transportCost.toFixed(0)} Tsh transport (${bagsProcessed} bags processed, ${remainingBagsAtTime} bags remaining) = ${collectionCost.toLocaleString()} Tsh`
        
        // Calculate remaining bags - use current cargo quantity (already updated)
        if (item.cargo) {
          remainingBags = item.cargo.quantity // Use current cargo quantity (already updated)
          console.log('Fair transport cost calculation:', {
            originalCargoQuantity: originalCargoQuantity,
            bagsProcessed: bagsProcessed,
            remainingBagsAtTime: remainingBagsAtTime,
            fairTransportCost: fairTransportCost,
            totalTransportCost: item.cargo.transportCost || 0,
            note: 'Fair cost based on actual bags processed'
          })
        }
      } else if (item.productType === 'stored_bags' && item.cargo) {
        // For stored bags: fair transport cost based on actual bags processed
        let transportCost = 0
        let fairTransportCost = 0
        let remainingBagsAtTime = 0
        
        if (bagsProcessed && originalCargoQuantity > 0) {
          // Fair transport cost: Only charge for bags actually processed
          remainingBagsAtTime = originalCargoQuantity - bagsProcessed
          fairTransportCost = Math.round((bagsProcessed / originalCargoQuantity) * (item.cargo.transportCost || 0))
          transportCost = fairTransportCost
        }
        collectionCost = (500 * parseFloat(item.quantity)) + transportCost // Total cost = processing + transport
        costDescription = `500 Tsh/bag × ${item.quantity} bags = ${(500 * parseFloat(item.quantity)).toLocaleString()} Tsh + ${transportCost.toFixed(0)} Tsh transport (${bagsProcessed} bags processed, ${remainingBagsAtTime} bags remaining) = ${collectionCost.toLocaleString()} Tsh`
        
        // Calculate remaining bags - use current cargo quantity (already updated)
        remainingBags = item.cargo.quantity // Use current cargo quantity (already updated)
        console.log('Fair transport cost calculation:', {
          originalCargoQuantity: originalCargoQuantity,
          bagsProcessed: bagsProcessed,
          remainingBagsAtTime: remainingBagsAtTime,
          fairTransportCost: fairTransportCost,
          totalTransportCost: item.cargo.transportCost || 0,
          note: 'Fair cost based on actual bags processed'
        })
      }

      return {
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        pickupDate: item.pickupDate.toISOString(),
        deliveryDate: item.deliveryDate?.toISOString(),
        bagsToProcess: bagsProcessed,
        remainingBags: remainingBags || 0,
        costCalculation: {
          totalCost: collectionCost,
          description: costDescription,
          fairTransportCost: (item.productType === 'processed_rice' || item.productType === 'stored_bags') && item.cargo && bagsProcessed && originalCargoQuantity > 0 ? 
            Math.round((bagsProcessed / originalCargoQuantity) * (item.cargo.transportCost || 0)) : 0
        }
      }
    })

    console.log('Collections API - returning', mappedCollections.length, 'collections')
    console.log('Collections API - detailed data:', mappedCollections.map(c => ({
      id: c.id,
      trackingNo: c.trackingNo,
      customerId: c.customer?.id,
      customerName: c.customer?.name,
      cargoId: c.cargo?.id,
      cargoDescription: c.cargo?.description,
      cargoCustomerId: c.cargo?.customerId,
      cargoCustomerName: c.cargo?.customer?.name,
      productType: c.productType,
      quantity: c.quantity,
      costCalculation: c.costCalculation
    })))

    return NextResponse.json({
      collections: mappedCollections,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Collections GET error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)!
    const userId = decoded.userId

    const body = await request.json()
    console.log('POST collections - received body:', body)
    
    const {
      trackingNo,
      customerId,
      cargoId,
      productType,
      quantity,
      unit,
      pickupDate,
      notes,
      bagsToProcess
    } = body

    console.log('POST collections - extracted bagsToProcess:', bagsToProcess)

    if (!customerId || !productType || !quantity || !pickupDate) {
      return NextResponse.json(
        { message: 'Customer, product type, quantity, and pickup date are required' },
        { status: 400 }
      )
    }

    // Check if customer exists
    const customer = await prisma.customer.findFirst({
      where: {
        id: parseInt(customerId),
        createdBy: userId
      }
    })

    if (!customer) {
      return NextResponse.json(
        { message: 'Customer not found' },
        { status: 400 }
      )
    }

    // Check if cargo exists and belongs to user AND same customer (if provided)
    let cargo = null
    if (cargoId) {
      cargo = await prisma.cargo.findFirst({
        where: {
          id: parseInt(cargoId),
          createdBy: userId,
          customerId: parseInt(customerId) // CRITICAL: Ensure cargo belongs to same customer
        }
      })

      if (!cargo) {
        return NextResponse.json(
          { message: 'Cargo not found or does not belong to this customer' },
          { status: 400 }
        )
      }
    }

    // Get original cargo quantity for transport cost calculation
    let originalCargoQuantity = 0
    if (cargoId) {
      const currentCargo = await prisma.cargo.findUnique({
        where: { id: parseInt(cargoId) }
      })
      originalCargoQuantity = currentCargo?.quantity || 0
    }

    // Calculate collection cost based on product type
    let collectionCost = 0
    let costDescription = ''

    if (productType === 'processed_rice') {
      // For processed rice: always 60 Tsh per kg
      collectionCost = 60 * parseFloat(quantity)
      costDescription = `60 Tsh/kg × ${quantity} kg = ${collectionCost.toLocaleString()} Tsh`
    } else if (productType === 'stored_bags' && cargo) {
      // For stored bags: use original cost per bag from cargo
      // Note: This assumes cargo has storeCost field when Prisma is updated
      const costPerBag = 500 // Default fallback if cargo doesn't have storeCost
      collectionCost = costPerBag * parseFloat(quantity)
      costDescription = `${costPerBag} Tsh/bag × ${quantity} bags = ${collectionCost.toLocaleString()} Tsh`
    }

    const collection = await prisma.delivery.create({
      data: {
        trackingNo: trackingNo || `COL-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        customerId: parseInt(customerId),
        cargoId: cargoId ? parseInt(cargoId) : null,
        productType,
        quantity: parseFloat(quantity),
        unit,
        pickupDate: new Date(pickupDate),
        status: 'picked_up', // Start as picked_up, not pending
        notes: notes ? 
          `${notes}|bags:${bagsToProcess}|originalCargoQty:${originalCargoQuantity}` : 
          `bags:${bagsToProcess}|originalCargoQty:${originalCargoQuantity}`, // Store bagsToProcess and original cargo quantity in notes
        createdBy: userId
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        cargo: {
          select: {
            id: true,
            trackingNo: true,
            description: true
          }
        }
      }
    })

    // Update cargo quantity if bags were processed
    if (cargoId && bagsToProcess) {
      const bagsToProcessNum = parseInt(bagsToProcess)
      console.log('Updating cargo quantity:', { cargoId, bagsToProcess: bagsToProcessNum })
      
      // Get current cargo to check quantity
      const currentCargo = await prisma.cargo.findUnique({
        where: { id: parseInt(cargoId) }
      })
      
      if (currentCargo) {
        const newQuantity = Math.max(0, currentCargo.quantity - bagsToProcessNum)
        console.log('Cargo quantity update:', {
          current: currentCargo.quantity,
          processed: bagsToProcessNum,
          new: newQuantity
        })
        
        await prisma.cargo.update({
          where: { id: parseInt(cargoId) },
          data: { quantity: newQuantity }
        })
      }
    }

    return NextResponse.json({
      message: 'Collection created successfully',
      collection: {
        ...collection,
        createdAt: collection.createdAt.toISOString(),
        updatedAt: collection.updatedAt.toISOString(),
        pickupDate: collection.pickupDate.toISOString(),
        deliveryDate: collection.deliveryDate?.toISOString()
      },
      costCalculation: {
        totalCost: collectionCost,
        description: costDescription
      }
    })
  } catch (error) {
    console.error('Collection POST error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
