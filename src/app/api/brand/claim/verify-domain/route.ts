/**
 * Domain Verification API
 * POST /api/brand/claim/verify-domain
 *
 * Verifies domain ownership by checking:
 * 1. DNS TXT record with verification token
 * 2. HTML meta tag on website
 *
 * Returns success if either method is found
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { completeBrandVerification } from '@/lib/brand-verification'
import dns from 'dns/promises'

// Query the domain's real DNS TXT records and confirm the expected
// verification value is present. Mirrors src/app/api/brands/[id]/verify/route.ts.
async function checkDNSTxtRecord(domain: string, token: string): Promise<boolean> {
  try {
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
    console.error('DNS lookup error:', error)
    return false
  }
}

// Check for HTML meta tag on the website
async function checkMetaTag(domain: string, token: string): Promise<boolean> {
  try {
    // Normalize domain
    let url = domain
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'ProductLobby-Verifier/1.0',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      return false
    }

    const html = await response.text()
    const metaTagPattern = new RegExp(
      `<meta\\s+name=["']productlobby-verification["']\\s+content=["']${token}["']\\s*/?>`,
      'i'
    )

    return metaTagPattern.test(html)
  } catch (error) {
    console.error('Meta tag verification error:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { token, domain, method } = body

    if (!token || !domain || !method) {
      return NextResponse.json(
        { success: false, error: 'Token, domain, and method are required' },
        { status: 400 }
      )
    }

    if (method !== 'txt' && method !== 'meta') {
      return NextResponse.json(
        { success: false, error: 'Method must be "txt" or "meta"' },
        { status: 400 }
      )
    }

    // Find the verification record
    const verification = await prisma.brandVerification.findFirst({
      where: { token },
    })

    if (!verification) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification token' },
        { status: 400 }
      )
    }

    // Check domain ownership using the specified method
    let verified = false

    if (method === 'txt') {
      verified = await checkDNSTxtRecord(domain, token)
    } else if (method === 'meta') {
      verified = await checkMetaTag(domain, token)
    }

    if (!verified) {
      return NextResponse.json(
        {
          success: false,
          error: `Could not verify domain using ${method === 'txt' ? 'DNS TXT record' : 'meta tag'} method. Please ensure the record is correctly configured and try again in a few moments.`,
        },
        { status: 400 }
      )
    }

    // Create DNS_TXT verification record for domain verification
    await prisma.brandVerification.create({
      data: {
        brandId: verification.brandId,
        method: 'DNS_TXT',
        status: 'VERIFIED',
        token: `${token}-domain`,
        verifiedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        message: 'Domain verified successfully',
        method,
      },
    })
  } catch (error) {
    console.error('Domain verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify domain' },
      { status: 500 }
    )
  }
}
