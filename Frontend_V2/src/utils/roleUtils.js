export function getRoleDisplay(role) {
  const roleConfig = {
    owner: { emoji: '👑', label: 'Owner' },
    admin: { emoji: '🔑', label: 'Admin' },
    member: { emoji: '👤', label: 'Member' }
  }
  
  const config = roleConfig[role] || roleConfig.member
  return `${config.emoji} ${config.label}`
}
