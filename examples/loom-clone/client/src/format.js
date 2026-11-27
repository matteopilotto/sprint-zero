// 65 -> "01:05"
export function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds || 0))
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

// "2026-11-26T14:32:51Z" -> "26 Nov 2026, 14:32" in the viewer's time zone
export function formatDate(iso) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// The length on a grid card's badge: 45 -> "45 sec", 250 -> "4 min",
// 3900 -> "1 hr 5 min". Minutes are whole and rounded down.
export function formatLength(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds || 0))
  if (seconds < 60) return `${seconds} sec`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const rest = minutes % 60
  return rest ? `${Math.floor(minutes / 60)} hr ${rest} min` : `${Math.floor(minutes / 60)} hr`
}

// How long ago a recording was made, in the largest whole unit and without
// "ago": "just now", "5 minutes", "1 hour", "2 days", "3 weeks", "4 months",
// "3 years". A month counts as 30 days and a year as 365.
export function formatAge(iso, now = Date.now()) {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60000)
  if (!(minutes >= 1)) return 'just now'
  const days = Math.floor(minutes / 1440)
  const count = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'}`
  if (days >= 365) return count(Math.floor(days / 365), 'year')
  if (days >= 30) return count(Math.floor(days / 30), 'month')
  if (days >= 7) return count(Math.floor(days / 7), 'week')
  if (days >= 1) return count(days, 'day')
  if (minutes >= 60) return count(Math.floor(minutes / 60), 'hour')
  return count(minutes, 'minute')
}
