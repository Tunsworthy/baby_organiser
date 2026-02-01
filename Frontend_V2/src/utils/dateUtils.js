export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export function pad(n) {
  return n < 10 ? `0${n}` : `${n}`
}

export function toDateString(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function formatDisplayDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`)
  return date.toDateString()
}
