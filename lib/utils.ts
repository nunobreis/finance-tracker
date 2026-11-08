import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display',
            'display-sm',
            'h1',
            'h1-sm',
            'h2',
            'body',
            'body-sm',
            'caption',
            'label',
          ],
        },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs))
}

export function formatEur(amount: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function parseDateSafe(date: string | Date): Date {
  if (typeof date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return new Date(`${date}T00:00:00`)
    }
    return new Date(date)
  }
  return date
}

export function formatDate(
  date: string | Date,
  locale?: string,
  options?: { includeYear?: boolean }
): string {
  const d = parseDateSafe(date)
  if (isNaN(d.getTime())) return typeof date === 'string' ? date : ''

  if (locale === undefined) {
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

  const intlLocale = locale === 'pt-PT' ? 'pt-PT' : 'en-GB'
  const day = new Intl.DateTimeFormat(intlLocale, { day: 'numeric' }).format(d)
  const month = new Intl.DateTimeFormat(intlLocale, { month: 'short' }).format(d)
  if (options?.includeYear) {
    return `${day} ${month} ${d.getFullYear()}`
  }
  return `${day} ${month}`
}

export function formatMonthYear(date: string | Date, locale: string = 'en'): string {
  const d = parseDateSafe(date)
  if (isNaN(d.getTime())) return typeof date === 'string' ? date : ''
  const intlLocale = locale === 'pt-PT' ? 'pt-PT' : 'en-GB'
  const month = new Intl.DateTimeFormat(intlLocale, { month: 'short' }).format(d)
  return `${month} ${d.getFullYear()}`
}

export function formatMoney(
  amount: number,
  currency: string,
  locale: string = 'en',
  options?: { signDisplay?: 'auto' | 'always' }
): string {
  const intlLocale = locale === 'pt-PT' ? 'pt-PT' : 'en-IE'
  const absFormatted = new Intl.NumberFormat(intlLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))

  if (amount < 0) {
    return `−${absFormatted}`
  }
  if (options?.signDisplay === 'always' && amount > 0) {
    return `+${absFormatted}`
  }
  return absFormatted
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Returns true if `description` is non-empty AND differs from `merchant`
 * (case-insensitive, trimmed). Use this to suppress redundant description lines
 * on transaction rows when the description is just a copy of the merchant name.
 */
export function shouldShowDescription(
  description: string | null | undefined,
  merchant: string | null | undefined,
): boolean {
  if (!description) return false
  if (!merchant) return true
  return description.trim().toLowerCase() !== merchant.trim().toLowerCase()
}

export function formatShortCurrency(amount: number, currency: string, locale?: string): string {
  const intlLocale = locale === 'pt-PT' ? 'pt-PT' : 'en-IE'
  const symbol =
    new Intl.NumberFormat(intlLocale, { style: 'currency', currency, maximumFractionDigits: 0 })
      .formatToParts(0)
      .find(p => p.type === 'currency')?.value ?? currency
  if (Math.abs(amount) >= 1000) return `${symbol}${(amount / 1000).toFixed(1)}k`
  return `${symbol}${amount.toFixed(0)}`
}
