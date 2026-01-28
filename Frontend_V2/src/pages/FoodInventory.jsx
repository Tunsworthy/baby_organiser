import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useFoodStore } from '../store/foodStore'
import FoodTable from '../components/FoodTable'
import FoodForm from '../components/FoodForm'

export default function FoodInventory() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const logout = useAuthStore((state) => state.logout)

  const { items, isLoading, fetchItems, addItem, updateItem, deleteItem } = useFoodStore()

  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    if (!accessToken) {
      navigate('/login')
      return
    }
    fetchItems()
  }, [accessToken, fetchItems, navigate])

  const handleAddItem = async (itemData) => {
    try {
      setFormError(null)
      await addItem(itemData)
      setShowForm(false)
    } catch (err) {
      setFormError(err.message || 'Failed to add item')
    }
  }

  const handleUpdateItem = async (itemData) => {
    try {
      setFormError(null)
      await updateItem(editingItem.id, itemData)
      setEditingItem(null)
      setShowForm(false)
    } catch (err) {
      setFormError(err.message || 'Failed to update item')
    }
  }

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        setFormError(null)
        await deleteItem(itemId)
      } catch (err) {
        setFormError(err.message || 'Failed to delete item')
      }
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Food Inventory</h1>
            {user && (
              <p className="text-gray-600 text-sm mt-1">Welcome, {user.firstName || user.email}</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {formError}
          </div>
        )}

        {/* Form Section */}
        {showForm && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </h2>
            <FoodForm
              onSubmit={editingItem ? handleUpdateItem : handleAddItem}
              isLoading={isLoading}
              initialData={editingItem}
              onCancel={() => {
                setShowForm(false)
                setEditingItem(null)
              }}
            />
          </div>
        )}

        {/* Items List */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Your Items</h2>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg"
              >
                Add Item
              </button>
            )}
          </div>

          <FoodTable
            items={items}
            onEdit={(item) => {
              setEditingItem(item)
              setShowForm(true)
            }}
            onDelete={handleDeleteItem}
            isLoading={isLoading}
          />
        </div>
      </main>
    </div>
  )
}
