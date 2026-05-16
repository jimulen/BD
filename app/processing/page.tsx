'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Factory, Plus, Edit, Trash2, Package, ArrowRight, Calendar, Search } from 'lucide-react'
import toast from 'react-hot-toast'

interface Processing {
  id: number
  cargo: {
    id: number
    trackingNo: string
    description: string
  }
  inputType: string
  inputQty: number
  inputUnit: string
  outputType: string
  outputQty: number
  outputUnit: string
  dateProcessed: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface Cargo {
  id: number
  trackingNo: string
  description: string
  status: string
  quantity: number
  unit: string
}

export default function ProcessingPage() {
  const [processing, setProcessing] = useState<Processing[]>([])
  const [availableCargo, setAvailableCargo] = useState<Cargo[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    cargoId: '',
    inputType: 'raw_material',
    inputQty: '',
    inputUnit: 'kgs',
    outputType: 'rice',
    outputQty: '',
    outputUnit: 'kgs',
    dateProcessed: '',
    notes: ''
  })
  const router = useRouter()

  useEffect(() => {
    fetchProcessing()
    fetchAvailableCargo()
  }, [])

  const fetchProcessing = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/processing', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProcessing(data.processing)
      } else {
        toast.error('Failed to fetch processing records')
      }
    } catch (error) {
      toast.error('An error occurred while fetching processing records')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableCargo = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/cargo?status=in_store', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAvailableCargo(data.cargo)
      }
    } catch (error) {
      console.error('Failed to fetch available cargo:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.cargoId || !formData.inputQty || !formData.outputQty || !formData.dateProcessed) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/processing', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          inputQty: parseFloat(formData.inputQty),
          outputQty: parseFloat(formData.outputQty),
          cargoId: parseInt(formData.cargoId)
        })
      })

      if (response.ok) {
        toast.success('Processing record added successfully!')
        setShowAddForm(false)
        setFormData({
          cargoId: '',
          inputType: 'raw_material',
          inputQty: '',
          inputUnit: 'kgs',
          outputType: 'rice',
          outputQty: '',
          outputUnit: 'kgs',
          dateProcessed: '',
          notes: ''
        })
        fetchProcessing()
        fetchAvailableCargo()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to add processing record')
      }
    } catch (error) {
      toast.error('An error occurred while adding processing record')
    }
  }

  const handleDelete = async (processingId: number) => {
    if (!confirm('Are you sure you want to delete this processing record?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/processing/${processingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success('Processing record deleted successfully')
        fetchProcessing()
      } else {
        toast.error('Failed to delete processing record')
      }
    } catch (error) {
      toast.error('An error occurred while deleting processing record')
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
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Processing Management</h1>
            <p className="text-gray-600 mt-2">Track raw material processing (parks → rice)</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Processing
          </button>
        </div>

        {/* Add Processing Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Add New Processing Record</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Cargo *
                  </label>
                  <select
                    value={formData.cargoId}
                    onChange={(e) => setFormData({...formData, cargoId: e.target.value})}
                    className="input-field"
                    required
                  >
                    <option value="">Select cargo from store</option>
                    {availableCargo.map((cargo) => (
                      <option key={cargo.id} value={cargo.id}>
                        {cargo.trackingNo} - {cargo.description} ({cargo.quantity} {cargo.unit})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Only cargo in store can be processed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Input Type *
                  </label>
                  <select
                    value={formData.inputType}
                    onChange={(e) => setFormData({...formData, inputType: e.target.value})}
                    className="input-field"
                    required
                  >
                    <option value="raw_material">Raw Material</option>
                    <option value="park">Park</option>
                    <option value="grain">Grain</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Input Quantity *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.inputQty}
                      onChange={(e) => setFormData({...formData, inputQty: e.target.value})}
                      className="input-field flex-1"
                      placeholder="0.00"
                      required
                    />
                    <select
                      value={formData.inputUnit}
                      onChange={(e) => setFormData({...formData, inputUnit: e.target.value})}
                      className="input-field w-24"
                    >
                      <option value="kgs">Kgs</option>
                      <option value="bags">Bags</option>
                      <option value="tons">Tons</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Output Type *
                  </label>
                  <select
                    value={formData.outputType}
                    onChange={(e) => setFormData({...formData, outputType: e.target.value})}
                    className="input-field"
                    required
                  >
                    <option value="rice">Rice</option>
                    <option value="flour">Flour</option>
                    <option value="grain">Grain</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Output Quantity *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.outputQty}
                      onChange={(e) => setFormData({...formData, outputQty: e.target.value})}
                      className="input-field flex-1"
                      placeholder="0.00"
                      required
                    />
                    <select
                      value={formData.outputUnit}
                      onChange={(e) => setFormData({...formData, outputUnit: e.target.value})}
                      className="input-field w-24"
                    >
                      <option value="kgs">Kgs</option>
                      <option value="bags">Bags</option>
                      <option value="tons">Tons</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Processed *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="datetime-local"
                      value={formData.dateProcessed}
                      onChange={(e) => setFormData({...formData, dateProcessed: e.target.value})}
                      className="input-field pl-10"
                      required
                    />
                  </div>
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
                    placeholder="Additional notes about this processing"
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
                  Add Processing Record
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Processing Records */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {processing.length === 0 ? (
          <div className="text-center py-12">
            <Factory className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No processing records found</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 btn-primary"
            >
              Add Your First Processing Record
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cargo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Input
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Output
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Processed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processing.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <span className="font-medium text-gray-900">{item.cargo.trackingNo}</span>
                          <p className="text-xs text-gray-500">{item.cargo.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">{item.inputQty} {item.inputUnit}</span>
                        <p className="text-xs text-gray-500">{item.inputType}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <span className="font-medium text-green-600">{item.outputQty} {item.outputUnit}</span>
                        <p className="text-xs text-gray-500">{item.outputType}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.dateProcessed).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/cargo/${item.cargo.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Cargo"
                        >
                          <Package className="h-4 w-4" />
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
  )
}
