'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Plus, Edit, Trash2, Truck, Calendar, Search, CheckCircle, Clock, AlertCircle, PackageSearch } from 'lucide-react'
import toast from 'react-hot-toast'
import { Navbar } from '@/components/Navbar'

interface Collection {
  id: number
  customer: {
    id: number
    name: string
    phone: string
  }
  cargo?: {
    id: number
    trackingNo: string
    description: string
    transportCost?: number
    quantity: number
  }
  productType: 'stored_bags' | 'processed_rice'
  quantity: number
  unit: string
  status: 'picked_up' | 'delivered' | 'completed'
  pickupDate: string
  deliveryDate?: string
  notes?: string
  bagsToProcess?: number
  remainingBags?: number
  createdAt: string
  updatedAt: string
  costCalculation?: {
    totalCost: number
    description: string
    fairTransportCost?: number
  }
}

interface Customer {
  id: number
  name: string
  phone: string
}

interface Cargo {
  id: number
  trackingNo: string
  description: string
  status: string
  quantity: number
  unit: string
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [availableCargo, setAvailableCargo] = useState<any[]>([])
  const [selectedCargo, setSelectedCargo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [formData, setFormData] = useState({
    customerId: '',
    cargoId: '',
    productType: 'processed_rice',
    bagsToProcess: '',
    quantity: '',
    unit: 'kgs',
    pickupDate: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const router = useRouter()

  useEffect(() => {
    fetchCollections()
    fetchCustomers()
    fetchAvailableCargo()
  }, [])

  const fetchCollections = async () => {
    try {
      const token = localStorage.getItem('token')
      const url = selectedCustomerId ? `/api/collections?customerId=${selectedCustomerId}` : '/api/collections'
      console.log('Fetching collections from URL:', url) // Debug log
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Collections data received:', data.collections[0]) // Debug log
        setCollections(data.collections || [])
        setLoading(false)
      } else {
        toast.error('Failed to fetch collections')
        setLoading(false)
      }
    } catch (error) {
      toast.error('An error occurred while fetching collections')
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/customers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers || [])
      } else {
        toast.error('Failed to fetch customers')
      }
    } catch (error) {
      toast.error('An error occurred while fetching customers')
    }
  }

  const fetchAvailableCargo = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/cargo?type=store', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Cargo response:', data.cargo) // Debug log
        setAvailableCargo(data.cargo || data.cargo || [])
      }
    } catch (error) {
      console.error('Failed to fetch available cargo:', error)
    }
  }

  const generateTrackingNumber = () => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
    return `DL-${timestamp}-${random}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.customerId || !formData.quantity || !formData.pickupDate) {
      toast.error('Please fill in all required fields')
      return
    }

    // Auto-generate tracking number
    const trackingNo = generateTrackingNumber()

    try {
      const token = localStorage.getItem('token')
      const submissionData = {
          customerId: formData.customerId,
          cargoId: formData.cargoId || null,
          productType: formData.productType,
          quantity: parseFloat(formData.quantity),
          unit: formData.unit,
          pickupDate: formData.pickupDate,
          notes: formData.notes,
          bagsToProcess: parseInt(formData.bagsToProcess),
          trackingNo,
        }
        
        console.log('Frontend submitting data:', submissionData)

        const response = await fetch('/api/collections', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submissionData)
        })

      if (response.ok) {
        toast.success('Collection record added successfully!')
        setShowAddForm(false)
        setFormData({
          customerId: '',
          cargoId: '',
          productType: 'processed_rice',
          bagsToProcess: '',
          quantity: '',
          unit: 'kgs',
          pickupDate: new Date().toISOString().split('T')[0],
          notes: ''
        })
        setSelectedCustomerId('') // Clear customer filter to show all collections
        fetchCollections()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to add collection record')
      }
    } catch (error) {
      toast.error('An error occurred while adding collection record')
    }
  }

  const handleStatusUpdate = async (collectionId: number, newStatus: 'picked_up' | 'delivered' | 'completed') => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/collections/${collectionId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        toast.success('Collection status updated successfully!')
        fetchCollections()
      } else {
        toast.error('Failed to update collection status')
      }
    } catch (error) {
      toast.error('An error occurred while updating status')
    }
  }

  const handleDelete = async (collectionId: number) => {
    if (!confirm('Are you sure you want to delete this collection record?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/collections/${collectionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success('Collection record deleted successfully')
        fetchCollections()
      } else {
        toast.error('Failed to delete collection record')
      }
    } catch (error) {
      toast.error('An error occurred while deleting collection record')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'picked_up': return <Package className="h-4 w-4 text-blue-500" />
      case 'delivered': return <Truck className="h-4 w-4 text-orange-500" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'picked_up': return 'bg-blue-100 text-blue-800'
      case 'delivered': return 'bg-orange-100 text-orange-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Deliveries</h1>
            <p className="text-gray-600 mt-2">Manage customer pickups and deliveries for stored bags and processed rice</p>
          </div>
          <button
            onClick={() => {
              setSelectedCustomerId('')
              fetchCollections()
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <Search className="h-4 w-4 mr-2" />
            Show All Customers
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Delivery
          </button>
        </div>

        {/* Add Delivery Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Add New Delivery Record</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer *
                  </label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => {
        const customerId = e.target.value
        setFormData({...formData, customerId})
        setSelectedCustomerId(customerId)
        fetchCollections() // Re-fetch collections for selected customer
      }}
                    className="input-field"
                    required
                  >
                    <option value="">Select customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </option>
                    ))}
                  </select>
                </div>
                                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Cargo (Optional)
                  </label>
                  <select
                    value={formData.cargoId || ''}
                    onChange={(e) => {
                      const cargoId = e.target.value
                      setFormData({...formData, cargoId: cargoId})
                      const cargo = availableCargo.find(c => c.id === cargoId)
                      setSelectedCargo(cargo)
                    }}
                    className="input-field"
                  >
                    <option value="">No specific cargo</option>
                    {availableCargo.map((cargo) => (
                      <option key={cargo.id} value={cargo.id}>
                        {cargo.description} - {cargo.quantity} {cargo.unit} (Transport: {cargo.transportCost} Tsh)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Type *
                  </label>
                  <select
                    value={formData.productType}
                    onChange={(e) => setFormData({...formData, productType: e.target.value as 'processed_rice'})}
                    className="input-field"
                    required
                  >
                    <option value="processed_rice">Processed Rice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bags to Process *
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max={selectedCargo?.quantity || 999}
                      value={formData.bagsToProcess}
                      onChange={(e) => setFormData({...formData, bagsToProcess: e.target.value})}
                      className="input-field flex-1"
                      required
                    />
                    <span className="text-sm text-gray-600">
                      of {selectedCargo?.quantity || 0} available bags
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity (kg) *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      className="input-field flex-1"
                      required
                    />
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="input-field w-24"
                      required
                    >
                      <option value="kgs">kgs</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="datetime-local"
                      value={formData.pickupDate}
                      onChange={(e) => setFormData({...formData, pickupDate: e.target.value})}
                      className="input-field pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">When customer will pick up the product</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="input-field"
                    rows={2}
                    placeholder="Additional delivery notes"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Add Collection Record
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Collection Records */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {collections.length === 0 ? (
          <div className="text-center py-12">
            <PackageSearch className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No collection records found</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 btn-primary"
            >
              Add Your First Collection Record
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bags Processed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remaining Bags
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transport Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Cost
                    </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pickup Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {collections.map((item: Collection) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">{item.customer.name}</span>
                        <p className="text-xs text-gray-500">{item.customer.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.productType === 'stored_bags' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.productType === 'stored_bags' ? 'Stored Bags' : 'Processed Rice'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.bagsToProcess !== undefined ? `${item.bagsToProcess} bags` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.remainingBags !== undefined ? `${item.remainingBags} bags` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.productType === 'processed_rice' ? '60 Tsh' : 
                        item.costCalculation && item.costCalculation.totalCost ? `${(item.costCalculation.totalCost / item.quantity).toFixed(0)} Tsh` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.costCalculation && item.costCalculation.fairTransportCost !== undefined ? 
                        `${item.costCalculation.fairTransportCost.toFixed(0)} Tsh` 
                        : item.costCalculation && item.productType === 'processed_rice' ? '0 Tsh' : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.costCalculation && item.costCalculation.totalCost ? `${item.costCalculation.totalCost.toLocaleString()} Tsh` : 
                        item.productType === 'processed_rice' ? `${(60 * item.quantity).toLocaleString()} Tsh` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.pickupDate).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.deliveryDate ? new Date(item.deliveryDate).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(item.status)}
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                          {item.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleStatusUpdate(item.id, 
                            item.status === 'pending' ? 'picked_up' : 
                            item.status === 'picked_up' ? 'delivered' : 
                            item.status === 'delivered' ? 'completed' : 'pending'
                          )}
                          className="text-blue-600 hover:text-blue-900"
                          title="Update Status"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
