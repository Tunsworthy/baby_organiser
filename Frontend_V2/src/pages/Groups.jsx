import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { groupService } from '../services/groupService'
import Navbar from '../components/Navbar'
import ErrorAlert from '../components/ErrorAlert'
import Modal from '../components/Modal'
import { getRoleDisplay } from '../utils/roleUtils'

export default function Groups() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [groups, setGroups] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await groupService.getAll()
      setGroups(data || [])
    } catch (err) {
      setError('Failed to load groups')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateGroup = async (e) => {
    e.preventDefault()
    if (!groupName.trim()) return

    setIsCreating(true)
    try {
      await groupService.create(groupName)
      setGroupName('')
      setShowCreateModal(false)
      await loadGroups()
    } catch (err) {
      setError('Failed to create group')
      console.error(err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleGroupClick = (groupId) => {
    navigate(`/groups/${groupId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Groups</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition"
          >
            + Create Group
          </button>
        </div>

        {error && (
          <ErrorAlert message={error} onDismiss={() => setError(null)} className="mb-4" />
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading groups...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No groups yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div
                key={group.id}
                onClick={() => handleGroupClick(group.id)}
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition transform hover:scale-105"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-2">{group.name}</h3>
                <p className="text-gray-600 mb-4">
                  👥 {group.member_count || 1} member{group.member_count !== 1 ? 's' : ''}
                </p>
                <div className="text-sm text-indigo-600 font-semibold">
                  {getRoleDisplay(group.user_role)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} title="Create New Group" onClose={() => setShowCreateModal(false)}>
        <form onSubmit={handleCreateGroup}>
          <input
            type="text"
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:border-blue-500"
            disabled={isCreating}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
              disabled={isCreating || !groupName.trim()}
            >
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
