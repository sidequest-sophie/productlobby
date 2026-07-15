/**
 * Brand Campaigns API Tests
 * Verifies the GET /api/brand/campaigns endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { GET } from '@/app/api/brand/campaigns/route'
import { prisma } from '@/lib/db'

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}))

import { getCurrentUser } from '@/lib/auth'

// ============================================================================
// TEST SETUP
// ============================================================================

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>
const mockPrisma = prisma as unknown as {
  brandTeam: { findMany: jest.Mock }
  campaign: { findMany: jest.Mock }
  lobby: { findMany: jest.Mock }
  pledge: { findMany: jest.Mock }
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ============================================================================
// MOCK DATA
// ============================================================================

const mockUser = {
  id: 'user-123',
  email: 'user@example.com',
  displayName: 'Test User',
  handle: 'testuser',
  avatar: null,
  emailVerified: true,
}

const mockBrandMemberships = [
  { brandId: 'brand-1' },
  { brandId: 'brand-2' },
]

const mockCampaigns = [
  {
    id: 'campaign-1',
    title: 'AI Product',
    slug: 'ai-product',
    category: 'AI',
    status: 'LIVE',
    path: '/ai-product',
    currency: 'GBP',
    signalScore: 75,
    createdAt: new Date('2026-02-20'),
    targetedBrand: {
      id: 'brand-1',
      name: 'Acme Corp',
    },
  },
  {
    id: 'campaign-2',
    title: 'Productivity Tool',
    slug: 'productivity-tool',
    category: 'Productivity',
    status: 'LIVE',
    path: '/productivity-tool',
    currency: 'GBP',
    signalScore: 45,
    createdAt: new Date('2026-02-21'),
    targetedBrand: {
      id: 'brand-2',
      name: 'Tech Inc',
    },
  },
]

const mockLobbies = [
  {
    intensity: 'TAKE_MY_MONEY',
    status: 'VERIFIED',
    createdAt: new Date('2026-02-20'),
  },
  {
    intensity: 'PROBABLY_BUY',
    status: 'VERIFIED',
    createdAt: new Date('2026-02-21'),
  },
  {
    intensity: 'NEAT_IDEA',
    status: 'PENDING',
    createdAt: new Date('2026-02-22'),
  },
]

const mockPledges = [
  {
    pledgeType: 'SUPPORT',
    priceCeiling: 50.0,
    createdAt: new Date('2026-02-20'),
  },
  {
    pledgeType: 'INTENT',
    priceCeiling: 100.0,
    createdAt: new Date('2026-02-21'),
  },
  {
    pledgeType: 'INTENT',
    priceCeiling: 150.0,
    createdAt: new Date('2026-02-22'),
  },
]

// ============================================================================
// AUTHENTICATION TESTS
// ============================================================================

describe('GET /api/brand/campaigns - Authentication', () => {
  it('should return 401 when user is not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost:3000/api/brand/campaigns')
    const response = await GET(request)

    expect(response.status).toBe(401)
    expect(response.headers.get('content-type')).toContain('application/json')

    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.error).toContain('Unauthorized')
  })

  it('should call getCurrentUser', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser)
    mockPrisma.brandTeam.findMany.mockResolvedValueOnce([])

    const request = new NextRequest('http://localhost:3000/api/brand/campaigns')
    await GET(request)

    expect(mockGetCurrentUser).toHaveBeenCalled()
  })
})

// ============================================================================
// NO BRAND ACCESS TESTS
// ============================================================================

describe('GET /api/brand/campaigns - No Brand Access', () => {
  it('should return empty array when user has no brand memberships', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser)
    mockPrisma.brandTeam.findMany.mockResolvedValueOnce([])

    const request = new NextRequest('http://localhost:3000/api/brand/campaigns')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const json = await response.json()

    expect(json.success).toBe(true)
    expect(json.data).toEqual([])
    expect(json.count).toBe(0)
  })

  it('should not query campaigns when user has no brands', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser)
    mockPrisma.brandTeam.findMany.mockResolvedValueOnce([])

    const request = new NextRequest('http://localhost:3000/api/brand/campaigns')
    await GET(request)

    expect(mockPrisma.campaign.findMany).not.toHaveBeenCalled()
  })
})

// ============================================================================
// SUCCESSFUL REQUEST TESTS
// ============================================================================

describe('GET /api/brand/campaigns - Successful Request', () => {
  it('should return campaigns for brands user has access to', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser)
    mockPrisma.brandTeam.findMany.mockResolvedValueOnce(mockBrandMemberships)
    mockPrisma.campaign.findMany.mockResolvedValueOnce(mockCampaigns)

    // Mock lobby and pledge queries
    mockPrisma.lobby.findMany
      .mockResolvedValueOnce(mockLobbies)
      .mockResolvedValueOnce(mockLobbies)
    mockPrisma.pledge.findMany
      .mockResolvedValueOnce(mockPledges)
      .mockResolvedValueOnce(mockPledges)

    const request = new NextRequest('http://localhost:3000/api/brand/campaigns')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const json = await response.json()

    expect(json.success).toBe(true)
    expect(json.count).toBe(2)
    expect(json.data.length).toBe(2)
  })

  it('should include required campaign fields in response', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser)
    mockPrisma.brandTeam.findMany.mockResolvedValueOnce(mockBrandMemberships)
    mockPrisma.campaign.findMany.mockResolvedValueOnce([mockCampaigns[0]])

    mockPrisma.lobby.findMany.mockResolvedValueOnce(mockLobbies)
    mockPrisma.pledge.findMany.mockResolvedValueOnce(mockPledges)

    const request = new NextRequest('http://localhost:3000/api/brand/campaigns')
    const response = await GET(request)

    const json = await response.json()
    const campaign = json.data[0]

    expect(campaign).toHaveProperty('id')
    expect(campaign).toHaveProperty('title')
    expect(campaign).toHaveProperty('slug')
    expect(campaign).toHaveProperty('category')
    expect(campaign).toHaveProperty('status')
    expect(campaign).toHaveProperty('signalScore')
    expect(campaign).toHaveProperty('lobbyCount')
    expect(campaign).toHaveProperty('supportPledges')
    expect(campaign).toHaveProperty('intentPledges')
    expect(campaign).toHaveProperty('estimatedRevenue')
  })

  it('should never expose individual user data', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser)
    mockPrisma.brandTeam.findMany.mockResolvedValueOnce(mockBrandMemberships)
    mockPrisma.campaign.findMany.mockResolvedValueOnce(mockCampaigns)

    mockPrisma.lobby.findMany.mockResolvedValueOnce(mockLobbies)
    mockPrisma.pledge.findMany.mockResolvedValueOnce(mockPledges)

    const request = new NextRequest('http://localhost:3000/api/brand/campaigns')
    const response = await GET(request)

    const json = await response.json()
    const responseText = JSON.stringify(json)

    // Should not contain user IDs or email addresses
    expect(responseText).not.toContain('userId')
    expect(responseText).not.toContain('@')
  })
})

// ============================================================================
// PRIVACY HEADERS TESTS
// ============================================================================

describe('GET /api/brand/campaigns - Privacy Headers', () => {
  it('should set X-Privacy-Level header to aggregated', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser)
    mockPrisma.brandTeam.findMany.mockResolvedValueOnce(mockBrandMemberships)
    mockPrisma.campaign.findMany.mockResolvedValueOnce(mockCampaigns)

    mockPrisma.lobby.findMany
      .mockResolvedValueOnce(mockLobbies)
      .mockResolvedValueOnce(mockLobbies)
    mockPrisma.pledge.findMany
      .mockResolvedValueOnce(mockPledges)
      .mockResolvedValueOnce(mockPledges)

    const request = new NextRequest('http://localhost:3000/api/brand/campaigns')
    const response = await GET(request)

    expect(response.headers.get('X-Privacy-Level')).toBe('aggregated')
  })

  it('should set Cache-Control header', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser)
    mockPrisma.brandTeam.findMany.mockResolvedValueOnce(mockBrandMemberships)
    mockPrisma.campaign.findMany.mockResolvedValueOnce(mockCampaigns)

    mockPrisma.lobby.findMany
      .mockResolvedValueOnce(mockLobbies)
      .mockResolvedValueOnce(mockLobbies)
    mockPrisma.pledge.findMany
      .mockResolvedValueOnce(mockPledges)
      .mockResolvedValueOnce(mockPledges)

    const request = new NextRequest('http://localhost:3000/api/brand/campaigns')
    const response = await GET(request)

    const cacheControl = response.headers.get('Cache-Control')
    expect(cacheControl).toContain('private')
    expect(cacheControl).toContain('max-age')
  })
})

// ============================================================================
// DATA AGGREGATION TESTS
// ============================================================================

describe('GET /api/brand/campaigns - Data Aggregation', () => {
  it('should calculate lobby counts correctly', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser)
    mockPrisma.brandTeam.findMany.mockResolvedValueOnce(mockBrandMemberships)
    mockPrisma.campaign.findMany.mockResolvedValueOnce([mockCampaigns[0]])

    mockPrisma.lobby.findMany.mockResolvedValueOnce(mockLobbies)
    mockPrisma.pledge.findMany.mockResolvedValueOnce(mockPledges)

    const request = new NextRequest('http://localhost:3000/api/brand/campaigns')
    const response = await GET(request)

    const json = await response.json()
    const campaign = json.data[0]

    expect(campaign.lobbyCount).toBe(3)
  })

  it('should calculate pledge counts correctly', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser)
    mockPrisma.brandTeam.findMany.mockResolvedValueOnce(mockBrandMemberships)
    mockPrisma.campaign.findMany.mockResolvedValueOnce([mockCampaigns[0]])

    mockPrisma.lobby.findMany.mockResolvedValueOnce(mockLobbies)
    mockPrisma.pledge.findMany.mockResolvedValueOnce(mockPledges)

    const request = new NextRequest('http://localhost:3000/api/brand/campaigns')
    const response = await GET(request)

    const json = await response.json()
    const campaign = json.data[0]

    expect(campaign.supportPledges).toBe(1)
    expect(campaign.intentPledges).toBe(2)
  })

  it('should calculate estimated revenue correctly', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser)
    mockPrisma.brandTeam.findMany.mockResolvedValueOnce(mockBrandMemberships)
    mockPrisma.campaign.findMany.mockResolvedValueOnce([mockCampaigns[0]])

    mockPrisma.lobby.findMany.mockResolvedValueOnce(mockLobbies)
    mockPrisma.pledge.findMany.mockResolvedValueOnce(mockPledges)

    const request = new NextRequest('http://localhost:3000/api/brand/campaigns')
    const response = await GET(request)

    const json = await response.json()
    const campaign = json.data[0]

    // 2 intent pledges with avg price (100+150)/2 = 125
    // Revenue = 2 * 125 = 250
    expect(campaign.estimatedRevenue).toBe(250)
  })
})

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe('GET /api/brand/campaigns - Error Handling', () => {
  it('should return 500 when database query fails', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser)
    mockPrisma.brandTeam.findMany.mockRejectedValueOnce(
      new Error('Database error')
    )

    const request = new NextRequest('http://localhost:3000/api/brand/campaigns')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.error).toBeDefined()
  })

  it('should return 500 when lobby query fails', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser)
    mockPrisma.brandTeam.findMany.mockResolvedValueOnce(mockBrandMemberships)
    mockPrisma.campaign.findMany.mockResolvedValueOnce([mockCampaigns[0]])

    mockPrisma.lobby.findMany.mockRejectedValueOnce(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/brand/campaigns')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.success).toBe(false)
  })

  it('should return 500 when pledge query fails', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser)
    mockPrisma.brandTeam.findMany.mockResolvedValueOnce(mockBrandMemberships)
    mockPrisma.campaign.findMany.mockResolvedValueOnce([mockCampaigns[0]])

    mockPrisma.lobby.findMany.mockResolvedValueOnce(mockLobbies)
    mockPrisma.pledge.findMany.mockRejectedValueOnce(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/brand/campaigns')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.success).toBe(false)
  })
})

// ============================================================================
// RESPONSE FORMAT TESTS
// ============================================================================

describe('GET /api/brand/campaigns - Response Format', () => {
  it('should return valid JSON', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser)
    mockPrisma.brandTeam.findMany.mockResolvedValueOnce(mockBrandMemberships)
    mockPrisma.campaign.findMany.mockResolvedValueOnce([mockCampaigns[0]])

    mockPrisma.lobby.findMany.mockResolvedValueOnce(mockLobbies)
    mockPrisma.pledge.findMany.mockResolvedValueOnce(mockPledges)

    const request = new NextRequest('http://localhost:3000/api/brand/campaigns')
    const response = await GET(request)

    expect(response.headers.get('content-type')).toContain('application/json')
    expect(() => response.json()).not.toThrow()
  })

  it('should have consistent response structure', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser)
    mockPrisma.brandTeam.findMany.mockResolvedValueOnce(mockBrandMemberships)
    mockPrisma.campaign.findMany.mockResolvedValueOnce([mockCampaigns[0]])

    mockPrisma.lobby.findMany.mockResolvedValueOnce(mockLobbies)
    mockPrisma.pledge.findMany.mockResolvedValueOnce(mockPledges)

    const request = new NextRequest('http://localhost:3000/api/brand/campaigns')
    const response = await GET(request)

    const json = await response.json()

    expect(json).toHaveProperty('success')
    expect(json).toHaveProperty('data')
    expect(json).toHaveProperty('count')
    expect(Array.isArray(json.data)).toBe(true)
  })
})

// ============================================================================
// QUERY ORDERING TESTS
// ============================================================================

describe('GET /api/brand/campaigns - Query Ordering', () => {
  it('should fetch brand memberships for authenticated user', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser)
    mockPrisma.brandTeam.findMany.mockResolvedValueOnce(mockBrandMemberships)

    const request = new NextRequest('http://localhost:3000/api/brand/campaigns')
    await GET(request)

    expect(mockPrisma.brandTeam.findMany).toHaveBeenCalledWith({
      where: { userId: mockUser.id },
      select: { brandId: true },
    })
  })

  it('should fetch campaigns for all brand IDs', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser)
    mockPrisma.brandTeam.findMany.mockResolvedValueOnce(mockBrandMemberships)
    mockPrisma.campaign.findMany.mockResolvedValueOnce([mockCampaigns[0]])

    mockPrisma.lobby.findMany.mockResolvedValueOnce(mockLobbies)
    mockPrisma.pledge.findMany.mockResolvedValueOnce(mockPledges)

    const request = new NextRequest('http://localhost:3000/api/brand/campaigns')
    await GET(request)

    expect(mockPrisma.campaign.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          targetedBrandId: { in: ['brand-1', 'brand-2'] },
        }),
      })
    )
  })
})
