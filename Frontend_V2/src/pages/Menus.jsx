import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
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
  const accessToken = useAuthStore((state) => state.accessToken)
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
  const [showEdit, setShowEdit] = useState(false)
  const [editMenu, setEditMenu] = useState(null)
  const [editItems, setEditItems] = useState([])
  const [editingItemId, setEditingItemId] = useState(null)
  const [editingItemQty, setEditingItemQty] = useState(1)

  const datesWithMenus = useMemo(() => {
    const set = new Set()
    allMenus.forEach((m) => set.add(m.date))
    return set
  }, [allMenus])

  const loadFoods = useCallback(async () => {
    if (!accessToken) return
    try {
      const foods = await foodService.getAllItems()
      const map = {}
      foods.forEach((f) => (map[f.id] = f))
      setFoodMap(map)
    } catch (e) {
      console.error('Failed to load foods:', e)
    }
  }, [accessToken])

  const loadAllMenus = useCallback(async () => {
    if (!accessToken) return
    try {
      const menus = await menuService.getAll()
      setAllMenus(menus)
    } catch (e) {
      console.error('Failed to load all menus:', e)
    }
  }, [accessToken])

  const loadMenusForDate = useCallback(async (dateStr) => {
    if (!accessToken) return
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
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (accessToken) {
      loadFoods()
      loadAllMenus()
    }
  }, [accessToken, loadFoods, loadAllMenus])

  useEffect(() => {
    if (accessToken) {
      loadMenusForDate(currentDate)
    }
  }, [currentDate, accessToken, loadMenusForDate])

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

  const handleAddEditItemRow = () => setEditItems((s) => [...s, { food_id: '', quantity: 1 }])
  const handleRemoveEditItemRow = (idx) => setEditItems((s) => s.filter((_, i) => i !== idx))
  const handleUpdateEditItem = (idx, key, value) =>
    setEditItems((s) => s.map((r, i) => (i === idx ? { ...r, [key]: value } : r)))

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

  const handleDeleteItem = async (menu, itemId) => {
    try {
      setError(null)
      const updatedItems = menu.items.filter((item) => item.id !== itemId)
      const updatedMenu = await menuService.updateMenu(menu.id, updatedItems)
      setMenusByType((prev) => ({
        ...prev,
        [updatedMenu.type]: updatedMenu
      }))
    } catch (err) {
      setError(err.message || 'Failed to delete item')
    }
  }

  const handleEditItemQty = async (menu, item) => {
    try {
      setError(null)
      const updatedItems = menu.items.map((i) =>
        i.id === item.id ? { ...i, quantity: editingItemQty } : i
      )
      const updatedMenu = await menuService.updateMenu(menu.id, updatedItems)
      setMenusByType((prev) => ({
        ...prev,
        [updatedMenu.type]: updatedMenu
      }))
      setEditingItemId(null)
    } catch (err) {
      setError(err.message || 'Failed to update item quantity')
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

  const handleEditMenu = async () => {
    try {
      setError(null)
      const updatedMenu = await menuService.updateMenu(editMenu.id, editItems)
      setMenusByType((prev) => ({
        ...prev,
        [updatedMenu.type]: updatedMenu
      }))
      setShowEdit(false)
      setEditMenu(null)
      setEditItems([])
      loadAllMenus()
    } catch (err) {
      setError(err.message || 'Failed to update menu')
    }
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
        <section className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-semibold">{calendarMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
            <div className="flex gap-2">
              <button className="px-3 py-1 border rounded" onClick={monthPrev}>Prev</button>
              <button className="px-3 py-1 border rounded" onClick={monthNext}>Next</button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-0 text-sm mb-1">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-center font-medium text-gray-600 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {monthGrid.map((week, wi) => (
              week.map((day) => {
                const ds = toDateString(day)
                const isCurrentMonth = day.getMonth() === calendarMonth.getMonth()
                const hasMenu = datesWithMenus.has(ds)
                const isSelected = ds === currentDate
                return (
                  <div key={ds} className="flex flex-col items-center py-1">
                    <button
                      onClick={() => handleDayClick(ds)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : isCurrentMonth
                          ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                          : 'bg-gray-50 text-gray-400'
                      }`}
                    >
                      {day.getDate()}
                    </button>
                    <div className="h-2 flex items-center justify-center mt-0.5">
                      {hasMenu && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                    </div>
                  </div>
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

                  {menu.items.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm p-4">No items for this menu</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Item Name</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Quantity</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {menu.items.map((item) => {
                            const displayName = item.name || foodMap[item.food_id]?.name || 'Unknown'
                            const isEditing = editingItemId === item.id

                            return (
                              <tr key={item.id} className={`border-b transition ${item.allocated ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{displayName}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{mealType}</td>
                                <td className="px-4 py-3 text-sm">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      min="1"
                                      className="w-16 border rounded px-2 py-1"
                                      value={editingItemQty}
                                      onChange={(e) => setEditingItemQty(Number(e.target.value))}
                                    />
                                  ) : (
                                    <span className="text-gray-600">{item.quantity}</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span className={`inline-block px-3 py-1 rounded text-white text-xs font-medium ${
                                    item.allocated ? 'bg-green-600' : 'bg-blue-600'
                                  }`}>
                                    {item.allocated ? 'Allocated' : 'Pending'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm space-x-2 flex items-center">
                                  {isEditing ? (
                                    <>
                                      <button
                                        onClick={() => handleEditItemQty(menu, item)}
                                        className="text-green-600 hover:text-green-800 text-lg"
                                        title="Save"
                                      >
                                        ✓
                                      </button>
                                      <button
                                        onClick={() => setEditingItemId(null)}
                                        className="text-gray-600 hover:text-gray-800 text-lg"
                                        title="Cancel"
                                      >
                                        ✕
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleAllocate(menu, item)}
                                        disabled={item.allocated}
                                        className={`text-lg transition ${
                                          item.allocated
                                            ? 'text-gray-400 cursor-not-allowed'
                                            : 'text-gray-600 hover:text-blue-600'
                                        }`}
                                        title="Allocate"
                                      >
                                        📦
                                      </button>
                                      <button
                                        onClick={() => handleSubstitute(menu, item, displayName)}
                                        disabled={item.allocated}
                                        className={`text-lg transition ${
                                          item.allocated
                                            ? 'text-gray-400 cursor-not-allowed'
                                            : 'text-gray-600 hover:text-blue-600'
                                        }`}
                                        title="Substitute"
                                      >
                                        🔁
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingItemId(item.id)
                                          setEditingItemQty(item.quantity)
                                        }}
                                        disabled={item.allocated}
                                        className={`text-lg transition ${
                                          item.allocated
                                            ? 'text-gray-400 cursor-not-allowed'
                                            : 'text-gray-600 hover:text-blue-600'
                                        }`}
                                        title="Edit quantity"
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (window.confirm('Delete this item?')) {
                                            handleDeleteItem(menu, item.id)
                                          }
                                        }}
                                        disabled={item.allocated}
                                        className={`text-lg transition ${
                                          item.allocated
                                            ? 'text-gray-400 cursor-not-allowed'
                                            : 'text-gray-600 hover:text-red-600'
                                        }`}
                                        title="Delete"
                                      >
                                        🗑️
                                      </button>
                                    </>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
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
                  {createItems.map((row, idx) => {
                    const foodItem = foodMap[row.food_id]
                    const lastServed = foodItem?.lastallocated ? new Date(foodItem.lastallocated).toLocaleDateString() : 'Never'
                    
                    return (
                      <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex gap-2 items-center mb-2">
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
                          <button type="button" className="px-2 py-1 border rounded hover:bg-red-50 text-red-600" onClick={() => handleRemoveItemRow(idx)}>−</button>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="text-xs text-gray-600">Quantity</label>
                            <input
                              type="number"
                              min="1"
                              className="w-full border rounded px-2 py-1"
                              value={row.quantity}
                              onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                            />
                          </div>
                          {foodItem && (
                            <div className="flex-1">
                              <label className="text-xs text-gray-600">Last Served</label>
                              <div className="text-sm font-medium text-gray-700 py-1">{lastServed}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
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

        {/* Edit Modal */}
        {showEdit && editMenu && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow p-6 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Edit {editMenu.type} Menu for {formatDisplayDate(currentDate)}</h3>
                <button onClick={() => setShowEdit(false)} className="text-gray-600">✕</button>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  {editItems.map((row, idx) => {
                    const foodItem = foodMap[row.food_id]
                    const lastServed = foodItem?.lastallocated ? new Date(foodItem.lastallocated).toLocaleDateString() : 'Never'
                    
                    return (
                      <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex gap-2 items-center mb-2">
                          <select
                            className="flex-1 border rounded px-2 py-1"
                            value={row.food_id}
                            onChange={(e) => handleUpdateEditItem(idx, 'food_id', e.target.value)}
                          >
                            <option value="">-- select item --</option>
                            {Object.values(foodMap).map((f) => (
                              <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                          </select>
                          <button type="button" className="px-2 py-1 border rounded hover:bg-red-50 text-red-600" onClick={() => handleRemoveEditItemRow(idx)}>−</button>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="text-xs text-gray-600">Quantity</label>
                            <input
                              type="number"
                              min="1"
                              className="w-full border rounded px-2 py-1"
                              value={row.quantity}
                              onChange={(e) => handleUpdateEditItem(idx, 'quantity', e.target.value)}
                            />
                          </div>
                          {foodItem && (
                            <div className="flex-1">
                              <label className="text-xs text-gray-600">Last Served</label>
                              <div className="text-sm font-medium text-gray-700 py-1">{lastServed}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex gap-2">
                  <button type="button" className="px-3 py-1 border rounded" onClick={handleAddEditItemRow}>+ Add Item</button>
                  <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleEditMenu}>Save</button>
                  <button type="button" className="px-4 py-2 border rounded" onClick={() => setShowEdit(false)}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
