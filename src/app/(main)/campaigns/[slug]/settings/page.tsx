'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import nextDynamic from 'next/dynamic'
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

// Feature tabs are creator-only and below the fold — lazy-load their chunks
// so the settings shell stays light.
const CustomFields = nextDynamic(
  () =>
    import('@/components/campaigns/custom-fields').then((m) => m.CustomFields),
  { ssr: false, loading: () => <Spinner /> }
)
const PreferenceInsights = nextDynamic(
  () =>
    import('@/components/campaigns/preference-insights').then(
      (m) => m.PreferenceInsights
    ),
  { ssr: false, loading: () => <Spinner /> }
)
const SurveySettings = nextDynamic(
  () =>
    import('@/components/campaigns/survey-settings').then(
      (m) => m.SurveySettings
    ),
  { ssr: false, loading: () => <Spinner /> }
)
const EmailOutreach = nextDynamic(
  () =>
    import('@/components/campaigns/email-outreach').then(
      (m) => m.EmailOutreach
    ),
  { ssr: false, loading: () => <Spinner /> }
)

interface CampaignData {
  id: string
  slug: string
  title: string
  description: string
  category: string
  status: 'DRAFT' | 'LIVE' | 'PAUSED' | 'CLOSED'
  creatorUserId: string
  targetedBrand?: { id: string; name: string } | null
}

const CAMPAIGN_STATUSES = [
  { value: 'DRAFT', label: 'Draft', description: 'Not published' },
  { value: 'LIVE', label: 'Live', description: 'Active and visible' },
  { value: 'PAUSED', label: 'Paused', description: 'Temporarily paused' },
  { value: 'CLOSED', label: 'Closed', description: 'Campaign ended' },
]

export default function CampaignSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const { addToast } = useToast()
  const slug = params.slug as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [campaign, setCampaign] = useState<CampaignData | null>(null)
  const [isCreator, setIsCreator] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState<'DRAFT' | 'LIVE' | 'PAUSED' | 'CLOSED'>('DRAFT')

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteMode, setDeleteMode] = useState<'soft' | 'hard'>('soft')

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setLoading(true)
        const [campaignRes, userRes] = await Promise.all([
          fetch(`/api/campaigns/${slug}`),
          fetch('/api/auth/me'),
        ])
        if (!campaignRes.ok) {
          throw new Error('Campaign not found')
        }

        const data = await campaignRes.json()
        const campaign = data.campaign || data

        setCampaign(campaign)
        setTitle(campaign.title || '')
        setDescription(campaign.description || '')
        setCategory(campaign.category || '')
        setStatus(campaign.status || 'DRAFT')

        // Only the campaign creator gets settings access — compare the real
        // session user against Campaign.creatorUserId (never assumed).
        let creator = false
        if (userRes.ok) {
          const { data: userData } = await userRes.json().catch(() => ({ data: null }))
          creator = !!userData?.id && userData.id === campaign.creatorUserId
        }
        setIsCreator(creator)
      } catch (err) {
        console.error('Error loading campaign:', err)
        addToast('Failed to load campaign', 'error')
        // Redirect back if can't load
        setTimeout(() => router.back(), 1000)
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchCampaign()
    }
  }, [slug])

  const handleSave = async () => {
    if (!campaign) return

    // Validate
    if (!title.trim()) {
      addToast('Title is required', 'error')
      return
    }
    if (!description.trim()) {
      addToast('Description is required', 'error')
      return
    }
    if (!category.trim()) {
      addToast('Category is required', 'error')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/campaigns/${campaign.id}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category: category.trim(),
          status,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save campaign')
      }

      const updated = await response.json()
      setCampaign((prev) => (prev ? { ...prev, ...updated } : updated))
      addToast('Campaign settings saved successfully', 'success')

      // If slug changed, redirect
      if (updated.slug && updated.slug !== slug) {
        router.push(`/campaigns/${updated.slug}/settings`)
      }
    } catch (error) {
      console.error('Save error:', error)
      addToast(
        error instanceof Error ? error.message : 'Failed to save campaign',
        'error'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!campaign) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/campaigns/${campaign.id}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permanent: deleteMode === 'hard' }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete campaign')
      }

      addToast(
        deleteMode === 'hard'
          ? 'Campaign permanently deleted'
          : 'Campaign archived',
        'success'
      )
      setShowDeleteConfirm(false)

      // Redirect to campaigns page
      setTimeout(() => router.push('/campaigns'), 500)
    } catch (error) {
      console.error('Delete error:', error)
      addToast(
        error instanceof Error ? error.message : 'Failed to delete campaign',
        'error'
      )
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    )
  }

  if (!campaign || !isCreator) {
    return (
      <div className="mx-auto max-w-2xl py-12">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">
              You don't have permission to access this campaign's settings.
            </p>
            <Link href="/campaigns" className="mt-4 inline-block">
              <Button variant="outline" size="sm">
                Back to Campaigns
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl py-8 px-4">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link href={`/campaigns/${campaign.slug}`}>
          <Button
            variant="ghost"
            size="sm"
            className="w-9 px-0"
            aria-label="Back to campaign"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Campaign Settings</h1>
          <p className="text-gray-600">{campaign.title}</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6 flex w-full flex-nowrap justify-start overflow-x-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="survey">Survey</TabsTrigger>
          <TabsTrigger value="outreach">Brand outreach</TabsTrigger>
        </TabsList>

        {/* Tab: General (existing settings) */}
        <TabsContent value="general">
          {/* Main Settings */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div>
                <label
                  htmlFor="settings-title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Campaign Title *
                </label>
                <Input
                  id="settings-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter campaign title"
                  className="mt-2"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="settings-description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description *
                </label>
                <Textarea
                  id="settings-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter campaign description"
                  rows={5}
                  className="mt-2"
                />
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="settings-category"
                  className="block text-sm font-medium text-gray-700"
                >
                  Category *
                </label>
                <Input
                  id="settings-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Technology, Health, Finance"
                  className="mt-2"
                />
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-violet-600 hover:bg-violet-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Campaign Status */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Campaign Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Choose the status for your campaign to control its visibility and
                acceptance of contributions.
              </p>

              <div className="space-y-3">
                {CAMPAIGN_STATUSES.map((s) => (
                  <label
                    key={s.value}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-all',
                      status === s.value
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    )}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={s.value}
                      checked={status === s.value}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="h-4 w-4"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{s.label}</p>
                      <p className="text-sm text-gray-600">{s.description}</p>
                    </div>
                  </label>
                ))}
              </div>

              <Button
                onClick={handleSave}
                disabled={saving}
                variant="outline"
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Status Change
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-red-800">
                Deleting your campaign is a permanent action. Please be careful.
              </p>

              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                className="w-full"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Campaign
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Preferences — custom fields editor + real aggregates (spec §6) */}
        <TabsContent value="preferences">
          <div className="space-y-6">
            <p className="text-sm text-gray-600">
              Preference fields turn &ldquo;150 people want this&rdquo; into
              &ldquo;150 people want this, 60% in black&rdquo;. Supporters
              answer them as one optional step when they lobby — never
              required, never blocking.
            </p>
            <CustomFields campaignId={campaign.id} />
            <PreferenceInsights campaignId={campaign.id} />
          </div>
        </TabsContent>

        {/* Tab: Survey — create/publish one survey + real results (spec §5) */}
        <TabsContent value="survey">
          <SurveySettings
            campaignId={campaign.id}
            hasTargetedBrand={!!campaign.targetedBrand}
          />
        </TabsContent>

        {/* Tab: Brand outreach — demand-evidence emails (spec §4) */}
        <TabsContent value="outreach">
          <EmailOutreach campaignId={campaign.id} />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-900">Delete Campaign?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-700">
                This action cannot be undone. Choose an option below:
              </p>

              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-gray-200 p-4 hover:border-gray-300">
                  <input
                    type="radio"
                    name="deleteMode"
                    value="soft"
                    checked={deleteMode === 'soft'}
                    onChange={() => setDeleteMode('soft')}
                    className="h-4 w-4"
                  />
                  <div>
                    <p className="font-medium">Archive Campaign</p>
                    <p className="text-sm text-gray-600">
                      Hide campaign but keep data (can be restored)
                    </p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-red-200 bg-red-50 p-4">
                  <input
                    type="radio"
                    name="deleteMode"
                    value="hard"
                    checked={deleteMode === 'hard'}
                    onChange={() => setDeleteMode('hard')}
                    className="h-4 w-4"
                  />
                  <div>
                    <p className="font-medium text-red-900">Permanently Delete</p>
                    <p className="text-sm text-red-700">
                      Remove campaign and all data forever
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Confirm Delete'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
