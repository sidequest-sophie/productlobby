/**
 * Brand Verification Utilities
 * Handles verification tokens, domain ownership, and email domain validation
 */

import crypto from 'crypto'
import dns from 'dns/promises'
import { prisma } from '@/lib/db'

export type VerificationStatus =
  | 'PENDING'
  | 'EMAIL_VERIFIED'
  | 'DOMAIN_VERIFIED'
  | 'FULLY_VERIFIED'
  | 'REJECTED'

export interface VerificationState {
  status: VerificationStatus
  emailVerified: boolean
  domainVerified: boolean
  completedAt?: Date
  rejectedReason?: string
}

/**
 * Generate a cryptographically secure verification token
 * 32 bytes = 64 character hex string
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Verify domain ownership by checking DNS TXT records.
 * Mirrors the working implementation in
 * src/app/api/brands/[id]/verify/route.ts:92-105 — looks up the domain's
 * TXT records and confirms one of them equals `productlobby-verify=<token>`.
 */
export async function verifyDomainOwnership(
  domain: string,
  token: string
): Promise<boolean> {
  try {
    // Verify that a pending verification attempt exists for this token
    const verification = await prisma.brandVerification.findFirst({
      where: {
        token,
        method: 'DNS_TXT',
      },
    })

    if (!verification) {
      return false
    }

    // Normalize domain (strip protocol/www/path)
    let normalizedDomain = domain.toLowerCase()
    if (normalizedDomain.startsWith('http://')) {
      normalizedDomain = normalizedDomain.slice(7)
    } else if (normalizedDomain.startsWith('https://')) {
      normalizedDomain = normalizedDomain.slice(8)
    }
    normalizedDomain = normalizedDomain.replace(/^www\./, '').split('/')[0]

    const records = await dns.resolveTxt(normalizedDomain)
    const expectedValue = `productlobby-verify=${token}`

    return records.some((recordArray) =>
      recordArray.some((record) => record === expectedValue)
    )
  } catch (error) {
    console.error('Domain verification error:', error)
    return false
  }
}

/**
 * Verify that an email domain matches the brand's website domain
 * Extracts domain from email and website, then compares them
 */
export function verifyEmailDomain(email: string, brandDomain: string): boolean {
  try {
    // Extract domain from email
    const emailParts = email.split('@')
    if (emailParts.length !== 2) {
      return false
    }
    const emailDomain = emailParts[1].toLowerCase()

    // Normalize brand domain (remove protocol and www)
    let normalizedDomain = brandDomain.toLowerCase()
    if (normalizedDomain.startsWith('http://')) {
      normalizedDomain = normalizedDomain.slice(7)
    }
    if (normalizedDomain.startsWith('https://')) {
      normalizedDomain = normalizedDomain.slice(8)
    }
    if (normalizedDomain.startsWith('www.')) {
      normalizedDomain = normalizedDomain.slice(4)
    }
    normalizedDomain = normalizedDomain.split('/')[0] // Remove path if present

    // Exact match or subdomain match
    return emailDomain === normalizedDomain || emailDomain.endsWith(`.${normalizedDomain}`)
  } catch (error) {
    console.error('Email domain verification error:', error)
    return false
  }
}

/**
 * Get the current verification status for a brand
 * Aggregates all verification records to determine overall status
 */
export async function getBrandVerificationStatus(
  brandId: string
): Promise<VerificationState> {
  try {
    const verifications = await prisma.brandVerification.findMany({
      where: { brandId },
    })

    if (verifications.length === 0) {
      return {
        status: 'PENDING',
        emailVerified: false,
        domainVerified: false,
      }
    }

    // Check if any verification was rejected
    const rejectedVerification = verifications.find(
      (v) => v.status === 'FAILED'
    )
    if (rejectedVerification) {
      return {
        status: 'REJECTED',
        emailVerified: false,
        domainVerified: false,
        rejectedReason: 'Domain ownership could not be verified',
      }
    }

    // Check verification progress
    const emailVerified = verifications.some(
      (v) => v.method === 'EMAIL_DOMAIN' && v.status === 'VERIFIED'
    )
    const domainVerified = verifications.some(
      (v) => v.method === 'DNS_TXT' && v.status === 'VERIFIED'
    )

    let status: VerificationStatus = 'PENDING'
    if (emailVerified && domainVerified) {
      status = 'FULLY_VERIFIED'
    } else if (emailVerified && !domainVerified) {
      status = 'EMAIL_VERIFIED'
    } else if (domainVerified) {
      status = 'DOMAIN_VERIFIED'
    }

    const completedVerification = verifications.find(
      (v) => v.status === 'VERIFIED' && v.verifiedAt
    )

    return {
      status,
      emailVerified,
      domainVerified,
      completedAt: completedVerification?.verifiedAt || undefined,
    }
  } catch (error) {
    console.error('Get brand verification status error:', error)
    return {
      status: 'PENDING',
      emailVerified: false,
      domainVerified: false,
    }
  }
}

/**
 * Create a brand verification record
 */
export async function createBrandVerification(
  brandId: string,
  method: 'EMAIL_DOMAIN' | 'DNS_TXT',
  token: string,
  code?: string
) {
  return prisma.brandVerification.create({
    data: {
      brandId,
      method,
      status: 'PENDING',
      token,
      code,
    },
  })
}

/**
 * Mark a verification as complete
 */
export async function completeBrandVerification(token: string) {
  return prisma.brandVerification.updateMany({
    where: { token },
    data: {
      status: 'VERIFIED',
      verifiedAt: new Date(),
    },
  })
}

/**
 * Mark a verification as failed
 */
export async function failBrandVerification(token: string) {
  return prisma.brandVerification.updateMany({
    where: { token },
    data: {
      status: 'FAILED',
    },
  })
}
