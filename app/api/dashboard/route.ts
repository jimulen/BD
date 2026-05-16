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

    // Get total customers
    const totalCustomers = await prisma.customer.count({
      where: { createdBy: userId }
    })

    // Get recent customers (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentCustomers = await prisma.customer.count({
      where: {
        createdBy: userId,
        createdAt: { gte: sevenDaysAgo }
      }
    })

    // Get today's customers
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayCustomers = await prisma.customer.count({
      where: {
        createdBy: userId,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    // Get recent customers list (last 10)
    const recentCustomersList = await prisma.customer.findMany({
      where: { createdBy: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        email: true,
        photoPath: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      stats: {
        totalCustomers,
        recentCustomers,
        todayCustomers
      },
      recentCustomers: recentCustomersList.map(customer => ({
        ...customer,
        createdAt: customer.createdAt.toISOString()
      }))
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
