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

    const where = {
      createdBy: userId,
      ...(search && {
        OR: [
          { cargo: { trackingNo: { contains: search } } },
          { cargo: { description: { contains: search } } },
          { inputType: { contains: search } },
          { outputType: { contains: search } }
        ]
      })
    }

    const [processing, total] = await Promise.all([
      prisma.processing.findMany({
        where,
        include: {
          cargo: {
            select: {
              id: true,
              trackingNo: true,
              description: true
            }
          }
        },
        orderBy: { dateProcessed: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.processing.count({ where })
    ])

    return NextResponse.json({
      processing: processing.map((item: any) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        dateProcessed: item.dateProcessed.toISOString()
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Processing GET error:', error)
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
      cargoId,
      inputType,
      inputQty,
      inputUnit,
      outputType,
      outputQty,
      outputUnit,
      dateProcessed,
      notes
    } = body

    if (!cargoId || !inputQty || !outputQty || !dateProcessed) {
      return NextResponse.json(
        { message: 'Cargo, input quantity, output quantity, and date processed are required' },
        { status: 400 }
      )
    }

    // Check if cargo exists and is in store
    const cargo = await prisma.cargo.findFirst({
      where: {
        id: parseInt(cargoId),
        createdBy: userId,
        status: 'in_store'
      }
    })

    if (!cargo) {
      return NextResponse.json(
        { message: 'Cargo not found or not available for processing' },
        { status: 400 }
      )
    }

    // Update cargo status to in_processing
    await prisma.cargo.update({
      where: { id: parseInt(cargoId) },
      data: { status: 'in_processing' }
    })

    const processing = await prisma.processing.create({
      data: {
        cargoId: parseInt(cargoId),
        inputType,
        inputQty: parseFloat(inputQty),
        inputUnit,
        outputType,
        outputQty: parseFloat(outputQty),
        outputUnit,
        dateProcessed: new Date(dateProcessed),
        notes: notes || null,
        createdBy: userId
      },
      include: {
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
      message: 'Processing record created successfully',
      processing: {
        ...processing,
        createdAt: processing.createdAt.toISOString(),
        updatedAt: processing.updatedAt.toISOString(),
        dateProcessed: processing.dateProcessed.toISOString()
      }
    })
  } catch (error) {
    console.error('Processing POST error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
