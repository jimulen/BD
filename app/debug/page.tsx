'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

export default function DebugPage() {
  const [customerName, setCustomerName] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testCustomerFiltering = async () => {
    if (!customerName) {
      toast.error('Please enter a customer name')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/debug?customerName=${encodeURIComponent(customerName)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setResult(data)
        console.log('Debug result:', data)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to fetch debug data')
      }
    } catch (error) {
      toast.error('An error occurred')
      console.error('Debug error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Customer Transaction Debug</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Customer Filtering</h2>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter Customer Name (e.g., Francis, Jonia)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={testCustomerFiltering}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test'}
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Enter a customer name to see their exact collections and cargo from the database
          </p>
        </div>

        {result && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">
                Customer: {result.customer?.name} (ID: {result.customer?.id}) - Results
              </h3>
              
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">
                  Collections ({result.collections?.length || 0})
                </h4>
                {result.collections?.length > 0 ? (
                  <div className="space-y-2">
                    {result.collections.map((collection: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded p-3">
                        <div className="text-sm">
                          <strong>Tracking:</strong> {collection.trackingNo}<br/>
                          <strong>Customer:</strong> {collection.customerName} (ID: {collection.customerId})<br/>
                          <strong>Cargo:</strong> {collection.cargoDescription}<br/>
                          <strong>Cargo Customer:</strong> {collection.cargoCustomerName} (ID: {collection.cargoCustomerId})<br/>
                          <strong>Product:</strong> {collection.productType}<br/>
                          <strong>Quantity:</strong> {collection.quantity} {collection.unit}<br/>
                          <strong>Status:</strong> {collection.status}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No collections found for this customer</p>
                )}
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">
                  Available Cargo ({result.cargo?.length || 0})
                </h4>
                {result.cargo?.length > 0 ? (
                  <div className="space-y-2">
                    {result.cargo.map((item: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded p-3">
                        <div className="text-sm">
                          <strong>Tracking:</strong> {item.trackingNo}<br/>
                          <strong>Description:</strong> {item.description}<br/>
                          <strong>Customer:</strong> {item.customerName} (ID: {item.customerId})<br/>
                          <strong>Status:</strong> {item.status}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No cargo found for this customer</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
