import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { groupService } from '../services/groupService'
import Navbar from '../components/Navbar'
import ErrorAlert from '../components/ErrorAlert'
import { getRoleDisplay } from '../utils/roleUtils'

export default function GroupDetails() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [inviteCode, setInviteCode] = useState(null)
  const [editingMemberId, setEditingMemberId] = useState(null)
  const [editingRole, setEditingRole] = useState('')
  const [showInviteCodeCopied, setShowInviteCodeCopied] = useState(false)
  const [removingMemberId, setRemovingMemberId] = useState(null)

  const isOwner = group && user && group.user_role === 'owner'

  useEffect(() => {
    loadGroupDetails()
  }, [groupId])

  const loadGroupDetails = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await groupService.getById(groupId)
      setGroup(data)
      setMembers(data.members || [])
    } catch (err) {
      setError('Failed to load group details')
      console.error(err)
    } finally {
      setIsLoading(false)
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
        )}

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
                    <td className="px-6 py-4 text-gray-800">{member.name}</td>
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
    </div>
  )
}
