import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const cargoId = parseInt(params.id)

    const cargo = await prisma.cargo.findFirst({
      where: {
        id: cargoId,
        createdBy: userId
      },
      include: {
        customer: true,
        processing: {
          orderBy: { dateProcessed: 'desc' }
        }
      }
    })

    if (!cargo) {
      return NextResponse.json(
        { message: 'Cargo not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      cargo: {
        ...cargo,
        createdAt: cargo.createdAt.toISOString(),
        updatedAt: cargo.updatedAt.toISOString(),
        dateIn: cargo.dateIn.toISOString(),
        dateOut: cargo.dateOut?.toISOString(),
        processing: cargo.processing.map((item: any) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
          dateProcessed: item.dateProcessed.toISOString()
        }))
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const cargoId = parseInt(params.id)

    const cargo = await prisma.cargo.findFirst({
      where: {
        id: cargoId,
        createdBy: userId
      }
    })

    if (!cargo) {
      return NextResponse.json(
        { message: 'Cargo not found' },
        { status: 404 }
      )
    }

    // Delete cargo (cascade will handle related processing records)
    await prisma.cargo.delete({
      where: { id: cargoId }
    })

    return NextResponse.json({
      message: 'Cargo deleted successfully'
    })
  } catch (error) {
    console.error('Cargo DELETE error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
