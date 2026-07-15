import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return formatDate(d)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function generateFingerprint(data: {
  brandId?: string
  productUrl?: string
  template: string
  keywords: string[]
}): string {
  const normalizedUrl = data.productUrl
    ? new URL(data.productUrl).hostname + new URL(data.productUrl).pathname.toLowerCase()
    : ''

  const parts = [
    data.brandId || 'open',
    normalizedUrl,
    data.template,
    ...data.keywords.sort(),
  ]

  return parts.join('|')
}

export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.ceil((percentile / 100) * sorted.length) - 1
  return sorted[Math.max(0, index)]
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidE164Phone(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone)
}

export function generateOTP(length: number = 6): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('')
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  const maskedLocal = local.length > 2
    ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
    : local[0] + '*'
  return `${maskedLocal}@${domain}`
}

export function maskPhone(phone: string): string {
  if (phone.length < 4) return phone
  return '*'.repeat(phone.length - 4) + phone.slice(-4)
}

export const DEFAULT_POST_AUTH_REDIRECT = '/campaigns'

export function isSafeRedirectPath(path: string | null | undefined): boolean {
  if (!path || !path.startsWith('/')) return false
  // Browsers resolve `//host` and `/\host` to a different origin.
  if (path.startsWith('//') || path.startsWith('/\\')) return false
  // Control characters can be stripped during URL parsing, smuggling a
  // different destination past the checks above.
  return !/[\x00-\x1f\x7f]/.test(path)
}

export function safeRedirectPath(path: string | null | undefined): string {
  return isSafeRedirectPath(path) ? path! : DEFAULT_POST_AUTH_REDIRECT
}

export function buildVerifyUrl(appUrl: string, token: string, redirect?: string): string {
  const base = `${appUrl}/verify?token=${encodeURIComponent(token)}`
  return isSafeRedirectPath(redirect)
    ? `${base}&redirect=${encodeURIComponent(redirect!)}`
    : base
}
