export const fmt = (n, decimals = 2) => {
  if (n === null || n === undefined) return '—'
  return Number(n).toLocaleString('en-IN', { maximumFractionDigits: decimals })
}

export const fmtCr = (n) => {
  if (!n) return '₹0'
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)}L`
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`
  return `₹${fmt(n, 0)}`
}

export const fmtINR = (n) => `₹${fmt(n)}`

// Displays any date as day-month(-year), e.g. "19 Jul" or "19 Jul 2026" — the
// app-wide date order, independent of the browser's locale/OS settings.
// Accepts an ISO 'YYYY-MM-DD' (optionally with a time part), a Date, or any
// string the Date constructor can parse.
export const formatDate = (date, { year = true } = {}) => {
  if (!date) return '—'
  let parsed
  if (date instanceof Date) {
    parsed = date
  } else {
    const str = String(date)
    parsed = /^\d{4}-\d{2}-\d{2}$/.test(str) ? new Date(`${str}T00:00:00`) : new Date(str.replace(' ', 'T'))
  }
  if (isNaN(parsed.getTime())) return String(date)
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', ...(year ? { year: 'numeric' } : {}) })
}

export const chartColors = {
  grid: 'rgba(36,45,62,0.8)',
  tick: '#5a6a82',
  ms:    '#f59e0b',
  hsd:   '#10b981',
  speed: '#3b82f6',
  cash:  '#10b981',
  phone: '#6366f1',
  card:  '#3b82f6',
  exp:   '#ef4444',
}

export const avatarColor = (name = '') => {
  const colors = ['#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#06b6d4','#ec4899','#84cc16','#f97316','#6366f1']
  let hash = 0
  for (const c of name) hash = (hash << 5) - hash + c.charCodeAt(0)
  return colors[Math.abs(hash) % colors.length]
}
