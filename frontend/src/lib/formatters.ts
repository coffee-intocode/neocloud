export function formatCurrency(value: number | null | undefined) {
  if (value == null) {
    return 'Unavailable'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: value < 1 ? 2 : 0,
    maximumFractionDigits: value < 10 ? 2 : 0,
  }).format(value)
}

export function formatHourlyPrice(value: number | null | undefined) {
  if (value == null) {
    return 'Unavailable'
  }

  return `${formatCurrency(value)}/hr`
}

export function formatGigabytes(value: number | null | undefined) {
  if (value == null) {
    return 'Unavailable'
  }

  if (value >= 1024) {
    return `${(value / 1024).toFixed(2)} TB`
  }

  return `${value.toFixed(value >= 100 ? 0 : 1)} GB`
}

export function formatCount(value: number | null | undefined, noun: string) {
  if (value == null) {
    return 'Unavailable'
  }

  return `${value} ${noun}${value === 1 ? '' : 's'}`
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return 'Unavailable'
  }

  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function titleCase(value: string | null | undefined) {
  if (!value) {
    return 'Unavailable'
  }

  return value
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ')
}

export function formatPercent(value: number | null | undefined) {
  if (value == null) {
    return 'Unavailable'
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)}%`
}

export function getInitials(value: string | null | undefined) {
  if (!value) {
    return 'NC'
  }

  const normalizedValue = value.includes('@') ? value.split('@')[0] : value
  const parts = normalizedValue
    .replace(/\d+/g, ' ')
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)

  if (parts.length === 0) {
    return 'NC'
  }

  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join('')
}
