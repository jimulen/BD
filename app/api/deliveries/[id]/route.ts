import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

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
    const deliveryId = parseInt(params.id)

    const delivery = await prisma.delivery.findFirst({
      where: {
        id: deliveryId,
        createdBy: userId
      }
    })

    if (!delivery) {
      return NextResponse.json(
        { message: 'Delivery not found' },
        { status: 404 }
      )
    }

    await prisma.delivery.delete({
      where: { id: deliveryId }
    })

    return NextResponse.json({
      message: 'Delivery deleted successfully'
    })
  } catch (error) {
    console.error('Delivery DELETE error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
