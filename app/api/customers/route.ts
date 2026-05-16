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
          { name: { contains: search } },
          { phone: { contains: search } },
          { address: { contains: search } },
          { email: { contains: search } }
        ]
      })
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          phone: true,
          address: true,
          email: true,
          photoPath: true,
          createdAt: true
        }
      }),
      prisma.customer.count({ where })
    ])

    return NextResponse.json({
      customers: customers.map(customer => ({
        ...customer,
        createdAt: customer.createdAt.toISOString()
      })),
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    })
  } catch (error) {
    console.error('Customers GET error:', error)
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

    const formData = await request.formData()
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const address = formData.get('address') as string
    const email = formData.get('email') as string
    const notes = formData.get('notes') as string
    const transportType = formData.get('transportType') as string
    const transportCost = formData.get('transportCost') as string
    const transportNotes = formData.get('transportNotes') as string
    const photo = formData.get('photo') as File

    if (!name || !phone || !address) {
      return NextResponse.json(
        { message: 'Name, phone, and address are required' },
        { status: 400 }
      )
    }

    // Check for existing customer with same phone number
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        phone: phone,
        createdBy: userId
      }
    })

    if (existingCustomer) {
      return NextResponse.json(
        { 
          message: 'Customer with this phone number already exists',
          existingCustomer: {
            id: existingCustomer.id,
            name: existingCustomer.name,
            phone: existingCustomer.phone,
            address: existingCustomer.address
          }
        },
        { status: 409 }
      )
    }

    let photoPath = null
    if (photo && photo.size > 0) {
      // In a real implementation, you would save the file to storage
      // For now, we'll just store the filename
      photoPath = `${Date.now()}_${photo.name}`
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        address,
        email: email || null,
        notes: notes || null,
        transportType: transportType || 'own',
        transportCost: parseFloat(transportCost) || 0,
        transportNotes: transportNotes || null,
        photoPath,
        createdBy: userId
      }
    })

    return NextResponse.json({
      message: 'Customer created successfully',
      customer: {
        ...customer,
        createdAt: customer.createdAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Customers POST error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
