import apiClient from './apiClient'

export const groupService = {
  async getAll() {
    const response = await apiClient.get('/api/groups')
    const data = response.data
    // Normalize response - handle both array and object format
    return Array.isArray(data) ? data : (data?.groups || [])
  },

  async getById(groupId) {
    const response = await apiClient.get(`/api/groups/${groupId}`)
    return response.data
  },

  async create(name) {
    const response = await apiClient.post('/api/groups', { name })
    return response.data
  },

  async generateInviteCode(groupId) {
    const response = await apiClient.post(`/api/groups/${groupId}/invite`)
    return response.data
  },

  async acceptInvite(inviteCode) {
    const response = await apiClient.post('/api/groups/invite/accept', { invite_code: inviteCode })
    return response.data
  },

  async removeMember(groupId, memberId) {
    const response = await apiClient.delete(`/api/groups/${groupId}/members/${memberId}`)
    return response.data
  },

  async updateMemberRole(groupId, memberId, role) {
    const response = await apiClient.patch(`/api/groups/${groupId}/members/${memberId}`, { role })
    return response.data
  },

  async inviteMember(groupId, email) {
    const response = await apiClient.post(`/api/groups/${groupId}/members`, { email })
    return response.data
  }
}
