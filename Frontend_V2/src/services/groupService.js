import apiClient from './apiClient'

export const groupService = {
  async getAll() {
    const response = await apiClient.get('/groups')
    return response.data
  },

  async getById(groupId) {
    const response = await apiClient.get(`/groups/${groupId}`)
    return response.data
  },

  async create(name) {
    const response = await apiClient.post('/groups', { name })
    return response.data
  },

  async generateInviteCode(groupId) {
    const response = await apiClient.post(`/groups/${groupId}/invite-code`)
    return response.data
  },

  async acceptInvite(inviteCode) {
    const response = await apiClient.post('/groups/accept-invite', { invite_code: inviteCode })
    return response.data
  },

  async removeMember(groupId, memberId) {
    const response = await apiClient.delete(`/groups/${groupId}/members/${memberId}`)
    return response.data
  },

  async updateMemberRole(groupId, memberId, role) {
    const response = await apiClient.put(`/groups/${groupId}/members/${memberId}/role`, { role })
    return response.data
  }
}
