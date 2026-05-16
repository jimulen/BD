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
    const limit = parseInt(searchParams.get('limit') || '20')

    let where: any = {
      createdBy: userId
    }

    if (search) {
      where.OR = [
        { trackingNo: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { phone: { contains: search } } },
        { productType: { contains: search } }
      ]
    }

    const [deliveries, total] = await Promise.all([
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
              description: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.delivery.count({ where })
    ])

    return NextResponse.json({
      deliveries: deliveries.map((item: any) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        pickupDate: item.pickupDate.toISOString(),
        deliveryDate: item.deliveryDate?.toISOString()
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Deliveries GET error:', error)
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
    const {
      trackingNo,
      customerId,
      cargoId,
      productType,
      quantity,
      unit,
      pickupDate,
      notes
    } = body

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

    // Check if cargo exists and belongs to user (if provided)
    if (cargoId) {
      const cargo = await prisma.cargo.findFirst({
        where: {
          id: parseInt(cargoId),
          createdBy: userId
        }
      })

      if (!cargo) {
        return NextResponse.json(
          { message: 'Cargo not found' },
          { status: 400 }
        )
      }
    }

    const delivery = await prisma.delivery.create({
      data: {
        trackingNo: trackingNo || `DEL-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        customerId: parseInt(customerId),
        cargoId: cargoId ? parseInt(cargoId) : null,
        productType,
        quantity: parseFloat(quantity),
        unit,
        pickupDate: new Date(pickupDate),
        notes: notes || null,
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

    return NextResponse.json({
      message: 'Delivery created successfully',
      delivery: {
        ...delivery,
        createdAt: delivery.createdAt.toISOString(),
        updatedAt: delivery.updatedAt.toISOString(),
        pickupDate: delivery.pickupDate.toISOString(),
        deliveryDate: delivery.deliveryDate?.toISOString()
      }
    })
  } catch (error) {
    console.error('Delivery POST error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
