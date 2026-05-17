'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Plus, Edit, Trash2, Clock, CheckCircle, AlertCircle, Store, Factory, Eye, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { Navbar } from '@/components/Navbar'

interface Cargo {
  id: number
  description: string
  type: 'store' | 'processing'
  status: 'in_transit' | 'in_store' | 'in_processing' | 'processed' | 'completed'
  quantity: number
  unit: string
  dateIn: string
  dateOut?: string
  transportCost: number
  customerId: number
  customer?: {
    id: number
    name: string
    phone: string
  }
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function CargoPage() {
  const [cargo, setCargo] = useState<Cargo[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    type: 'store' as 'store',
    quantity: '',
    unit: 'bags', // Default to bags since it's unprocessed rice
    dateIn: new Date().toISOString().slice(0, 16), // Current date/time as default
    transportCost: '', // Transport cost recorded at beginning
    customerId: '',
    notes: ''
  })
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [showCustomerHistory, setShowCustomerHistory] = useState(false)
  const [customerHistory, setCustomerHistory] = useState<any[]>([])
  const router = useRouter()

  // Auto-generate tracking number
  const generateTrackingNumber = () => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `BD-${timestamp}-${random}`
  }

  useEffect(() => {
    fetchCargo()
    fetchCustomers()
  }, [])

  const fetchCargo = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/cargo', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCargo(data.cargo)
      } else {
        toast.error('Failed to fetch cargo')
      }
    } catch (error) {
      toast.error('An error occurred while fetching cargo')
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
        setCustomers(data.customers)
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    }
  }

  const fetchCustomerCargoHistory = async (customerId: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/cargo?customerId=${customerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        return data.cargo
      }
    } catch (error) {
      console.error('Failed to fetch customer cargo history:', error)
      return []
    }
  }

  const handleCustomerSelect = async (customer: any) => {
    setSelectedCustomer(customer)
    setFormData({...formData, customerId: customer.id.toString()})
    setShowCustomerHistory(true)
    
    // Fetch customer's cargo history
    const history = await fetchCustomerCargoHistory(customer.id)
    setCustomerHistory(history)
  }

  const handleCustomerSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value
    setCustomerSearchTerm(searchTerm)
    
    if (searchTerm.length > 0) {
      // Search by name OR phone number
      const foundCustomer = customers.find(customer => 
        customer.phone === searchTerm || 
        customer.name.toLowerCase() === searchTerm.toLowerCase()
      )
      
      if (foundCustomer) {
        // Auto-select customer when exact match is found
        handleCustomerSelect(foundCustomer)
        toast(`Found: ${foundCustomer.name}`, {
          icon: '✅',
          style: {
            background: '#10B981',
            color: '#fff',
          }
        })
      }
    }
  }

  const handleNewCustomer = () => {
    setSelectedCustomer(null)
    setFormData({...formData, customerId: ''})
    setShowCustomerHistory(false)
    setCustomerHistory([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.description || !formData.quantity || !formData.dateIn) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/cargo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: formData.description,
          type: formData.type,
          quantity: parseFloat(formData.quantity),
          unit: formData.unit,
          dateIn: formData.dateIn,
          transportCost: parseFloat(formData.transportCost) || 0,
          customerId: formData.customerId ? parseInt(formData.customerId) : null,
          notes: formData.notes
        })
      })

      if (response.ok) {
        toast.success('Cargo added successfully!')
        setShowAddForm(false)
        const resetForm = () => {
          setFormData({
            description: '',
            type: 'store',
            quantity: '',
            unit: 'bags',
            dateIn: new Date().toISOString().slice(0, 16),
            transportCost: '',
            customerId: '',
            notes: ''
          })
        }
        resetForm()
        fetchCargo()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to add cargo')
      }
    } catch (error) {
      toast.error('An error occurred while adding cargo')
    }
  }

  const handleStatusUpdate = async (cargoId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/cargo/${cargoId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        toast.success('Cargo status updated successfully!')
        fetchCargo()
      } else {
        toast.error('Failed to update cargo status')
      }
    } catch (error) {
      toast.error('An error occurred while updating status')
    }
  }

  const handleDelete = async (cargoId: number) => {
    if (!confirm('Are you sure you want to delete this cargo?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/cargo/${cargoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success('Cargo deleted successfully')
        fetchCargo()
      } else {
        toast.error('Failed to delete cargo')
      }
    } catch (error) {
      toast.error('An error occurred while deleting cargo')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_transit': return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'in_store': return <Store className="h-4 w-4 text-blue-500" />
      case 'in_processing': return <Factory className="h-4 w-4 text-purple-500" />
      case 'processed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_transit': return 'bg-yellow-100 text-yellow-800'
      case 'in_store': return 'bg-blue-100 text-blue-800'
      case 'in_processing': return 'bg-purple-100 text-purple-800'
      case 'processed': return 'bg-green-100 text-green-800'
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
            <h1 className="text-3xl font-bold text-gray-900">Cargo Management</h1>
            <p className="text-gray-600 mt-2">Track and manage cargo for store and processing</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Cargo
          </button>
        </div>

        {/* Add Cargo Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Add New Cargo</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cargo Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as 'store'})}
                    className="input-field"
                    required
                  >
                    <option value="store">Store Storage</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Store items will be automatically available in store inventory
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="input-field"
                    placeholder="Cargo description"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer
                  </label>
                  {selectedCustomer ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-green-800">{selectedCustomer.name}</p>
                          <p className="text-sm text-green-600">{selectedCustomer.phone}</p>
                          {selectedCustomer.address && (
                            <p className="text-xs text-green-500">{selectedCustomer.address}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleNewCustomer}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Change Customer
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCustomerHistory(!showCustomerHistory)}
                        className="mt-2 w-full text-sm bg-green-100 text-green-800 py-1 px-2 rounded hover:bg-green-200"
                      >
                        {showCustomerHistory ? 'Hide' : 'Show'} Cargo History ({selectedCustomer.name})
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quick Customer Search
                        </label>
                        <input
                          type="text"
                          placeholder="Type customer name OR phone number..."
                          value={customerSearchTerm}
                          onChange={handleCustomerSearch}
                          className="input-field"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Type exact name or phone to select customer automatically
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Or Select from List
                        </label>
                        <select
                          value={formData.customerId}
                          onChange={(e) => {
                            const customerId = e.target.value
                            setFormData({...formData, customerId})
                            if (customerId) {
                              const customer = customers.find(c => c.id.toString() === customerId)
                              if (customer) {
                                handleCustomerSelect(customer)
                              }
                            }
                          }}
                          className="input-field"
                        >
                          <option value="">Choose customer...</option>
                          {customers.map((customer) => (
                            <option key={customer.id} value={customer.id}>
                              {customer.name} - {customer.phone}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      className="input-field flex-1"
                      placeholder="0.00"
                      required
                    />
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="input-field w-24"
                    >
                      <option value="bags">Bags</option>
                    </select>
                  </div>
                </div>
                {/* Transport cost fields - temporarily disabled until database is updated
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transport Type
                  </label>
                  <select
                    value={formData.transportType}
                    onChange={(e) => setFormData({...formData, transportType: e.target.value as 'own' | 'company'})}
                    className="input-field"
                  >
                    <option value="own">Own Transport</option>
                    <option value="company">Company Transport</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transport Cost (Tsh)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.transportCost}
                    onChange={(e) => setFormData({...formData, transportCost: e.target.value})}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distance (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.distance}
                    onChange={(e) => setFormData({...formData, distance: e.target.value})}
                    className="input-field"
                    placeholder="0.0"
                  />
                </div>
                */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date In
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="datetime-local"
                      value={formData.dateIn}
                      onChange={(e) => setFormData({...formData, dateIn: e.target.value})}
                      className="input-field pl-10"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Default is current date/time, can be adjusted as needed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transport Cost (Tsh)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.transportCost}
                    onChange={(e) => setFormData({...formData, transportCost: e.target.value})}
                    className="input-field"
                    placeholder="Enter transport cost"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="input-field"
                    rows={3}
                    placeholder="Additional notes about cargo"
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
                  Add Cargo
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Customer Cargo History */}
        {showCustomerHistory && selectedCustomer && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Cargo History for {selectedCustomer.name}
            </h3>
            {!customerHistory || customerHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p>No cargo history found for this customer</p>
                <p className="text-sm">This will be their first cargo transaction</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tracking No</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date In</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customerHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 text-sm">{item.description}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            item.type === 'store' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {item.type === 'store' ? 'Store' : 'Processing'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">{item.quantity} {item.unit}</td>
                        <td className="px-4 py-2 text-sm">{new Date(item.dateIn).toLocaleDateString()}</td>
                        <td className="px-4 py-2 text-sm">
                          {item.transportCost ? `${item.transportCost.toLocaleString()} Tsh` : '-'}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            item.status === 'completed' ? 'bg-green-100 text-green-800' :
                            item.status === 'in_store' ? 'bg-blue-100 text-blue-800' :
                            item.status === 'in_processing' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                <strong>Quick Start:</strong> Customer is already selected. Just fill in the cargo details above to create a new transaction for {selectedCustomer.name}.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Cargo List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {cargo.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No cargo records found</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 btn-primary"
            >
              Add Your First Cargo
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
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transport Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Out
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
                {cargo.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-900">
                      {item.customer?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        item.type === 'store' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {item.type === 'store' ? 'Store' : 'Processing'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.dateIn).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.transportCost ? `${item.transportCost.toLocaleString()} Tsh` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.dateOut ? new Date(item.dateOut).toLocaleString() : '-'}
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
                          onClick={() => router.push(`/cargo/${item.id}`)}
                          className="text-green-600 hover:text-green-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (item.type === 'store' && item.status === 'in_store') {
                              toast('Store items are already in store inventory', {
        icon: 'ℹ️',
        style: {
          background: '#3B82F6',
          color: '#fff',
        }
      })
                              return
                            }
                            handleStatusUpdate(item.id, 
                              item.status === 'in_transit' ? 'in_store' : 
                              item.status === 'in_store' ? 'in_processing' : 
                              item.status === 'in_processing' ? 'processed' : 
                              item.status === 'processed' ? 'completed' : 'in_transit'
                            )
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title={item.type === 'store' && item.status === 'in_store' ? 'Already in Store' : 'Update Status'}
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
