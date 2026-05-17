import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

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
    const customerName = searchParams.get('customerName')

    console.log('Debug API - userId:', userId)
    console.log('Debug API - customerName:', customerName)

    if (!customerName) {
      return NextResponse.json(
        { message: 'customerName is required' },
        { status: 400 }
      )
    }

    // First find the customer by name
    const customer = await prisma.customer.findFirst({
      where: {
        name: { contains: customerName },
        createdBy: userId
      }
    })

    if (!customer) {
      return NextResponse.json(
        { message: 'Customer not found' },
        { status: 404 }
      )
    }

    console.log('Debug API - found customer:', customer)

    // Test collections filtering
    const collections = await prisma.delivery.findMany({
      where: {
        createdBy: userId,
        customerId: customer.id
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        cargo: {
          select: {
            id: true,
            trackingNo: true,
            description: true,
            customerId: true,
            customer: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    // Test cargo filtering
    const cargo = await prisma.cargo.findMany({
      where: {
        createdBy: userId,
        customerId: customer.id,
        status: 'in_store'
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    })

    // Check for cargo-customer mismatches in collections
    const mismatchedCollections = collections.filter(c => 
      c.cargo && c.cargo.customerId !== customer.id
    )

    console.log('Debug API - collections found:', collections.length)
    console.log('Debug API - cargo found:', cargo.length)
    console.log('Debug API - mismatched collections:', mismatchedCollections.length)

    return NextResponse.json({
      message: 'Debug data retrieved',
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone
      },
      hasMismatches: mismatchedCollections.length > 0,
      mismatchedCollections: mismatchedCollections.map(c => ({
        id: c.id,
        trackingNo: c.trackingNo,
        customerName: c.customer?.name,
        customerId: c.customer?.id,
        cargoDescription: c.cargo?.description,
        cargoCustomerId: c.cargo?.customerId,
        cargoCustomerName: c.cargo?.customer?.name,
        productType: c.productType,
        quantity: c.quantity,
        status: c.status,
        issue: 'Collection belongs to this customer but cargo belongs to another customer'
      })),
      collections: collections.map(c => ({
        id: c.id,
        trackingNo: c.trackingNo,
        customerName: c.customer?.name,
        customerId: c.customer?.id,
        cargoDescription: c.cargo?.description,
        cargoCustomerId: c.cargo?.customerId,
        cargoCustomerName: c.cargo?.customer?.name,
        productType: c.productType,
        quantity: c.quantity,
        status: c.status
      })),
      cargo: cargo.map(c => ({
        id: c.id,
        trackingNo: c.trackingNo,
        description: c.description,
        customerId: c.customer?.id,
        customerName: c.customer?.name,
        status: c.status
      }))
    })
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
