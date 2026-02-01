import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { menuService } from '../services/menuService'
import { foodService } from '../services/foodService'
import Navbar from '../components/Navbar'

const MEAL_TYPES = ['Lunch', 'Dinner']

const formatDisplayDate = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`)
  return date.toDateString()
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function pad(n) {
  return n < 10 ? `0${n}` : `${n}`
}

function toDateString(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function Menus() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [menusByType, setMenusByType] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [foodMap, setFoodMap] = useState({})
  const [allMenus, setAllMenus] = useState([])

  const currentDate = useMemo(() => {
    return searchParams.get('date') || new Date().toISOString().split('T')[0]
  }, [searchParams])

  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()))
  const [showCreate, setShowCreate] = useState(false)
  const [createItems, setCreateItems] = useState([{ food_id: '', quantity: 1 }])
  const [createMeal, setCreateMeal] = useState('Lunch')

  const datesWithMenus = useMemo(() => {
    const set = new Set()
    allMenus.forEach((m) => set.add(m.date))
    return set
  }, [allMenus])

  const loadFoods = useCallback(async () => {
    try {
      const foods = await foodService.getAllItems()
      const map = {}
      foods.forEach((f) => (map[f.id] = f))
      setFoodMap(map)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const loadAllMenus = useCallback(async () => {
    try {
      const menus = await menuService.getAll()
      setAllMenus(menus)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const loadMenusForDate = useCallback(async (dateStr) => {
    setIsLoading(true)
    setError(null)
    try {
      const menus = await menuService.getByDate(dateStr)
      const grouped = {}
      menus.forEach((menu) => {
        grouped[menu.type] = menu
      })
      setMenusByType(grouped)
    } catch (err) {
      setMenusByType({})
      // if 404 means no menus for date — clear
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFoods()
    loadAllMenus()
  }, [loadFoods, loadAllMenus])

  useEffect(() => {
    loadMenusForDate(currentDate)
  }, [currentDate, loadMenusForDate])

  const handleDayClick = (dateStr) => {
    navigate(`/menus?date=${dateStr}`)
  }

  const monthPrev = () => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const monthNext = () => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  const buildMonthGrid = (monthStart) => {
    const start = startOfMonth(monthStart)
    const end = endOfMonth(monthStart)
    const grid = []
    const firstDay = start.getDay() // 0 Sun .. 6 Sat
    let cur = new Date(start)
    cur.setDate(cur.getDate() - firstDay)

    while (grid.length < 6) {
      const week = []
      for (let i = 0; i < 7; i++) {
        week.push(new Date(cur))
        cur.setDate(cur.getDate() + 1)
      }
      grid.push(week)
      if (cur > end && grid.length >= 4) break
    }
    return grid
  }

  const handleAddItemRow = () => setCreateItems((s) => [...s, { food_id: '', quantity: 1 }])
  const handleRemoveItemRow = (idx) => setCreateItems((s) => s.filter((_, i) => i !== idx))
  const handleUpdateItem = (idx, key, value) =>
    setCreateItems((s) => s.map((r, i) => (i === idx ? { ...r, [key]: value } : r)))

  const handleCreateMenu = async () => {
    try {
      setError(null)
      const payload = {
        date: currentDate,
        type: createMeal,
        items: createItems
          .filter((it) => it.food_id || it.name)
          .map((it) => ({ food_id: it.food_id || null, quantity: Number(it.quantity) || 1 }))
      }

      await menuService.createMenu(payload)
      setShowCreate(false)
      setCreateItems([{ food_id: '', quantity: 1 }])
      // reload
      loadMenusForDate(currentDate)
      loadAllMenus()
    } catch (e) {
      setError(e.message || 'Failed to create menu')
    }
  }

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

  const monthGrid = buildMonthGrid(calendarMonth)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Menus</h1>
            <p className="text-gray-600 mt-1">{formatDisplayDate(currentDate)}</p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded border bg-white" onClick={() => setShowCreate(true)}>
              + Create Menu
            </button>
          </div>
        </div>

        {/* Calendar */}
        <section className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-semibold">{calendarMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
            <div className="flex gap-2">
              <button className="px-3 py-1 border rounded" onClick={monthPrev}>Prev</button>
              <button className="px-3 py-1 border rounded" onClick={monthNext}>Next</button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-sm">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-center font-medium text-gray-600">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 mt-2">
            {monthGrid.map((week, wi) => (
              week.map((day) => {
                const ds = toDateString(day)
                const isCurrentMonth = day.getMonth() === calendarMonth.getMonth()
                const hasMenu = datesWithMenus.has(ds)
                return (
                  <button
                    key={ds}
                    onClick={() => handleDayClick(ds)}
                    className={`p-2 h-20 border rounded flex flex-col justify-between items-center ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <div className={`text-sm ${ds === currentDate ? 'font-bold' : ''}`}>{day.getDate()}</div>
                    <div className="h-2">
                      {hasMenu && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                    </div>
                  </button>
                )
              })
            ))}
          </div>
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
        )}

        {isLoading ? (
          <div className="text-center py-12">Loading menus...</div>
        ) : (
          <div className="space-y-4">
            {MEAL_TYPES.map((mealType) => {
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
            })}

            {/* If no menus for selected date show create button */}
            {Object.keys(menusByType).length === 0 && (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-gray-700 mb-3">No menus for this day.</div>
                <button className="px-4 py-2 rounded border bg-white" onClick={() => setShowCreate(true)}>Create Menu</button>
              </div>
            )}
          </div>
        )}

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow p-6 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Create Menu for {formatDisplayDate(currentDate)}</h3>
                <button onClick={() => setShowCreate(false)} className="text-gray-600">✕</button>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3 items-center">
                  <label className="font-medium">Meal:</label>
                  <select value={createMeal} onChange={(e) => setCreateMeal(e.target.value)} className="border rounded px-2 py-1">
                    {MEAL_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  {createItems.map((row, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select
                        className="flex-1 border rounded px-2 py-1"
                        value={row.food_id}
                        onChange={(e) => handleUpdateItem(idx, 'food_id', e.target.value)}
                      >
                        <option value="">-- select item --</option>
                        {Object.values(foodMap).map((f) => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        className="w-24 border rounded px-2 py-1"
                        value={row.quantity}
                        onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                      />
                      <button type="button" className="px-2 py-1 border rounded" onClick={() => handleRemoveItemRow(idx)}>−</button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button type="button" className="px-3 py-1 border rounded" onClick={handleAddItemRow}>+ Add Item</button>
                  <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleCreateMenu}>Create</button>
                  <button type="button" className="px-4 py-2 border rounded" onClick={() => setShowCreate(false)}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
