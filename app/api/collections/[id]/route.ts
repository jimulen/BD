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
    const collectionId = parseInt(params.id)

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

    await prisma.delivery.delete({
      where: { id: collectionId }
    })

    return NextResponse.json({
      message: 'Collection deleted successfully'
    })
  } catch (error) {
    console.error('Collection DELETE error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
