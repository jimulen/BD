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

    const transports = await prisma.transport.findMany({
      where: { 
        createdBy: userId,
        isActive: true 
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      transports: transports.map(transport => ({
        ...transport,
        createdAt: transport.createdAt.toISOString(),
        updatedAt: transport.updatedAt.toISOString()
      }))
    })
  } catch (error) {
    console.error('Transports GET error:', error)
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

    const { name, description, baseCost, costPerKm } = await request.json()

    if (!name) {
      return NextResponse.json(
        { message: 'Transport name is required' },
        { status: 400 }
      )
    }

    const transport = await prisma.transport.create({
      data: {
        name,
        description: description || null,
        baseCost: baseCost || 0,
        costPerKm: costPerKm || 0,
        createdBy: userId
      }
    })

    return NextResponse.json({
      message: 'Transport created successfully',
      transport: {
        ...transport,
        createdAt: transport.createdAt.toISOString(),
        updatedAt: transport.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Transports POST error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
