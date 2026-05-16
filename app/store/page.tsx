'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Plus, Edit, Trash2, Store, AlertTriangle, TrendingUp, Eye, Search, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { Navbar } from '@/components/Navbar'

interface StoreItem {
  id: number
  description: string
  quantity: number
  unit: string
  dateIn: string
  transportCost: number
  transportType: 'own' | 'company'
  distance?: number
  customer?: {
    id: number
    name: string
  }
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function StorePage() {
  const [storeItems, setStoreItems] = useState<StoreItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'own' | 'company'>('all')
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchStoreItems()
  }, [])

  const fetchStoreItems = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/cargo?type=store', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Filter only store items
        const storeCargo = data.cargo.filter((item: any) => item.type === 'store')
        setStoreItems(storeCargo)
      } else {
        toast.error('Failed to fetch store items')
      }
    } catch (error) {
      toast.error('An error occurred while fetching store items')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item: StoreItem) => {
    setEditingItem(item)
    setShowEditModal(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingItem) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/cargo/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: editingItem.id,
          description: editingItem.description,
          quantity: editingItem.quantity,
          unit: editingItem.unit,
          transportCost: editingItem.transportCost,
          notes: editingItem.notes
        })
      })

      if (response.ok) {
        toast.success('Store item updated successfully')
        setShowEditModal(false)
        setEditingItem(null)
        fetchStoreItems()
      } else {
        const errorData = await response.json()
        console.error('Update error:', errorData)
        toast.error(`Failed to update: ${errorData.message || 'Unknown error'}`)
      }
    } catch (error) {
      toast.error('An error occurred while updating store item')
    }
  }

  const handleDelete = async (cargoId: number) => {
    if (!confirm('Are you sure you want to delete this store item?')) {
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
        toast.success('Store item deleted successfully')
        fetchStoreItems()
      } else {
        toast.error('Failed to delete store item')
      }
    } catch (error) {
      toast.error('An error occurred while deleting store item')
    }
  }

  // Calculate statistics
  const totalItems = storeItems.length
  const totalQuantity = storeItems.reduce((sum, item) => sum + item.quantity, 0)
  // const totalTransportCost = storeItems.reduce((sum, item) => sum + (item.transportCost || 0), 0)
  // const averageCostPerItem = totalItems > 0 ? totalTransportCost / totalItems : 0

  // Filter items based on search and filter
  const filteredItems = storeItems.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterType === 'all' // Temporarily disable transport type filter
    
    return matchesSearch && matchesFilter
  })

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
              <h1 className="text-3xl font-bold text-gray-900">Store Inventory</h1>
              <p className="text-gray-600 mt-2">Manage and track items in store storage</p>
            </div>
            <button
              onClick={() => router.push('/cargo')}
              className="btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Item
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-2xl font-semibold text-gray-900">{totalItems}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Store className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Quantity</p>
                  <p className="text-2xl font-semibold text-gray-900">{totalQuantity.toFixed(0)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Transport Cost</p>
                  <p className="text-2xl font-semibold text-gray-900">Tsh 0</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Cost per Item</p>
                  <p className="text-2xl font-semibold text-gray-900">Tsh 0</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by tracking number, description, or customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'own' | 'company')}
                  className="input-field"
                >
                  <option value="all">All Transport Types</option>
                  <option value="own">Own Transport</option>
                  <option value="company">Company Transport</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Store Items Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Store className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">
                {searchTerm || filterType !== 'all' ? 'No items found matching your criteria' : 'No store items found'}
              </p>
              <button
                onClick={() => router.push('/cargo')}
                className="mt-4 btn-primary"
              >
                Add Your First Store Item
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
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date In
                    </th>
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transport Cost
                    </th> */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-900">
                        {item.customer?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-medium">{item.quantity}</span> {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(item.dateIn).toLocaleDateString()}
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">Tsh {(item.transportCost || 0).toLocaleString()}</div>
                          <div className="text-xs text-gray-500">
                            {(item.transportType || 'own') === 'own' ? 'Own' : 'Company'} 
                            {item.distance && ` • ${item.distance}km`}
                          </div>
                        </div>
                      </td> */}
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
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
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

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Store Item</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingItem.quantity}
                  onChange={(e) => setEditingItem({...editingItem, quantity: parseFloat(e.target.value)})}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit
                </label>
                <select
                  value={editingItem.unit}
                  onChange={(e) => setEditingItem({...editingItem, unit: e.target.value})}
                  className="input-field"
                  required
                >
                  <option value="bags">Bags</option>
                  <option value="kgs">Kgs</option>
                  <option value="tons">Tons</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transport Cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editingItem.transportCost}
                  onChange={(e) => setEditingItem({...editingItem, transportCost: parseFloat(e.target.value)})}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={editingItem.notes || ''}
                  onChange={(e) => setEditingItem({...editingItem, notes: e.target.value})}
                  className="input-field"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingItem(null)
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Update Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
