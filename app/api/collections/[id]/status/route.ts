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
    const collectionId = parseInt(params.id)
    const { status } = await request.json()

    if (!status) {
      return NextResponse.json(
        { message: 'Status is required' },
        { status: 400 }
      )
    }

    // Validate status transitions
    const validStatuses = ['pending', 'picked_up', 'delivered', 'completed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status' },
        { status: 400 }
      )
    }

    const collection = await prisma.delivery.findFirst({
      where: {
        id: collectionId,
        createdBy: userId
      }
    })

    if (!collection) {
      return NextResponse.json(
        { message: 'Collection not found' },
        { status: 404 }
      )
    }

    const updateData: any = {
      status,
      updatedAt: new Date()
    }

    // Set deliveryDate when status is delivered or completed
    if ((status === 'delivered' || status === 'completed') && !collection.deliveryDate) {
      updateData.deliveryDate = new Date()
    }

    const updatedCollection = await prisma.delivery.update({
      where: { id: collectionId },
      data: updateData
    })

    return NextResponse.json({
      message: 'Collection status updated successfully',
      collection: {
        ...updatedCollection,
        createdAt: updatedCollection.createdAt.toISOString(),
        updatedAt: updatedCollection.updatedAt.toISOString(),
        pickupDate: updatedCollection.pickupDate.toISOString(),
        deliveryDate: updatedCollection.deliveryDate?.toISOString()
      }
    })
  } catch (error) {
    console.error('Collection status PUT error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
