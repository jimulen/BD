'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3, TrendingUp, Users, Package, DollarSign, Calendar, Download } from 'lucide-react'
import { Navbar } from '@/components/Navbar'

interface ReportData {
  dailyReports: DailyReport[]
  customerReports: CustomerReport[]
  cargoReports: CargoReport[]
  financialReports: FinancialReport[]
}

interface DailyReport {
  date: string
  totalCollections: number
  totalRevenue: number
  processingRevenue: number
  transportRevenue: number
  bagsProcessed: number
}

interface CustomerReport {
  customerId: number
  customerName: string
  totalCollections: number
  totalSpent: number
  bagsProcessed: number
  lastCollection: string
}

interface CargoReport {
  cargoId: number
  description: string
  originalBags: number
  processedBags: number
  remainingBags: number
  utilizationRate: number
}

interface FinancialReport {
  period: string
  totalRevenue: number
  processingRevenue: number
  transportRevenue: number
  totalCollections: number
  averagePerCollection: number
}

export default function ReportsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'daily' | 'customers' | 'cargo' | 'financial'>('daily')
  const [reportData, setReportData] = useState<ReportData>({
    dailyReports: [],
    customerReports: [],
    cargoReports: [],
    financialReports: []
  })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchReports()
  }, [dateRange])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      // Fetch all data needed for reports
      const [collectionsRes, cargoRes, customersRes] = await Promise.all([
        fetch(`/api/collections?startDate=${dateRange.start}&endDate=${dateRange.end}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/cargo', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/customers', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      const [collections, cargo, customers] = await Promise.all([
        collectionsRes.json(),
        cargoRes.json(),
        customersRes.json()
      ])

      // Process reports
      const reports = processReports(collections.collections || [], cargo.cargo || [], customers.customers || [])
      setReportData(reports)
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const processReports = (collections: any[], cargo: any[], customers: any[]): ReportData => {
    // Daily Reports
    const dailyReports = processDailyReports(collections)
    
    // Customer Reports
    const customerReports = processCustomerReports(collections, customers)
    
    // Cargo Reports
    const cargoReports = processCargoReports(collections, cargo)
    
    // Financial Reports
    const financialReports = processFinancialReports(collections)

    return {
      dailyReports,
      customerReports,
      cargoReports,
      financialReports
    }
  }

  const processDailyReports = (collections: any[]): DailyReport[] => {
    const dailyMap = new Map<string, DailyReport>()
    
    collections.forEach(collection => {
      const date = new Date(collection.pickupDate).toISOString().split('T')[0]
      
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          totalCollections: 0,
          totalRevenue: 0,
          processingRevenue: 0,
          transportRevenue: 0,
          bagsProcessed: 0
        })
      }
      
      const report = dailyMap.get(date)!
      report.totalCollections++
      report.totalRevenue += collection.costCalculation?.totalCost || 0
      report.processingRevenue += collection.productType === 'processed_rice' ? 60 * collection.quantity : 500 * collection.quantity
      report.transportRevenue += collection.costCalculation?.fairTransportCost || 0
      report.bagsProcessed += collection.bagsToProcess || 0
    })
    
    return Array.from(dailyMap.values()).sort((a, b) => b.date.localeCompare(a.date))
  }

  const processCustomerReports = (collections: any[], customers: any[]): CustomerReport[] => {
    const customerMap = new Map<number, CustomerReport>()
    
    collections.forEach(collection => {
      const customerId = collection.customer.id
      
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          customerId,
          customerName: collection.customer.name,
          totalCollections: 0,
          totalSpent: 0,
          bagsProcessed: 0,
          lastCollection: ''
        })
      }
      
      const report = customerMap.get(customerId)!
      report.totalCollections++
      report.totalSpent += collection.costCalculation?.totalCost || 0
      report.bagsProcessed += collection.bagsToProcess || 0
      report.lastCollection = collection.pickupDate > report.lastCollection ? collection.pickupDate : report.lastCollection
    })
    
    return Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent)
  }

  const processCargoReports = (collections: any[], cargo: any[]): CargoReport[] => {
    const cargoMap = new Map<number, CargoReport>()
    
    // Initialize cargo reports
    cargo.forEach(c => {
      cargoMap.set(c.id, {
        cargoId: c.id,
        description: c.description,
        originalBags: c.quantity,
        processedBags: 0,
        remainingBags: c.quantity,
        utilizationRate: 0
      })
    })
    
    // Calculate processed bags
    collections.forEach(collection => {
      if (collection.cargo) {
        const report = cargoMap.get(collection.cargo.id)
        if (report) {
          report.processedBags += collection.bagsToProcess || 0
          report.remainingBags = collection.cargo.quantity
          report.utilizationRate = (report.processedBags / report.originalBags) * 100
        }
      }
    })
    
    return Array.from(cargoMap.values()).sort((a, b) => b.utilizationRate - a.utilizationRate)
  }

  const processFinancialReports = (collections: any[]): FinancialReport[] => {
    const monthlyMap = new Map<string, FinancialReport>()
    
    collections.forEach(collection => {
      const month = new Date(collection.pickupDate).toISOString().substring(0, 7) // YYYY-MM
      
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, {
          period: month,
          totalRevenue: 0,
          processingRevenue: 0,
          transportRevenue: 0,
          totalCollections: 0,
          averagePerCollection: 0
        })
      }
      
      const report = monthlyMap.get(month)!
      report.totalRevenue += collection.costCalculation?.totalCost || 0
      report.processingRevenue += collection.productType === 'processed_rice' ? 60 * collection.quantity : 500 * collection.quantity
      report.transportRevenue += collection.costCalculation?.fairTransportCost || 0
      report.totalCollections++
    })
    
    // Calculate averages
    monthlyMap.forEach(report => {
      report.averagePerCollection = report.totalCollections > 0 ? report.totalRevenue / report.totalCollections : 0
    })
    
    return Array.from(monthlyMap.values()).sort((a, b) => b.period.localeCompare(a.period))
  }

  const exportReport = (type: string) => {
    const data = type === 'daily' ? reportData.dailyReports :
                  type === 'customers' ? reportData.customerReports :
                  type === 'cargo' ? reportData.cargoReports :
                  reportData.financialReports

    const csv = convertToCSV(data)
    downloadCSV(csv, `${type}-report-${dateRange.start}-to-${dateRange.end}.csv`)
  }

  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return ''
    
    const headers = Object.keys(data[0])
    const csvHeaders = headers.join(',')
    const csvRows = data.map(row => 
      headers.map(header => `"${row[header] || ''}"`).join(',')
    )
    
    return [csvHeaders, ...csvRows].join('\n')
  }

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading reports...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Business Reports</h1>
          <p className="text-gray-600">Comprehensive business analytics and insights</p>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => exportReport(activeTab)}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export {activeTab}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'daily', name: 'Daily Reports', icon: Calendar },
                { id: 'customers', name: 'Customer Activity', icon: Users },
                { id: 'cargo', name: 'Cargo Status', icon: Package },
                { id: 'financial', name: 'Financial Performance', icon: DollarSign }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5 mr-2 inline" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'daily' && <DailyReportsTab reports={reportData.dailyReports} />}
            {activeTab === 'customers' && <CustomerReportsTab reports={reportData.customerReports} />}
            {activeTab === 'cargo' && <CargoReportsTab reports={reportData.cargoReports} />}
            {activeTab === 'financial' && <FinancialReportsTab reports={reportData.financialReports} />}
          </div>
        </div>
      </div>
    </div>
  )
}

// Tab Components
function DailyReportsTab({ reports }: { reports: DailyReport[] }) {
  return (
    <div>
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Total Revenue</p>
              <p className="text-2xl font-bold text-blue-900">
                {reports.reduce((sum, r) => sum + r.totalRevenue, 0).toLocaleString()} Tsh
              </p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">Total Collections</p>
              <p className="text-2xl font-bold text-green-900">
                {reports.reduce((sum, r) => sum + r.totalCollections, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-600">Processing Revenue</p>
              <p className="text-2xl font-bold text-yellow-900">
                {reports.reduce((sum, r) => sum + r.processingRevenue, 0).toLocaleString()} Tsh
              </p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-600">Transport Revenue</p>
              <p className="text-2xl font-bold text-purple-900">
                {reports.reduce((sum, r) => sum + r.transportRevenue, 0).toLocaleString()} Tsh
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collections</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bags Processed</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processing Revenue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transport Revenue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reports.map((report, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.totalCollections}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.bagsProcessed}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.processingRevenue.toLocaleString()} Tsh</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.transportRevenue.toLocaleString()} Tsh</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.totalRevenue.toLocaleString()} Tsh</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CustomerReportsTab({ reports }: { reports: CustomerReport[] }) {
  return (
    <div>
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Total Customers</p>
              <p className="text-2xl font-bold text-blue-900">{reports.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-900">
                {reports.reduce((sum, r) => sum + r.totalSpent, 0).toLocaleString()} Tsh
              </p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-600">Avg Per Customer</p>
              <p className="text-2xl font-bold text-yellow-900">
                {reports.length > 0 ? Math.round(reports.reduce((sum, r) => sum + r.totalSpent, 0) / reports.length).toLocaleString() : 0} Tsh
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collections</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bags Processed</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Collection</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reports.map((report, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.customerName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.totalCollections}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.bagsProcessed}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.totalSpent.toLocaleString()} Tsh</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.lastCollection ? new Date(report.lastCollection).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CargoReportsTab({ reports }: { reports: CargoReport[] }) {
  return (
    <div>
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Total Cargo Items</p>
              <p className="text-2xl font-bold text-blue-900">{reports.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">Avg Utilization</p>
              <p className="text-2xl font-bold text-green-900">
                {reports.length > 0 ? Math.round(reports.reduce((sum, r) => sum + r.utilizationRate, 0) / reports.length) : 0}%
              </p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-600">Total Remaining</p>
              <p className="text-2xl font-bold text-yellow-900">
                {reports.reduce((sum, r) => sum + r.remainingBags, 0)} bags
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Bags</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processed Bags</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining Bags</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilization Rate</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reports.map((report, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.originalBags}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.processedBags}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.remainingBags}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    report.utilizationRate >= 80 ? 'bg-green-100 text-green-800' :
                    report.utilizationRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {report.utilizationRate.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FinancialReportsTab({ reports }: { reports: FinancialReport[] }) {
  return (
    <div>
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Total Revenue</p>
              <p className="text-2xl font-bold text-blue-900">
                {reports.reduce((sum, r) => sum + r.totalRevenue, 0).toLocaleString()} Tsh
              </p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">Processing Revenue</p>
              <p className="text-2xl font-bold text-green-900">
                {reports.reduce((sum, r) => sum + r.processingRevenue, 0).toLocaleString()} Tsh
              </p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-600">Transport Revenue</p>
              <p className="text-2xl font-bold text-yellow-900">
                {reports.reduce((sum, r) => sum + r.transportRevenue, 0).toLocaleString()} Tsh
              </p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-600">Avg Per Collection</p>
              <p className="text-2xl font-bold text-purple-900">
                {reports.length > 0 ? Math.round(reports.reduce((sum, r) => sum + r.averagePerCollection, 0) / reports.length).toLocaleString() : 0} Tsh
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collections</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processing Revenue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transport Revenue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Per Collection</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reports.map((report, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.period}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.totalCollections}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.processingRevenue.toLocaleString()} Tsh</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.transportRevenue.toLocaleString()} Tsh</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.totalRevenue.toLocaleString()} Tsh</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.averagePerCollection.toLocaleString()} Tsh</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
