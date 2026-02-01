import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { menuService } from '../services/menuService'
import { foodService } from '../services/foodService'
import Navbar from '../components/Navbar'
import ErrorAlert from '../components/ErrorAlert'

export default function MenuSubstitute() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [foods, setFoods] = useState([])
  const [menu, setMenu] = useState(null)
  const [selectedFoodId, setSelectedFoodId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const menuId = searchParams.get('menuId')
  const menuItemId = Number(searchParams.get('menuItemId'))
  const previousName = searchParams.get('previousName') || ''
  const previousQuantity = searchParams.get('previousQuantity') || ''
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  useEffect(() => {
    const loadData = async () => {
      try {
        const [menuResponse, foodsResponse] = await Promise.all([
          menuService.getById(menuId),
          foodService.getAllItems()
        ])
        setMenu(menuResponse)
        setFoods(foodsResponse.filter((item) => item.quantity > 0))
      } catch (err) {
        setError(err.message || 'Failed to load substitute options')
      }
    }

    if (menuId) {
      loadData()
    }
  }, [menuId])

  const selectedFood = useMemo(() => foods.find((food) => String(food.id) === selectedFoodId), [foods, selectedFoodId])

  const lastServed = selectedFood?.lastallocated
    ? selectedFood.lastallocated.split('T')[0]
    : 'N/A'

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!menu || !selectedFoodId) {
      setError('Please select a substitute item')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const updatedItems = menu.items.map((item) =>
        item.id === menuItemId
          ? {
              ...item,
              food_id: Number(selectedFoodId),
              quantity: Number(quantity)
            }
          : item
      )

      await menuService.updateMenu(menu.id, updatedItems)
      navigate(`/menus?date=${date}`)
    } catch (err) {
      setError(err.message || 'Failed to update menu')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Substitute Item</h1>
          <p className="text-gray-600 mt-1">Previous Item: {previousName} - {previousQuantity}</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <ErrorAlert message={error} onDismiss={() => setError(null)} className="mb-4" />
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-700 mb-4">Last Served: {lastServed}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={selectedFoodId}
                onChange={(event) => setSelectedFoodId(event.target.value)}
                required
              >
                <option value="">Select item</option>
                {foods.map((food) => (
                  <option key={food.id} value={food.id}>
                    {food.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Submit'}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/menus?date=${date}`)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
