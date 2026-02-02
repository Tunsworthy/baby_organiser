import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { groupService } from '../services/groupService'
import { childService } from '../services/childService'
import Navbar from '../components/Navbar'
import ErrorAlert from '../components/ErrorAlert'
import Modal from '../components/Modal'
import { getRoleDisplay } from '../utils/roleUtils'
import { getMemberDisplayName } from '../utils/nameUtils'

export default function GroupDetails() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [children, setChildren] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isChildrenLoading, setIsChildrenLoading] = useState(true)
  const [error, setError] = useState(null)
  const [inviteCode, setInviteCode] = useState(null)
  const [editingMemberId, setEditingMemberId] = useState(null)
  const [editingRole, setEditingRole] = useState('')
  const [showInviteCodeCopied, setShowInviteCodeCopied] = useState(false)
  const [removingMemberId, setRemovingMemberId] = useState(null)
  const [showCreateChild, setShowCreateChild] = useState(false)
  const [childName, setChildName] = useState('')
  const [isCreatingChild, setIsCreatingChild] = useState(false)
  const [showInviteMember, setShowInviteMember] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInvitingMember, setIsInvitingMember] = useState(false)

  const isOwner = group && user && group.user_role?.toLowerCase() === 'owner'

  useEffect(() => {
    loadGroupDetails()
    loadChildren()
  }, [groupId])

  const loadGroupDetails = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await groupService.getById(groupId)
      const groupData = data.group || data
      const membersData = data.members || groupData.members || []
      const currentMember = membersData.find((m) => m.id === user?.id)
      const userRole = currentMember?.role || groupData.user_role || groupData.role
      setGroup({ ...groupData, user_role: userRole })
      setMembers(membersData)
    } catch (err) {
      setError('Failed to load group details')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadChildren = async () => {
    setIsChildrenLoading(true)
    try {
      const data = await childService.getAll()
      setChildren(data)
    } catch (err) {
      setError('Failed to load children')
      console.error(err)
    } finally {
      setIsChildrenLoading(false)
    }
  }

  const handleGenerateInviteCode = async () => {
    try {
      const response = await groupService.generateInviteCode(groupId)
      setInviteCode(response.invite_code)
    } catch (err) {
      setError('Failed to generate invite code')
      console.error(err)
    }
  }

  const handleCopyInviteCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode)
      setShowInviteCodeCopied(true)
      setTimeout(() => setShowInviteCodeCopied(false), 2000)
    }
  }

  const handleEditRoleStart = (memberId, currentRole) => {
    setEditingMemberId(memberId)
    setEditingRole(currentRole)
  }

  const handleEditRoleCancel = () => {
    setEditingMemberId(null)
    setEditingRole('')
  }

  const handleEditRoleSave = async (memberId) => {
    try {
      await groupService.updateMemberRole(groupId, memberId, editingRole)
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: editingRole } : m))
      )
      setEditingMemberId(null)
      setEditingRole('')
    } catch (err) {
      setError('Failed to update member role')
      console.error(err)
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        setRemovingMemberId(memberId)
        await groupService.removeMember(groupId, memberId)
        setMembers((prev) => prev.filter((m) => m.id !== memberId))
      } catch (err) {
        setError('Failed to remove member')
        console.error(err)
      } finally {
        setRemovingMemberId(null)
      }
    }
  }

  const handleCreateChild = async (e) => {
    e.preventDefault()
    if (!childName.trim()) return

    setIsCreatingChild(true)
    setError(null)
    try {
      await childService.create(childName.trim())
      setChildName('')
      setShowCreateChild(false)
      await loadChildren()
    } catch (err) {
      setError('Failed to create child')
      console.error(err)
    } finally {
      setIsCreatingChild(false)
    }
  }

  const handleDeleteChild = async (childId) => {
    if (window.confirm('Are you sure you want to delete this child?')) {
      try {
        setError(null)
        await childService.remove(childId)
        setChildren((prev) => prev.filter((c) => c.id !== childId))
      } catch (err) {
        setError('Failed to delete child')
        console.error(err)
      }
    }
  }

  const handleInviteMember = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setIsInvitingMember(true)
    setError(null)
    try {
      await groupService.inviteMember(groupId, inviteEmail.trim())
      setInviteEmail('')
      setShowInviteMember(false)
      await loadGroupDetails()
    } catch (err) {
      setError('Failed to invite member')
      console.error(err)
    } finally {
      setIsInvitingMember(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-600">Loading group details...</p>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <p className="text-red-600">Group not found</p>
          <button
            onClick={() => navigate('/groups')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Back to Groups
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">{group.name}</h1>
            <p className="text-gray-600 mt-2">{getRoleDisplay(group.user_role)}</p>
          </div>
          <button
            onClick={() => navigate('/groups')}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition"
          >
            ← Back
          </button>
        </div>

        {error && (
          <ErrorAlert message={error} onDismiss={() => setError(null)} className="mb-4" />
        )}

        {/* Invite Code Section */}
        {isOwner && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Invite Members</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Option 1: Invite by Email</h3>
                <button
                  onClick={() => setShowInviteMember(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition"
                >
                  + Invite Member
                </button>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-700 mb-2">Option 2: Invite by Code</h3>
                {!inviteCode ? (
                  <button
                    onClick={handleGenerateInviteCode}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition"
                  >
                    Generate Invite Code
                  </button>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-gray-600 mb-2">Share this code:</p>
                      <div className="bg-gray-100 p-4 rounded-lg font-mono text-lg font-bold text-center">
                        {inviteCode}
                      </div>
                    </div>
                    <button
                      onClick={handleCopyInviteCode}
                      className={`font-bold py-2 px-6 rounded-lg transition ${
                        showInviteCodeCopied
                          ? 'bg-green-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {showInviteCodeCopied ? '✓ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Children Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Children</h2>
            <button
              onClick={() => setShowCreateChild(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              + Add Child
            </button>
          </div>

          {isChildrenLoading ? (
            <p className="text-gray-600">Loading children...</p>
          ) : children.length === 0 ? (
            <p className="text-gray-600">No children yet. Add one to link menus.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map((child) => (
                <div key={child.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="font-semibold text-gray-900">{child.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Added {child.createdAt ? new Date(child.createdAt).toLocaleDateString() : 'Recently'}
                  </div>
                  <button
                    onClick={() => handleDeleteChild(child.id)}
                    className="mt-3 text-sm text-red-600 hover:text-red-800"
                  >
                    🗑️ Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Members Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-indigo-600 text-white">
            <h2 className="text-2xl font-bold">Members ({members.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Role</th>
                  {isOwner && <th className="px-6 py-3 text-left font-semibold text-gray-700">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {members.map((member, idx) => (
                  <tr key={member.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 text-gray-800">{getMemberDisplayName(member)}</td>
                    <td className="px-6 py-4 text-gray-600">{member.email}</td>
                    <td className="px-6 py-4">
                      {editingMemberId === member.id && isOwner ? (
                        <div className="flex gap-2 items-center">
                          <select
                            value={editingRole}
                            onChange={(e) => setEditingRole(e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => handleEditRoleSave(member.id)}
                            className="text-green-600 hover:text-green-800 font-bold text-sm"
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleEditRoleCancel}
                            className="text-red-600 hover:text-red-800 font-bold text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <span className="text-indigo-600 font-semibold">
                          {getRoleDisplay(member.role)}
                        </span>
                      )}
                    </td>
                    {isOwner && (
                      <td className="px-6 py-4">
                        <div className="flex gap-3">
                          {member.role !== 'owner' && (
                            <button
                              onClick={() => handleEditRoleStart(member.id, member.role)}
                              className="text-blue-600 hover:text-blue-800 font-bold text-sm"
                              disabled={editingMemberId !== null}
                            >
                              ✏️ Edit
                            </button>
                          )}
                          {member.id !== user.id && (
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-red-600 hover:text-red-800 font-bold text-sm disabled:opacity-50"
                              disabled={removingMemberId === member.id}
                            >
                              🗑️ Remove
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={showCreateChild} title="Add Child" onClose={() => setShowCreateChild(false)}>
        <form onSubmit={handleCreateChild}>
          <input
            type="text"
            placeholder="Child name"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:border-blue-500"
            disabled={isCreatingChild}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowCreateChild(false)}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
              disabled={isCreatingChild}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
              disabled={isCreatingChild || !childName.trim()}
            >
              {isCreatingChild ? 'Adding...' : 'Add Child'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showInviteMember} title="Invite Member" onClose={() => setShowInviteMember(false)}>
        <form onSubmit={handleInviteMember}>
          <input
            type="email"
            placeholder="Member email address"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:border-blue-500"
            disabled={isInvitingMember}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowInviteMember(false)}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
              disabled={isInvitingMember}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
              disabled={isInvitingMember || !inviteEmail.trim()}
            >
              {isInvitingMember ? 'Inviting...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
