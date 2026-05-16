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
    const processingId = parseInt(params.id)

    const processing = await prisma.processing.findFirst({
      where: {
        id: processingId,
        createdBy: userId
      }
    })

    if (!processing) {
      return NextResponse.json(
        { message: 'Processing record not found' },
        { status: 404 }
      )
    }

    await prisma.processing.delete({
      where: { id: processingId }
    })

    return NextResponse.json({
      message: 'Processing record deleted successfully'
    })
  } catch (error) {
    console.error('Processing DELETE error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
