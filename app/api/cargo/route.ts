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

    const where: any = {
      createdBy: userId,
      ...(searchParams.get('status') && {
        status: searchParams.get('status')
      }),
      ...(searchParams.get('type') && {
        type: searchParams.get('type')
      }),
      ...(search && {
        OR: [
          { description: { contains: search } }
        ]
      }),
      ...(searchParams.get('customerId') && {
        customerId: parseInt(searchParams.get('customerId')!)
      })
    }

    console.log('Cargo API where clause:', where) // Debug log

    const [cargo, total] = await Promise.all([
      prisma.cargo.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.cargo.count({ where })
    ])

    return NextResponse.json({
      cargo: cargo.map((item: any) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        dateIn: item.dateIn.toISOString(),
        dateOut: item.dateOut?.toISOString()
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Cargo GET error:', error)
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
      description,
      type,
      quantity,
      unit,
      dateIn,
      transportCost,
      customerId,
      notes
    } = body

    if (!description || !quantity || !dateIn) {
      return NextResponse.json(
        { message: 'Description, quantity, and date in are required' },
        { status: 400 }
      )
    }

    // Check if tracking number already exists (only if provided)
    if (trackingNo) {
      const existingCargo = await prisma.cargo.findUnique({
        where: { trackingNo }
      })

      if (existingCargo) {
        return NextResponse.json(
          { message: 'Tracking number already exists' },
          { status: 400 }
        )
      }
    }

    const cargo = await prisma.cargo.create({
      data: {
        trackingNo: trackingNo || `AUTO-${Date.now()}`,
        description,
        type,
        status: type === 'store' ? 'in_store' : 'in_transit', // Auto-set status based on type
        quantity: parseFloat(quantity),
        unit,
        dateIn: new Date(dateIn),
        transportCost: parseFloat(transportCost) || 0,
        customerId: customerId ? parseInt(customerId.toString()) : null,
        notes: notes || null,
        createdBy: userId
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Cargo created successfully',
      cargo: {
        ...cargo,
        transportCost: parseFloat(transportCost) || 0, // Include from form data for now
        createdAt: cargo.createdAt.toISOString(),
        updatedAt: cargo.updatedAt.toISOString(),
        dateIn: cargo.dateIn.toISOString(),
        dateOut: cargo.dateOut?.toISOString()
      }
    })
  } catch (error) {
    console.error('Cargo POST error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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
      id,
      description,
      quantity,
      unit,
      transportCost,
      notes
    } = body

    if (!id) {
      return NextResponse.json(
        { message: 'Cargo ID is required' },
        { status: 400 }
      )
    }

    // First check if cargo exists and belongs to user
    const existingCargo = await prisma.cargo.findFirst({
      where: {
        id: parseInt(id),
        createdBy: userId
      }
    })

    if (!existingCargo) {
      return NextResponse.json(
        { message: 'Cargo not found or access denied' },
        { status: 404 }
      )
    }

    // Update the cargo
    const cargo = await prisma.cargo.update({
      where: {
        id: parseInt(id)
      },
      data: {
        description,
        quantity: parseFloat(quantity),
        unit,
        transportCost: parseFloat(transportCost) || 0,
        notes: notes || null,
        updatedAt: new Date()
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Cargo updated successfully',
      cargo: {
        ...cargo,
        createdAt: cargo.createdAt.toISOString(),
        updatedAt: cargo.updatedAt.toISOString(),
        dateIn: cargo.dateIn.toISOString(),
        dateOut: cargo.dateOut?.toISOString()
      }
    })
  } catch (error) {
    console.error('Cargo PUT error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
