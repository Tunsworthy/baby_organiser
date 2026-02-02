import { useEffect, useMemo, useRef, useState } from 'react'
import Navbar from '../components/Navbar'
import ErrorAlert from '../components/ErrorAlert'
import Modal from '../components/Modal'
import { childService } from '../services/childService'
import { groupService } from '../services/groupService'
import { scheduleService } from '../services/scheduleService'
import {
  SNAP_MINUTES,
  MIN_DURATION_MINUTES,
  MINUTES_IN_DAY,
  PIXELS_PER_MINUTE,
  timeToMinutes,
  minutesToTime,
  snapMinutes,
  clampDuration
} from '../utils/scheduleUtils'

const TIME_BLOCKS = Array.from({ length: 48 }, (_, i) => i * 30)

export default function Schedules() {
  const [children, setChildren] = useState([])
  const [selectedChildId, setSelectedChildId] = useState('')
  const [schedules, setSchedules] = useState([])
  const [selectedScheduleId, setSelectedScheduleId] = useState('')
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const [showCreateSchedule, setShowCreateSchedule] = useState(false)
  const [newScheduleName, setNewScheduleName] = useState('')
  const [newScheduleActive, setNewScheduleActive] = useState(false)

  const [showCopySchedule, setShowCopySchedule] = useState(false)
  const [copyName, setCopyName] = useState('')
  const [groups, setGroups] = useState([])
  const [targetGroupId, setTargetGroupId] = useState('')
  const [targetChildren, setTargetChildren] = useState([])
  const [targetChildId, setTargetChildId] = useState('')

  const [selectedItemId, setSelectedItemId] = useState(null)
  const [formState, setFormState] = useState({
    activityName: '',
    description: '',
    notes: '',
    startTime: '08:00',
    endTime: '08:15'
  })

  const dragStateRef = useRef(null)
  const itemsRef = useRef([])
  const scheduleContainerRef = useRef(null)

  const selectedSchedule = useMemo(
    () => schedules.find((s) => String(s.id) === String(selectedScheduleId)),
    [schedules, selectedScheduleId]
  )

  useEffect(() => {
    loadChildren()
  }, [])

  useEffect(() => {
    if (!selectedChildId) return
    loadSchedules(selectedChildId)
  }, [selectedChildId])

  useEffect(() => {
    if (!selectedScheduleId) {
      setItems([])
      return
    }
    loadScheduleDetail(selectedScheduleId)
  }, [selectedScheduleId])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    if (scheduleContainerRef.current) {
      const sevenAmPosition = 7 * 60 * PIXELS_PER_MINUTE
      scheduleContainerRef.current.scrollTop = sevenAmPosition
    }
  }, [selectedScheduleId])

  useEffect(() => {
    if (!selectedItemId) return
    const item = items.find((i) => i.id === selectedItemId)
    if (!item) return
    setFormState({
      activityName: item.activityName || '',
      description: item.description || '',
      notes: item.notes || '',
      startTime: item.startTime || '08:00',
      endTime: item.endTime || '08:15'
    })
  }, [selectedItemId, items])

  const loadChildren = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await childService.getAll()
      setChildren(data)
      if (data.length > 0) {
        setSelectedChildId(String(data[0].id))
      }
    } catch (err) {
      setError('Failed to load children')
    } finally {
      setIsLoading(false)
    }
  }

  const loadSchedules = async (childId) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await scheduleService.listByChild(childId)
      setSchedules(data)
      if (data.length > 0) {
        setSelectedScheduleId(String(data[0].id))
      } else {
        setSelectedScheduleId('')
      }
    } catch (err) {
      setError('Failed to load schedules')
    } finally {
      setIsLoading(false)
    }
  }

  const loadScheduleDetail = async (scheduleId) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await scheduleService.getById(scheduleId)
      setItems(data.items || [])
    } catch (err) {
      setError('Failed to load schedule detail')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSchedule = async (e) => {
    e.preventDefault()
    if (!newScheduleName.trim() || !selectedChildId) return

    setIsLoading(true)
    setError(null)
    try {
      await scheduleService.create({
        childId: Number(selectedChildId),
        name: newScheduleName.trim(),
        isActive: newScheduleActive
      })
      setShowCreateSchedule(false)
      setNewScheduleName('')
      setNewScheduleActive(false)
      await loadSchedules(selectedChildId)
    } catch (err) {
      setError('Failed to create schedule')
    } finally {
      setIsLoading(false)
    }
  }

  const handleActivateSchedule = async (scheduleId) => {
    setIsLoading(true)
    setError(null)
    try {
      await scheduleService.activate(scheduleId)
      await loadSchedules(selectedChildId)
    } catch (err) {
      setError('Failed to activate schedule')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddItem = async () => {
    if (!selectedScheduleId) return
    setIsLoading(true)
    setError(null)
    try {
      const payload = {
        startTime: '08:00',
        endTime: '08:15',
        activityName: 'New Activity',
        description: '',
        notes: '',
        sortOrder: items.length
      }
      const res = await scheduleService.createItem(selectedScheduleId, payload)
      const newItem = res.item
      setItems((prev) => [...prev, newItem])
      setSelectedItemId(newItem.id)
    } catch (err) {
      setError('Failed to create item')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Delete this item?')) return
    setIsLoading(true)
    setError(null)
    try {
      await scheduleService.removeItem(itemId)
      setItems((prev) => prev.filter((i) => i.id !== itemId))
      if (selectedItemId === itemId) {
        setSelectedItemId(null)
      }
    } catch (err) {
      setError('Failed to delete item')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveForm = async () => {
    if (!selectedItemId) return
    setIsLoading(true)
    setError(null)
    try {
      const payload = {
        activityName: formState.activityName,
        description: formState.description,
        notes: formState.notes,
        startTime: formState.startTime,
        endTime: formState.endTime
      }
      const res = await scheduleService.updateItem(selectedItemId, payload)
      setItems((prev) => prev.map((i) => (i.id === selectedItemId ? res.item : i)))
    } catch (err) {
      setError('Failed to update item')
    } finally {
      setIsLoading(false)
    }
  }

  const beginDrag = (e, item, type) => {
    e.preventDefault()
    const startMinutes = timeToMinutes(item.startTime)
    const endMinutes = timeToMinutes(item.endTime)
    dragStateRef.current = {
      type,
      itemId: item.id,
      startY: e.clientY,
      startMinutes,
      endMinutes
    }
    setSelectedItemId(item.id)
    window.addEventListener('pointermove', onDragMove)
    window.addEventListener('pointerup', onDragEnd)
  }

  const onDragMove = (e) => {
    if (!dragStateRef.current) return
    const { type, itemId, startY, startMinutes, endMinutes } = dragStateRef.current
    const delta = snapMinutes((e.clientY - startY) / PIXELS_PER_MINUTE)

    if (type === 'move') {
      const duration = endMinutes - startMinutes
      let nextStart = startMinutes + delta
      nextStart = Math.max(0, Math.min(MINUTES_IN_DAY - duration, nextStart))
      const nextEnd = nextStart + duration
      updateItemLocal(itemId, {
        startTime: minutesToTime(nextStart),
        endTime: minutesToTime(nextEnd)
      })
      return
    }

    if (type === 'resize') {
      let nextEnd = endMinutes + delta
      nextEnd = Math.min(MINUTES_IN_DAY, nextEnd)
      nextEnd = clampDuration(startMinutes, nextEnd)
      updateItemLocal(itemId, {
        endTime: minutesToTime(nextEnd)
      })
    }
  }

  const onDragEnd = async () => {
    const dragState = dragStateRef.current
    if (!dragState) return

    dragStateRef.current = null
    window.removeEventListener('pointermove', onDragMove)
    window.removeEventListener('pointerup', onDragEnd)

    const item = itemsRef.current.find((i) => i.id === dragState.itemId)
    if (!item) return

    try {
      await scheduleService.updateItem(item.id, {
        startTime: item.startTime,
        endTime: item.endTime
      })
    } catch (err) {
      setError('Failed to update item time')
    }
  }

  const updateItemLocal = (itemId, updates) => {
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, ...updates } : i)))
  }

  const openCopyModal = async () => {
    setShowCopySchedule(true)
    setCopyName('')
    setTargetGroupId('')
    setTargetChildId('')
    setTargetChildren([])
    try {
      const data = await groupService.getAll()
      setGroups(data)
    } catch (err) {
      setError('Failed to load groups')
    }
  }

  const loadTargetChildren = async (groupId) => {
    setTargetGroupId(groupId)
    setTargetChildId('')
    if (!groupId) return
    try {
      const data = await childService.getAll(groupId)
      setTargetChildren(data)
    } catch (err) {
      setError('Failed to load target children')
    }
  }

  const handleCopySchedule = async (e) => {
    e.preventDefault()
    if (!selectedScheduleId || !targetChildId) return

    setIsLoading(true)
    setError(null)
    try {
      await scheduleService.copy(selectedScheduleId, {
        targetChildId: Number(targetChildId),
        name: copyName || undefined
      })
      setShowCopySchedule(false)
      setCopyName('')
      setTargetGroupId('')
      setTargetChildId('')
    } catch (err) {
      setError('Failed to copy schedule')
    } finally {
      setIsLoading(false)
    }
  }

  const handleScheduleClick = async (e) => {
    if (!selectedScheduleId) return
    if (e.target !== e.currentTarget && !e.target.classList.contains('time-block')) return

    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top + e.currentTarget.scrollTop
    const clickedMinutes = Math.floor(y / PIXELS_PER_MINUTE)
    const snappedStart = snapMinutes(clickedMinutes)
    const snappedEnd = snappedStart + SNAP_MINUTES

    const startTime = minutesToTime(snappedStart)
    const endTime = minutesToTime(snappedEnd)

    setIsLoading(true)
    setError(null)
    try {
      const newItem = await scheduleService.createItem(selectedScheduleId, {
        activityName: 'New Activity',
        startTime,
        endTime,
        sortOrder: items.length
      })
      setItems((prev) => [...prev, newItem])
      setSelectedItemId(newItem.id)
    } catch (err) {
      setError('Failed to create item')
    } finally {
      setIsLoading(false)
    }
  }

  const scheduleItems = items.map((item) => {
    const start = timeToMinutes(item.startTime)
    const end = timeToMinutes(item.endTime)
    const top = start * PIXELS_PER_MINUTE
    const height = Math.max((end - start) * PIXELS_PER_MINUTE, MIN_DURATION_MINUTES * PIXELS_PER_MINUTE)
    const isSelected = item.id === selectedItemId

    return (
      <div
        key={item.id}
        className={`absolute left-16 right-4 rounded border p-2 text-xs shadow-sm ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
        }`}
        style={{ top, height }}
        onPointerDown={(e) => beginDrag(e, item, 'move')}
      >
        <div className="font-semibold text-gray-800 truncate">{item.activityName}</div>
        <div className="text-gray-500">{item.startTime} - {item.endTime}</div>
        <div
          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-blue-200"
          onPointerDown={(e) => {
            e.stopPropagation()
            beginDrag(e, item, 'resize')
          }}
        />
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleDeleteItem(item.id)
          }}
          className="absolute top-1 right-1 text-red-500 hover:text-red-700"
          title="Delete"
        >
          ✕
        </button>
      </div>
    )
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Schedules</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateSchedule(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
            >
              + New Schedule
            </button>
            <button
              onClick={openCopyModal}
              disabled={!selectedScheduleId}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded disabled:opacity-50"
            >
              Copy Schedule
            </button>
          </div>
        </div>

        {error && (
          <ErrorAlert message={error} onDismiss={() => setError(null)} className="mb-4" />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Child</label>
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              {children.map((child) => (
                <option key={child.id} value={child.id}>{child.name}</option>
              ))}
            </select>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">Schedules</h2>
              </div>
              <div className="space-y-2">
                {schedules.length === 0 && (
                  <div className="text-sm text-gray-500">No schedules yet.</div>
                )}
                {schedules.map((schedule) => (
                  <button
                    key={schedule.id}
                    onClick={() => setSelectedScheduleId(String(schedule.id))}
                    className={`w-full text-left px-3 py-2 rounded border ${
                      String(schedule.id) === String(selectedScheduleId)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-semibold text-gray-800 flex items-center justify-between">
                      <span>{schedule.name}</span>
                      {schedule.isActive && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Active</span>
                      )}
                    </div>
                    {!schedule.isActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleActivateSchedule(schedule.id)
                        }}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                      >
                        Set Active
                      </button>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-4 mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Active schedule</div>
                <div className="text-xl font-semibold text-gray-900">
                  {selectedSchedule ? selectedSchedule.name : 'Select a schedule'}
                </div>
              </div>
              <button
                onClick={handleAddItem}
                disabled={!selectedScheduleId}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded disabled:opacity-50"
              >
                + Add Item
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3 bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-600 mb-2">
                  Drag to move, resize to change duration, or click to create. Snap: {SNAP_MINUTES} min.
                </div>
                <div 
                  ref={scheduleContainerRef}
                  onClick={handleScheduleClick}
                  className="relative border rounded-lg overflow-y-auto cursor-pointer" 
                  style={{ height: 600 }}
                >
                  <div style={{ height: MINUTES_IN_DAY * PIXELS_PER_MINUTE, position: 'relative' }}>
                    {TIME_BLOCKS.map((minutes) => {
                      const hour = Math.floor(minutes / 60)
                      const minute = minutes % 60
                      const timeLabel = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
                      return (
                        <div key={minutes} className="time-block absolute left-0 right-0 border-t border-gray-200" style={{ top: minutes * PIXELS_PER_MINUTE }}>
                          <span className="absolute left-2 -top-3 text-xs text-gray-500 bg-white px-1">{timeLabel}</span>
                        </div>
                      )
                    })}
                    {scheduleItems}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold mb-3">Edit Item</h3>
                {selectedItemId ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        value={formState.activityName}
                        onChange={(e) => setFormState((prev) => ({ ...prev, activityName: e.target.value }))}
                        className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Start</label>
                        <input
                          type="time"
                          value={formState.startTime}
                          onChange={(e) => setFormState((prev) => ({ ...prev, startTime: e.target.value }))}
                          className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">End</label>
                        <input
                          type="time"
                          value={formState.endTime}
                          onChange={(e) => setFormState((prev) => ({ ...prev, endTime: e.target.value }))}
                          className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={formState.description}
                        onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        value={formState.notes}
                        onChange={(e) => setFormState((prev) => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                        className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
                      />
                    </div>
                    <button
                      onClick={handleSaveForm}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
                      disabled={isLoading}
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Select an item to edit.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showCreateSchedule} title="Create Schedule" onClose={() => setShowCreateSchedule(false)}>
        <form onSubmit={handleCreateSchedule} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              value={newScheduleName}
              onChange={(e) => setNewScheduleName(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={newScheduleActive}
              onChange={(e) => setNewScheduleActive(e.target.checked)}
            />
            Set as active schedule
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowCreateSchedule(false)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded"
            >
              Create
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showCopySchedule} title="Copy Schedule" onClose={() => setShowCopySchedule(false)}>
        <form onSubmit={handleCopySchedule} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">New name (optional)</label>
            <input
              value={copyName}
              onChange={(e) => setCopyName(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Target group</label>
            <select
              value={targetGroupId}
              onChange={(e) => loadTargetChildren(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Select group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Target child</label>
            <select
              value={targetChildId}
              onChange={(e) => setTargetChildId(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Select child</option>
              {targetChildren.map((child) => (
                <option key={child.id} value={child.id}>{child.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowCopySchedule(false)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded disabled:opacity-50"
              disabled={!targetChildId}
            >
              Copy
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
