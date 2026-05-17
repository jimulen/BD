'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Package, TrendingUp, AlertTriangle, Store, Truck, Clock, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { Navbar } from '@/components/Navbar'

interface DashboardStats {
  totalCustomers: number
  totalCargo: number
  storeItems: number
  processingItems: number
  recentCargo: any[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalCargo: 0,
    storeItems: 0,
    processingItems: 0,
    recentCargo: []
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Fetch all data in parallel
      const [customersRes, cargoRes] = await Promise.all([
        fetch('/api/customers', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/cargo', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (customersRes.ok && cargoRes.ok) {
        const customersData = await customersRes.json()
        const cargoData = await cargoRes.json()
        
        const cargo = cargoData.cargo || []
        const storeItems = cargo.filter((item: any) => item.type === 'store')
        const processingItems = cargo.filter((item: any) => item.type === 'processing')
        const recentCargo = cargo.slice(0, 5) // Last 5 cargo items

        setStats({
          totalCustomers: customersData.customers?.length || 0,
          totalCargo: cargo.length,
          storeItems: storeItems.length,
          processingItems: processingItems.length,
          recentCargo
        })
      } else {
        toast.error('Failed to fetch dashboard data')
      }
    } catch (error) {
      toast.error('An error occurred while loading dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onLogout={() => {
        localStorage.removeItem('token')
        router.push('/')
      }} />
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your business operations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cargo</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalCargo}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Store className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Store Items</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.storeItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Truck className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Processing Items</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.processingItems}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Cargo */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Cargo</h3>
          </div>
          <div className="p-6">
            {stats.recentCargo.length === 0 ? (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No cargo records yet</p>
                <button
                  onClick={() => router.push('/cargo')}
                  className="mt-4 btn-primary"
                >
                  Add First Cargo
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.recentCargo.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {item.trackingNo}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {item.description}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {item.customer?.name || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            item.type === 'store' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {item.type === 'store' ? 'Store' : 'Processing'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            item.status === 'completed' ? 'bg-green-100 text-green-800' :
                            item.status === 'in_store' ? 'bg-blue-100 text-blue-800' :
                            item.status === 'in_processing' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(item.dateIn).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => router.push('/customers/add')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left group"
          >
            <Users className="h-8 w-8 text-blue-600 mb-3 group-hover:text-blue-700" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Customer</h3>
            <p className="text-sm text-gray-600">Register a new customer</p>
          </button>

          <button
            onClick={() => router.push('/cargo')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left group"
          >
            <Package className="h-8 w-8 text-green-600 mb-3 group-hover:text-green-700" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Cargo</h3>
            <p className="text-sm text-gray-600">Create new cargo transaction</p>
          </button>

          <button
            onClick={() => router.push('/store')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left group"
          >
            <Store className="h-8 w-8 text-purple-600 mb-3 group-hover:text-purple-700" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">View Store</h3>
            <p className="text-sm text-gray-600">Check store inventory</p>
          </button>
        </div>
      </div>
    </div>
  )
}
