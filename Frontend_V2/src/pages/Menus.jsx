import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { menuService } from '../services/menuService'
import { foodService } from '../services/foodService'

const MEAL_TYPES = ['Lunch', 'Dinner']

const formatDisplayDate = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`)
  return date.toDateString()
}

const addDays = (dateString, delta) => {
  const date = new Date(`${dateString}T00:00:00`)
  date.setDate(date.getDate() + delta)
  return date.toISOString().split('T')[0]
}

export default function Menus() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [menusByType, setMenusByType] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [foodMap, setFoodMap] = useState({})
  const [availableDates, setAvailableDates] = useState({ prev: null, next: null })

  const currentDate = useMemo(() => {
    return searchParams.get('date') || new Date().toISOString().split('T')[0]
  }, [searchParams])

  const loadMenus = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [menus, foods] = await Promise.all([
        menuService.getByDate(currentDate),
        foodService.getAllItems()
      ])

      const map = {}
      foods.forEach((item) => {
        map[item.id] = item
      })
      setFoodMap(map)

      const grouped = {}
      menus.forEach((menu) => {
        grouped[menu.type] = menu
      })
      setMenusByType(grouped)

      const prevDate = addDays(currentDate, -1)
      const nextDate = addDays(currentDate, 1)

      const [prevExists, nextExists] = await Promise.all([
        menuService.getByDate(prevDate).then(() => true).catch(() => false),
        menuService.getByDate(nextDate).then(() => true).catch(() => false)
      ])

      setAvailableDates({
        prev: prevExists ? prevDate : null,
        next: nextExists ? nextDate : null
      })
    } catch (err) {
      setError(err.message || 'Failed to load menus')
    } finally {
      setIsLoading(false)
    }
  }, [currentDate])

  useEffect(() => {
    loadMenus()
  }, [loadMenus])

  const handleAllocate = async (menu, menuItem) => {
    try {
      setError(null)
      const foodItem = await foodService.getItem(menuItem.food_id)
      const updatedQuantity = foodItem.quantity - menuItem.quantity

      if (updatedQuantity < 0) {
        setError('Insufficient stock for allocation')
        return
      }

      await foodService.updateItem(menuItem.food_id, {
        quantity: updatedQuantity,
        lastallocated: new Date().toISOString()
      })

      const updatedItems = menu.items.map((item) =>
        item.id === menuItem.id
          ? { ...item, allocated: true }
          : item
      )

      const updatedMenu = await menuService.updateMenu(menu.id, updatedItems)
      setMenusByType((prev) => ({
        ...prev,
        [updatedMenu.type]: updatedMenu
      }))
    } catch (err) {
      setError(err.message || 'Failed to allocate item')
    }
  }

  const handleSubstitute = (menu, menuItem, displayName) => {
    const params = new URLSearchParams({
      menuId: menu.id,
      menuItemId: menuItem.id,
      mealType: menu.type,
      date: currentDate,
      previousName: displayName,
      previousQuantity: String(menuItem.quantity)
    })

    navigate(`/menus/sub?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Menus</h1>
          <p className="text-gray-600 mt-1">{formatDisplayDate(currentDate)}</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <nav className="flex justify-center gap-4">
          <button
            className="px-4 py-2 rounded border bg-white disabled:opacity-50"
            disabled={!availableDates.prev}
            onClick={() => navigate(`/menus?date=${availableDates.prev}`)}
          >
            Previous
          </button>
          <button
            className="px-4 py-2 rounded border bg-white disabled:opacity-50"
            disabled={!availableDates.next}
            onClick={() => navigate(`/menus?date=${availableDates.next}`)}
          >
            Next
          </button>
        </nav>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">Loading menus...</div>
        ) : (
          MEAL_TYPES.map((mealType) => {
            const menu = menusByType[mealType]
            if (!menu) return null

            return (
              <section key={mealType} className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">{mealType}</h2>

                <div className="space-y-3">
                  {menu.items.map((item) => {
                    const displayName = item.name || foodMap[item.food_id]?.name || 'Unknown'

                    return (
                      <div key={item.id} className="flex flex-col md:flex-row md:items-center gap-3">
                        <input
                          className="flex-1 border rounded px-3 py-2 bg-gray-50 text-gray-700"
                          type="text"
                          readOnly
                          value={`${displayName} : ${item.quantity}`}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="px-3 py-2 rounded border text-gray-700 hover:text-gray-900"
                            onClick={() => handleAllocate(menu, item)}
                            disabled={item.allocated}
                            title="Allocate"
                          >
                            🛒
                          </button>
                          <button
                            type="button"
                            className="px-3 py-2 rounded border text-gray-700 hover:text-gray-900"
                            onClick={() => handleSubstitute(menu, item, displayName)}
                            disabled={item.allocated}
                            title="Substitute"
                          >
                            🔁
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })
        )}
      </main>
    </div>
  )
}
