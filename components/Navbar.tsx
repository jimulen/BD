'use client'

import { Building2, Users, UserPlus, LogOut, LayoutDashboard, Package, PackageSearch, Store, BarChart3 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface NavbarProps {
  onLogout?: () => void
}

export function Navbar({ onLogout }: NavbarProps = {}) {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('token')
    onLogout?.()
    router.push('/')
  }

  return (
    <nav className="bg-primary-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-2 hover:bg-primary-700 px-3 py-2 rounded-md"
            >
              <Building2 className="h-6 w-6" />
              <span className="font-bold text-xl">BD Company Ltd</span>
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="hover:bg-primary-700 px-3 py-2 rounded-md text-sm font-medium flex items-center"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => router.push('/customers')}
              className="hover:bg-primary-700 px-3 py-2 rounded-md text-sm font-medium flex items-center"
            >
              <Users className="h-4 w-4 mr-2" />
              Customers
            </button>
                        <button
              onClick={() => router.push('/cargo')}
              className="hover:bg-primary-700 px-3 py-2 rounded-md text-sm font-medium flex items-center"
            >
              <Package className="h-4 w-4 mr-2" />
              Cargo
            </button>
            <button
              onClick={() => router.push('/store')}
              className="hover:bg-primary-700 px-3 py-2 rounded-md text-sm font-medium flex items-center"
            >
              <Store className="h-4 w-4 mr-2" />
              Store
            </button>
            <button
              onClick={() => router.push('/collections')}
              className="hover:bg-primary-700 px-3 py-2 rounded-md text-sm font-medium flex items-center"
            >
              <PackageSearch className="h-4 w-4 mr-2" />
              Collections
            </button>
            <button
              onClick={() => router.push('/reports')}
              className="hover:bg-primary-700 px-3 py-2 rounded-md text-sm font-medium flex items-center"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports
            </button>
          
            <div className="flex items-center space-x-2 border-l border-primary-400 pl-4">
              <button
                onClick={handleLogout}
                className="hover:bg-primary-700 px-3 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
