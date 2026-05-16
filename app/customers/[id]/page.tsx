'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Truck, Coins, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { Navbar } from '@/components/Navbar'

interface Customer {
  id: number
  name: string
  phone: string
  address: string
  email?: string
  photoPath?: string
  notes?: string
  transportType: string
  transportCost: number
  transportNotes?: string
  createdAt: string
  updatedAt: string
}

export default function CustomerViewPage({ params }: { params: { id: string } }) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchCustomer()
  }, [params.id])

  const fetchCustomer = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/customers/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCustomer(data.customer)
      } else {
        toast.error('Failed to fetch customer')
        router.push('/customers')
      }
    } catch (error) {
      toast.error('An error occurred while fetching customer')
      router.push('/customers')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this customer?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/customers/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success('Customer deleted successfully')
        router.push('/customers')
      } else {
        toast.error('Failed to delete customer')
      }
    } catch (error) {
      toast.error('An error occurred while deleting customer')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Customer not found</p>
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
        <button
          onClick={() => router.push('/customers')}
          className="flex items-center text-primary-600 hover:text-primary-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Customers
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-gray-600 mt-2">Customer Details</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => router.push(`/customers/${customer.id}/edit`)}
              className="btn-secondary flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {customer.photoPath ? (
                    <img
                      src={`/uploads/${customer.photoPath}`}
                      alt={customer.name}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-bold text-xl">
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{customer.name}</h3>
                  <p className="text-sm text-gray-500">Customer since {new Date(customer.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{customer.phone}</span>
                </div>
                
                {customer.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{customer.email}</span>
                  </div>
                )}
                
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                  <span className="text-sm text-gray-900">{customer.address}</span>
                </div>
              </div>
            </div>

            {customer.notes && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Transport Information */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Truck className="h-5 w-5 text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Transport Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Transport Type</h4>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  customer.transportType === 'own'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {customer.transportType === 'own' ? 'Own Transport' : 'Company Transport'}
                </span>
              </div>

              {customer.transportType === 'company' && (
                <>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Transport Cost</h4>
                    <div className="flex items-center space-x-1">
                      <Coins className="h-4 w-4 text-gray-400" />
                      <span className="text-lg font-semibold text-gray-900">
                        Tsh {customer.transportCost.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {customer.transportNotes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Transport Notes</h4>
                      <p className="text-sm text-gray-600">{customer.transportNotes}</p>
                    </div>
                  )}
                </>
              )}

              {customer.transportType === 'own' && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Cost</h4>
                  <span className="text-sm text-green-600 font-medium">No transport cost</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
