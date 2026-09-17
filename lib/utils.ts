import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatEur(amount: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const fmt = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const parts = fmt.formatToParts(d)
  const day = parts.find((p) => p.type === 'day')?.value ?? ''
  const month = parts.find((p) => p.type === 'month')?.value ?? ''
  const year = parts.find((p) => p.type === 'year')?.value ?? ''
  return `${day} ${month} ${year}`
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatShortCurrency(amount: number, currency: string): string {
  const symbol =
    new Intl.NumberFormat('en-IE', { style: 'currency', currency, maximumFractionDigits: 0 })
      .formatToParts(0)
      .find(p => p.type === 'currency')?.value ?? currency
  if (Math.abs(amount) >= 1000) return `${symbol}${(amount / 1000).toFixed(1)}k`
  return `${symbol}${amount.toFixed(0)}`
}
