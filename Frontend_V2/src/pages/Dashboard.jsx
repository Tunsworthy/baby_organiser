import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useFoodStore } from '../store/foodStore'
import { menuService } from '../services/menuService'
import Navbar from '../components/Navbar'

export default function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const { items: foodItems, fetchItems } = useFoodStore()
  const [isLoadingFood, setIsLoadingFood] = useState(false)
  const [upcomingMenus, setUpcomingMenus] = useState([])
  const [isLoadingMenus, setIsLoadingMenus] = useState(false)

  const getDisplayName = () => {
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ')
    return fullName || user?.email || 'User'
  }

  useEffect(() => {
    if (!accessToken) {
      navigate('/login')
      return
    }
    
    const loadFood = async () => {
      setIsLoadingFood(true)
      try {
        await fetchItems()
      } catch (err) {
        console.error('Failed to load food items:', err)
      } finally {
        setIsLoadingFood(false)
      }
    }
    
    const loadUpcomingMenus = async () => {
      setIsLoadingMenus(true)
      try {
        const allMenus = await menuService.getAll()
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        // Filter menus from today onwards and sort by date
        const upcoming = allMenus
          .filter(menu => {
            const menuDate = new Date(menu.date)
            menuDate.setHours(0, 0, 0, 0)
            return menuDate >= today
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 5) // Get next 5 menus
        
        setUpcomingMenus(upcoming)
      } catch (err) {
        console.error('Failed to load menus:', err)
      } finally {
        setIsLoadingMenus(false)
      }
    }
    
    // Only load data if we have a valid token
    if (accessToken) {
      loadFood()
      loadUpcomingMenus()
    }
  }, [accessToken, navigate, fetchItems])

  // Get items with quantity <= 5
  const lowStockItems = foodItems.filter(item => item.quantity <= 5).slice(0, 5)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Welcome back, {getDisplayName()}!
        </h1>

        {/* Quick Actions */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/inventory')}
            className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Food Inventory</h3>
                <p className="text-sm text-gray-500">Manage your items</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/menus')}
            className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Menus</h3>
                <p className="text-sm text-gray-500">View meal plans</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/groups')}
            className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-purple-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Groups</h3>
                <p className="text-sm text-gray-500">Manage teams</p>
              </div>
            </div>
          </button>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Menus Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Upcoming Menus</h2>
              <button
                onClick={() => navigate('/menus')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All →
              </button>
            </div>
            <div className="space-y-3">
              {isLoadingMenus ? (
                <div className="text-center py-8 text-gray-500">Loading menus...</div>
              ) : upcomingMenus.length > 0 ? (
                upcomingMenus.map((menu) => {
                  const menuDate = new Date(menu.date)
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  menuDate.setHours(0, 0, 0, 0)
                  
                  const isToday = menuDate.getTime() === today.getTime()
                  const isTomorrow = menuDate.getTime() === today.getTime() + 86400000
                  
                  let dateLabel = menuDate.toLocaleDateString()
                  if (isToday) dateLabel = 'Today'
                  else if (isTomorrow) dateLabel = 'Tomorrow'
                  
                  return (
                    <div 
                      key={menu.id} 
                      className="p-4 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100 cursor-pointer transition"
                      onClick={() => navigate(`/menus?date=${menu.date}`)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-700">{dateLabel} - {menu.type}</p>
                          <p className="text-sm text-gray-500">
                            {menu.items.length} item{menu.items.length !== 1 ? 's' : ''}
                            {menu.items.length > 0 && ` - ${menu.items.slice(0, 2).map(i => i.name).join(', ')}${menu.items.length > 2 ? '...' : ''}`}
                          </p>
                        </div>
                        <svg className="h-5 w-5 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm bg-gray-50 rounded-md border border-gray-200">
                  No upcoming menus. Create one to get started!
                </div>
              )}
            </div>
          </div>

          {/* Low Food Alert Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Low Food Alert</h2>
              <button
                onClick={() => navigate('/inventory')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Manage Inventory →
              </button>
            </div>
            <div className="space-y-3">
              {isLoadingFood ? (
                <div className="text-center py-8 text-gray-500">Loading inventory...</div>
              ) : lowStockItems.length > 0 ? (
                lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-start p-3 bg-amber-50 rounded-md border border-amber-200">
                    <svg className="h-5 w-5 text-amber-500 mt-0.5 mr-3" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-600">Only {item.quantity} {item.unit || 'items'} remaining</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-green-600 text-sm bg-green-50 rounded-md border border-green-200">
                  ✓ All items are well stocked!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
