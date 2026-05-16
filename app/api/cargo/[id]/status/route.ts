import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function PUT(
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
    const { status } = await request.json()

    if (!status) {
      return NextResponse.json(
        { message: 'Status is required' },
        { status: 400 }
      )
    }

    // Validate status transitions
    const validStatuses = ['in_transit', 'in_store', 'in_processing', 'processed', 'completed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status' },
        { status: 400 }
      )
    }

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

    const updateData: any = {
      status,
      updatedAt: new Date()
    }

    // Handle processed status
    if (status === 'processed') {
      // For now, just update status - cost fields will be added when database is updated
      console.log('Cargo marked as processed')
    }

    // Set dateOut when cargo is completed
    if (status === 'completed' && !cargo.dateOut) {
      updateData.dateOut = new Date()
    }

    const updatedCargo = await prisma.cargo.update({
      where: { id: cargoId },
      data: updateData
    })

    return NextResponse.json({
      message: 'Cargo status updated successfully',
      cargo: {
        ...updatedCargo,
        transportCost: cargo.transportCost || 0, // Include original transport cost
        createdAt: updatedCargo.createdAt.toISOString(),
        updatedAt: updatedCargo.updatedAt.toISOString(),
        dateIn: updatedCargo.dateIn.toISOString(),
        dateOut: updatedCargo.dateOut?.toISOString()
      }
    })
  } catch (error) {
    console.error('Cargo status PUT error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
