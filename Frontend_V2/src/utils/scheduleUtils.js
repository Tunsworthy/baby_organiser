export const SNAP_MINUTES = 15
export const MIN_DURATION_MINUTES = 15
export const MINUTES_IN_DAY = 24 * 60
export const PIXELS_PER_MINUTE = 4

export function timeToMinutes(time) {
  if (!time) return 0
  const [h, m] = time.split(':').map(Number)
  return (h * 60) + (m || 0)
}

export function minutesToTime(minutes) {
  const clamped = Math.max(0, Math.min(MINUTES_IN_DAY, minutes))
  const h = Math.floor(clamped / 60)
  const m = Math.floor(clamped % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function snapMinutes(minutes) {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES
}

export function clampDuration(startMinutes, endMinutes) {
  const minEnd = startMinutes + MIN_DURATION_MINUTES
  return Math.max(endMinutes, minEnd)
}
