import { z } from 'zod'

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

export const MagicLinkSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  // Where to send the user after they verify. Validated as a same-origin
  // relative path at the point of use, not here, so that a bad value falls
  // back to the default instead of failing the whole sign-in request.
  redirect: z.string().optional(),
})

export const PhoneVerificationSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Please enter a valid phone number in E.164 format'),
})

export const PhoneCodeSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
})

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(100),
  handle: z.string().regex(/^[a-z0-9_]{3,30}$/, 'Handle must be 3-30 characters, lowercase letters, numbers, and underscores only').optional().nullable(),
})

// ============================================================================
// CAMPAIGN SCHEMAS
// ============================================================================

export const CampaignTemplateEnum = z.enum(['VARIANT', 'FEATURE'])

export const CreateCampaignSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(200),
  description: z.string().min(50, 'Description must be at least 50 characters').max(5000),
  category: z.enum([
    'apparel',
    'tech',
    'audio',
    'wearables',
    'home',
    'sports',
    'automotive',
    'food_drink',
    'beauty',
    'gaming',
    'pets',
    'other',
  ]),
  template: CampaignTemplateEnum.optional(),
  targetedBrandId: z.string().uuid().optional().nullable(),
  targetBrand: z.string().max(200).optional(),
  openToAlternatives: z.boolean().default(false),
  currency: z.string().length(3).default('GBP'),
  mediaUrls: z.array(z.string().url()).max(10).optional(),
  // New fields for 6-step wizard
  pitchSummary: z.string().max(300).optional(),
  problemSolved: z.string().max(1000).optional(),
  inspiration: z.string().max(2000).optional(),
  originStory: z.string().max(3000).optional(),
  priceRangeMin: z.coerce.number().min(0).optional(),
  priceRangeMax: z.coerce.number().min(0).optional(),
  suggestedPrice: z.coerce.number().min(0).optional(),
  milestones: z.any().optional(),
  videoUrl: z.string().url().optional().or(z.literal('')),
  // Only LIVE may be requested at creation ("Launch Campaign" in the wizard);
  // any other value is ignored and the campaign is created as a draft.
  status: z.enum(['LIVE', 'DRAFT']).optional(),
})

export const UpdateCampaignSchema = CreateCampaignSchema.partial()

export const CampaignQuerySchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  brandId: z.string().uuid().optional(),
  status: z.enum(['LIVE', 'PAUSED', 'CLOSED', 'all']).optional(),
  sort: z.enum(['newest', 'trending', 'signal', 'oldest']).default('trending'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// ============================================================================
// PLEDGE SCHEMAS
// ============================================================================

export const PledgeTypeEnum = z.enum(['SUPPORT', 'INTENT'])

export const CreatePledgeSchema = z.object({
  pledgeType: PledgeTypeEnum,
  priceCeiling: z.coerce.number().positive().optional(),
  timeframeDays: z.coerce.number().int().refine(
    (val) => [30, 90, 180].includes(val),
    'Timeframe must be 30, 90, or 180 days'
  ).optional(),
  region: z.string().max(50).optional(),
  options: z.record(z.string(), z.string()).optional(),
  isPrivate: z.boolean().default(false),
}).refine(
  (data) => {
    if (data.pledgeType === 'INTENT') {
      return data.priceCeiling !== undefined && data.timeframeDays !== undefined
    }
    return true
  },
  {
    message: 'Intent pledges require price ceiling and timeframe',
    path: ['pledgeType'],
  }
)

export const UpdatePledgeSchema = z.object({
  priceCeiling: z.coerce.number().positive().optional(),
  timeframeDays: z.coerce.number().int().refine(
    (val) => [30, 90, 180].includes(val),
    'Timeframe must be 30, 90, or 180 days'
  ).optional(),
  region: z.string().max(50).optional(),
  options: z.record(z.string(), z.string()).optional(),
  isPrivate: z.boolean().optional(),
})

// ============================================================================
// BRAND SCHEMAS
// ============================================================================

export const CreateBrandSchema = z.object({
  name: z.string().min(2, 'Brand name must be at least 2 characters').max(200),
  website: z.string().url().optional().nullable(),
})

export const BrandClaimSchema = z.object({
  method: z.enum(['EMAIL_DOMAIN', 'DNS_TXT']),
  email: z.string().email().optional(), // Required for EMAIL_DOMAIN method
})

export const AddTeamMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER']),
})

// ============================================================================
// BRAND RESPONSE SCHEMAS
// ============================================================================

export const CreateBrandResponseSchema = z.object({
  content: z.string().min(10, 'Response must be at least 10 characters').max(2000),
})

// ============================================================================
// POLL SCHEMAS
// ============================================================================

export const CreatePollSchema = z.object({
  question: z.string().min(10, 'Question must be at least 10 characters').max(500),
  options: z.array(z.string().min(1).max(200)).min(2).max(10),
})

export const VotePollSchema = z.object({
  optionId: z.string().uuid(),
})

// ============================================================================
// OFFER SCHEMAS
// ============================================================================

export const CreateOfferSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().max(2000).optional(),
  price: z.coerce.number().positive('Price must be positive'),
  goalQuantity: z.coerce.number().int().positive('Goal must be at least 1'),
  deadline: z.coerce.date().refine(
    (date) => date > new Date(),
    'Deadline must be in the future'
  ),
  shippingRequired: z.boolean().default(true),
})

// ============================================================================
// ORDER SCHEMAS
// ============================================================================

export const CheckoutSchema = z.object({
  shippingName: z.string().min(2).max(200).optional(),
  shippingLine1: z.string().min(5).max(200).optional(),
  shippingLine2: z.string().max(200).optional(),
  shippingCity: z.string().min(2).max(100).optional(),
  shippingPostcode: z.string().min(2).max(20).optional(),
  shippingCountry: z.string().length(2).optional(), // ISO country code
})

// ============================================================================
// REPORT SCHEMAS
// ============================================================================

export const CreateReportSchema = z.object({
  targetType: z.enum(['CAMPAIGN', 'OFFER', 'BRAND_RESPONSE', 'BRAND', 'USER']),
  targetId: z.string().uuid(),
  reason: z.enum([
    'spam',
    'harassment',
    'hate_speech',
    'inappropriate',
    'fraud',
    'ip_violation',
    'other',
  ]),
  details: z.string().max(1000).optional(),
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type MagicLinkInput = z.infer<typeof MagicLinkSchema>
export type PhoneVerificationInput = z.infer<typeof PhoneVerificationSchema>
export type PhoneCodeInput = z.infer<typeof PhoneCodeSchema>
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>
export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>
export type UpdateCampaignInput = z.infer<typeof UpdateCampaignSchema>
export type CampaignQuery = z.infer<typeof CampaignQuerySchema>
export type CreatePledgeInput = z.infer<typeof CreatePledgeSchema>
export type UpdatePledgeInput = z.infer<typeof UpdatePledgeSchema>
export type CreateBrandInput = z.infer<typeof CreateBrandSchema>
export type BrandClaimInput = z.infer<typeof BrandClaimSchema>
export type AddTeamMemberInput = z.infer<typeof AddTeamMemberSchema>
export type CreateBrandResponseInput = z.infer<typeof CreateBrandResponseSchema>
export type CreatePollInput = z.infer<typeof CreatePollSchema>
export type VotePollInput = z.infer<typeof VotePollSchema>
export type CreateOfferInput = z.infer<typeof CreateOfferSchema>
export type CheckoutInput = z.infer<typeof CheckoutSchema>
export type CreateReportInput = z.infer<typeof CreateReportSchema>

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ============================================================================
// CAMPAIGN TYPES
// ============================================================================

export interface CampaignWithStats {
  id: string
  title: string
  description: string
  category: string
  template: 'VARIANT' | 'FEATURE'
  status: 'DRAFT' | 'LIVE' | 'PAUSED' | 'CLOSED'
  currency: string
  createdAt: Date
  updatedAt: Date
  signalScore: number | null
  creator: {
    id: string
    displayName: string
    handle: string | null
  }
  targetedBrand: {
    id: string
    name: string
    slug: string
    logo: string | null
  } | null
  media?: {
    id: string
    kind: 'IMAGE' | 'VIDEO'
    url: string
    order: number
  }[]
  _count: {
    pledges: number
    follows: number
  }
  stats: {
    supportCount: number
    intentCount: number
    estimatedDemand: number
  }
}

// ============================================================================
// OFFER TYPES
// ============================================================================

export interface OfferWithStats {
  id: string
  title: string
  description: string | null
  price: number
  currency: string
  goalQuantity: number
  deadline: Date
  status: 'DRAFT' | 'ACTIVE' | 'SUCCESSFUL' | 'FAILED' | 'CANCELLED'
  createdAt: Date
  brand: {
    id: string
    name: string
    slug: string
    logo: string | null
  }
  campaign: {
    id: string
    title: string
  }
  _count: {
    orders: number
  }
  progress: number // orders / goalQuantity as percentage
}
