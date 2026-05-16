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
    const customerId = parseInt(params.id)

    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        createdBy: userId
      }
    })

    if (!customer) {
      return NextResponse.json(
        { message: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      customer: {
        ...customer,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Customer GET error:', error)
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
    const customerId = parseInt(params.id)

    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        createdBy: userId
      }
    })

    if (!customer) {
      return NextResponse.json(
        { message: 'Customer not found' },
        { status: 404 }
      )
    }

    // Delete customer (cascade will handle related records)
    await prisma.customer.delete({
      where: { id: customerId }
    })

    return NextResponse.json({
      message: 'Customer deleted successfully'
    })
  } catch (error) {
    console.error('Customer DELETE error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
