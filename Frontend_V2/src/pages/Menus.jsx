import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { menuService } from '../services/menuService'
import { foodService } from '../services/foodService'
import { childService } from '../services/childService'
import Navbar from '../components/Navbar'
import ErrorAlert from '../components/ErrorAlert'
import Modal from '../components/Modal'
import { useItemRows } from '../hooks/useItemRows'
import { startOfMonth, endOfMonth, pad, toDateString, formatDisplayDate } from '../utils/dateUtils'

const MEAL_TYPES = ['Lunch', 'Dinner']

export default function Menus() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const accessToken = useAuthStore((state) => state.accessToken)
  const [menusByType, setMenusByType] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [foodMap, setFoodMap] = useState({})
  const [allMenus, setAllMenus] = useState([])
  const [children, setChildren] = useState([])
  const [selectedChildId, setSelectedChildId] = useState('')
  const [filterChildId, setFilterChildId] = useState('all')

  const currentDate = useMemo(() => {
    return searchParams.get('date') || new Date().toISOString().split('T')[0]
  }, [searchParams])

  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()))
  const [createMeal, setCreateMeal] = useState('Lunch')
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editMenu, setEditMenu] = useState(null)
  const [editMode, setEditMode] = useState('edit')
  const [editingItemId, setEditingItemId] = useState(null)
  const [editingItemQty, setEditingItemQty] = useState(1)

  const createItems = useItemRows()
  const editItems = useItemRows()

  // Create a map of dates to their menu types for dot rendering
  const menusByDate = useMemo(() => {
    const map = {}
    allMenus.forEach((m) => {
      // Filter by selected child if filterChildId is set
      if (filterChildId === 'all' || !filterChildId || m.childId === Number(filterChildId)) {
        const dateKey = toDateString(new Date(m.date))
        if (!map[dateKey]) {
          map[dateKey] = new Set()
        }
        map[dateKey].add(m.type)
      }
    })
    return map
  }, [allMenus, filterChildId])

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

  const loadChildren = useCallback(async () => {
    if (!accessToken) return
    try {
      const kids = await childService.getAll()
      setChildren(kids)
      if (kids.length > 0 && !selectedChildId) {
        setSelectedChildId(kids[0].id.toString())
      }
    } catch (e) {
      console.error('Failed to load children:', e)
    }
  }, [accessToken, selectedChildId])

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
        // Filter by selected child if filterChildId is set
        if (filterChildId === 'all' || !filterChildId || menu.childId === Number(filterChildId)) {
          grouped[menu.type] = menu
        }
      })
      setMenusByType(grouped)
    } catch (err) {
      setMenusByType({})
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, filterChildId])

  useEffect(() => {
    if (accessToken) {
      loadFoods()
      loadAllMenus()
      loadChildren()
    }
  }, [accessToken, loadFoods, loadAllMenus, loadChildren])

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

  const handleAddItemRow = () => createItems.addRow()
  const handleRemoveItemRow = (idx) => createItems.removeRow(idx)
  const handleUpdateItem = (idx, key, value) => createItems.updateRow(idx, key, value)

  const handleAddEditItemRow = () => editItems.addRow()
  const handleRemoveEditItemRow = (idx) => editItems.removeRow(idx)
  const handleUpdateEditItem = (idx, key, value) => editItems.updateRow(idx, key, value)

  const handleCreateMenu = async () => {
    try {
      setError(null)
      const payload = {
        date: currentDate,
        type: createMeal,
        childId: selectedChildId && selectedChildId !== '' ? Number(selectedChildId) : null,
        items: createItems.items
          .filter((it) => it.food_id || it.name)
          .map((it) => ({ food_id: it.food_id || null, quantity: Number(it.quantity) || 1 }))
      }

      await menuService.createMenu(payload)
      setShowCreate(false)
      createItems.reset()
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

  const handleAddItemToMenu = (menu) => {
    setEditMenu(menu)
    setEditMode('add')
    editItems.setItems([{ food_id: '', quantity: 1 }])
    setShowEdit(true)
  }

  const handleEditMenu = async () => {
    try {
      setError(null)
      const newItems = editItems.items
        .filter((it) => it.food_id || it.name)
        .map((it) => ({ food_id: it.food_id || null, quantity: Number(it.quantity) || 1 }))

      const updatedItems = editMode === 'add'
        ? [...(editMenu?.items || []), ...newItems]
        : editItems.items

      const updatedMenu = await menuService.updateMenu(editMenu.id, updatedItems)
      setMenusByType((prev) => ({
        ...prev,
        [updatedMenu.type]: updatedMenu
      }))
      setShowEdit(false)
      setEditMenu(null)
      setEditMode('edit')
      editItems.reset()
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
          <div className="flex gap-2 items-center">
            {children.length > 0 && (
              <select 
                value={filterChildId} 
                onChange={(e) => setFilterChildId(e.target.value)} 
                className="px-3 py-2 border rounded bg-white text-sm"
              >
                <option value="all">All Children</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>{child.name}</option>
                ))}
              </select>
            )}
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
                const menuTypes = menusByDate[ds] || new Set()
                const menuCount = menuTypes.size
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
                    <div id={`dot-${ds}`} className="h-2 flex items-center justify-center gap-0.5 mt-0.5">
                      {menuCount > 0 && (
                        <>
                          {Array.from(menuTypes).map((type) => (
                            <div key={type} className="w-1.5 h-1.5 bg-green-500 rounded-full" title={type} />
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                )
              })
            ))}
          </div>
        </section>

        {error && (
          <ErrorAlert message={error} onDismiss={() => setError(null)} />
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
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">{mealType}</h2>
                    <button
                      type="button"
                      onClick={() => handleAddItemToMenu(menu)}
                      className="px-3 py-1.5 text-sm rounded border bg-white hover:bg-gray-50"
                    >
                      + Add Item
                    </button>
                  </div>

                  {menu.items.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm p-4">No items for this menu</div>
                  ) : (
                    <>
                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Item Name</th>
                              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Type</th>
                              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Quantity</th>
                              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Status</th>
                              <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {menu.items.map((item) => {
                              const displayName = item.name || foodMap[item.food_id]?.name || 'Unknown'
                              const foodType = item.type || foodMap[item.food_id]?.type || 'Other'
                              const isEditing = editingItemId === item.id

                              return (
                                <tr key={item.id} className={`border-b transition ${item.allocated ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                                  <td className="px-4 py-3 text-sm text-center text-gray-900 font-medium">{displayName}</td>
                                  <td className="px-4 py-3 text-sm text-center text-gray-600">{foodType}</td>
                                  <td className="px-4 py-3 text-sm text-center">
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        min="1"
                                        className="w-16 border rounded px-2 py-1 mx-auto block"
                                        value={editingItemQty}
                                        onChange={(e) => setEditingItemQty(Number(e.target.value))}
                                      />
                                    ) : (
                                      <span className="text-gray-600">{item.quantity}</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-center">
                                    <span className={`inline-block px-3 py-1 rounded text-white text-xs font-medium ${
                                      item.allocated ? 'bg-green-600' : 'bg-blue-600'
                                    }`}>
                                      {item.allocated ? 'Allocated' : 'Pending'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm space-x-2 flex items-center justify-center">
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
                                          className={`text-lg transition ${item.allocated ? 'opacity-40 cursor-not-allowed grayscale' : 'text-gray-600 hover:text-blue-600'}`}
                                          title="Allocate"
                                        >
                                          📦
                                        </button>
                                        <button
                                          onClick={() => handleSubstitute(menu, item, displayName)}
                                          disabled={item.allocated}
                                          className={`text-lg transition ${item.allocated ? 'opacity-40 cursor-not-allowed grayscale' : 'text-gray-600 hover:text-blue-600'}`}
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
                                          className={`text-lg transition ${item.allocated ? 'opacity-40 cursor-not-allowed grayscale' : 'text-gray-600 hover:text-blue-600'}`}
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
                                          className={`text-lg transition ${item.allocated ? 'opacity-40 cursor-not-allowed grayscale' : 'text-gray-600 hover:text-red-600'}`}
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

                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-3">
                        {menu.items.map((item) => {
                          const displayName = item.name || foodMap[item.food_id]?.name || 'Unknown'
                          const foodType = item.type || foodMap[item.food_id]?.type || 'Other'
                          const isEditing = editingItemId === item.id

                          return (
                            <div key={item.id} className={`p-4 rounded-lg border-2 transition ${item.allocated ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900">
                                    {displayName}
                                    <span className="ml-2 text-sm italic text-gray-500">- {foodType}</span>
                                  </h3>
                                </div>
                                <span className={`inline-block px-2 py-1 rounded text-white text-xs font-medium ${
                                  item.allocated ? 'bg-green-600' : 'bg-blue-600'
                                }`}>
                                  {item.allocated ? 'Allocated' : 'Pending'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm text-gray-600 font-medium">QTY:</span>
                                {isEditing ? (
                                  <input
                                    type="number"
                                    min="1"
                                    className="w-24 border rounded px-2 py-1"
                                    value={editingItemQty}
                                    onChange={(e) => setEditingItemQty(Number(e.target.value))}
                                  />
                                ) : (
                                  <span className="text-gray-900 font-semibold">{item.quantity}</span>
                                )}
                              </div>

                              <div className="flex gap-2 flex-wrap">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => handleEditItemQty(menu, item)}
                                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition"
                                      title="Save"
                                    >
                                      Save ✓
                                    </button>
                                    <button
                                      onClick={() => setEditingItemId(null)}
                                      className="flex-1 px-3 py-2 bg-gray-400 text-white rounded text-sm hover:bg-gray-500 transition"
                                      title="Cancel"
                                    >
                                      Cancel ✕
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleAllocate(menu, item)}
                                      disabled={item.allocated}
                                      className={`flex-1 px-3 py-2 rounded text-sm font-medium transition ${
                                        item.allocated
                                          ? 'opacity-40 cursor-not-allowed grayscale bg-gray-300 text-gray-600'
                                          : 'bg-blue-600 text-white hover:bg-blue-700'
                                      }`}
                                      title="Allocate"
                                    >
                                      📦 Allocate
                                    </button>
                                    <button
                                      onClick={() => handleSubstitute(menu, item, displayName)}
                                      disabled={item.allocated}
                                      className={`flex-1 px-3 py-2 rounded text-sm font-medium transition ${
                                        item.allocated
                                          ? 'opacity-40 cursor-not-allowed grayscale bg-gray-300 text-gray-600'
                                          : 'bg-blue-600 text-white hover:bg-blue-700'
                                      }`}
                                      title="Substitute"
                                    >
                                      🔁 Sub
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingItemId(item.id)
                                        setEditingItemQty(item.quantity)
                                      }}
                                      disabled={item.allocated}
                                      className={`flex-1 px-3 py-2 rounded text-sm font-medium transition ${
                                        item.allocated
                                          ? 'opacity-40 cursor-not-allowed grayscale bg-gray-300 text-gray-600'
                                          : 'bg-blue-600 text-white hover:bg-blue-700'
                                      }`}
                                      title="Edit quantity"
                                    >
                                      ✏️ Edit
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (window.confirm('Delete this item?')) {
                                          handleDeleteItem(menu, item.id)
                                        }
                                      }}
                                      disabled={item.allocated}
                                      className={`flex-1 px-3 py-2 rounded text-sm font-medium transition ${
                                        item.allocated
                                          ? 'opacity-40 cursor-not-allowed grayscale bg-gray-300 text-gray-600'
                                          : 'bg-red-600 text-white hover:bg-red-700'
                                      }`}
                                      title="Delete"
                                    >
                                      🗑️
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
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
        <Modal isOpen={showCreate} title={`Create Menu for ${formatDisplayDate(currentDate)}`} onClose={() => setShowCreate(false)} size="lg">
          <div className="space-y-3">
            <div className="flex gap-3 items-center">
              <label className="font-medium">Meal:</label>
              <select value={createMeal} onChange={(e) => setCreateMeal(e.target.value)} className="border rounded px-2 py-1">
                {MEAL_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {children.length > 0 && (
              <div className="flex gap-3 items-center">
                <label className="font-medium">Child:</label>
                <select value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)} className="border rounded px-2 py-1">
                  <option value="">-- No child --</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>{child.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              {createItems.items.map((row, idx) => {
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
        </Modal>

        {/* Edit Modal */}
        <Modal isOpen={showEdit && !!editMenu} title={`${editMode === 'add' ? 'Add Item to' : 'Edit'} ${editMenu?.type} Menu for ${formatDisplayDate(currentDate)}`} onClose={() => setShowEdit(false)} size="lg">
          <div className="space-y-3">
            <div className="space-y-2">
              {editItems.items.map((row, idx) => {
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
        </Modal>

      </main>
    </div>
  )
}
