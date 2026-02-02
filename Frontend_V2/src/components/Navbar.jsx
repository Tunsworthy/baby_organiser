import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Navbar() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const getDisplayName = () => {
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ')
    return fullName || user?.email || 'User'
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Get user initials for profile circle
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Hamburger Menu */}
          <div className="flex items-center">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="ml-3 text-xl font-semibold text-gray-800">Baby Organiser</span>
          </div>

          {/* Right: Profile Icon */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Profile menu"
            >
              {getInitials()}
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                    <div className="font-semibold">{getDisplayName()}</div>
                    <div className="text-gray-500 truncate">{user?.email || ''}</div>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false)
                      navigate('/profile')
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Profile Settings
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false)
                      navigate('/groups')
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Manage Groups
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div className="border-t border-gray-200 pb-3 pt-2">
            <Link
              to="/dashboard"
              onClick={() => setShowMobileMenu(false)}
              className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600"
            >
              Dashboard
            </Link>
            <Link
              to="/inventory"
              onClick={() => setShowMobileMenu(false)}
              className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600"
            >
              Food Inventory
            </Link>
            <Link
              to="/menus"
              onClick={() => setShowMobileMenu(false)}
              className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600"
            >
              Menus
            </Link>
            <Link
              to="/groups"
              onClick={() => setShowMobileMenu(false)}
              className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600"
            >
              Groups
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
