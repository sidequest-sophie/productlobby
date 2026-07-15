'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Spinner,
} from '@/components/ui'
import { Users, AlertCircle, TrendingUp, Flag } from 'lucide-react'

interface StatsData {
  totalUsers: number
  totalCampaigns: number
  totalLobbies: number
  totalPledges: number
  pendingReports: number
  activeUsers: number
  campaignsByStatus: Array<{ status: string; count: number }>
  topCampaigns: Array<{
    id: string
    title: string
    slug: string
    signalScore: number
    status: string
    _count: { lobbies: number; pledges: number }
  }>
}

interface Report {
  id: string
  reason: string
  details: string | null
  status: string
  targetType: string
  targetId: string
  createdAt: string
  reporter: {
    id: string
    displayName: string
    email: string
    avatar: string | null
  }
}

interface User {
  id: string
  email: string
  displayName: string
  handle: string | null
  avatar: string | null
  emailVerified: boolean
  phoneVerified: boolean
  contributionScore: number
  createdAt: string
  campaignCount: number
  lobbyCount: number
  reportCount: number
}

interface Campaign {
  id: string
  title: string
  slug: string
  status: string
  category: string
  signalScore: number
  createdAt: string
  creator: {
    id: string
    displayName: string
    email: string
  }
  _count: { lobbies: number; pledges: number }
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [reportStatus, setReportStatus] = useState('OPEN')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports()
    } else if (activeTab === 'users') {
      fetchUsers()
    } else if (activeTab === 'campaigns') {
      fetchCampaigns()
    }
  }, [activeTab, reportStatus, searchQuery, page])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (res.status === 401 || res.status === 403) {
        router.push('/login')
        return
      }
      const data = await res.json()
      setStats(data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      setLoading(false)
    }
  }

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams({
        status: reportStatus,
        page: page.toString(),
        limit: '20',
      })
      const res = await fetch(`/api/admin/reports?${params}`)
      if (res.ok) {
        const data = await res.json()
        setReports(data.items)
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        page: page.toString(),
        limit: '20',
      })
      const res = await fetch(`/api/admin/users?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.items)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const fetchCampaigns = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      const res = await fetch(`/api/admin/campaigns?${params}`)
      if (res.ok) {
        const data = await res.json()
        setCampaigns(data.items)
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
    }
  }

  const handleReportAction = async (reportId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        fetchReports()
      }
    } catch (error) {
      console.error('Failed to update report:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-red-100 text-red-800'
      case 'INVESTIGATING':
        return 'bg-yellow-100 text-yellow-800'
      case 'RESOLVED':
        return 'bg-green-100 text-green-800'
      case 'DISMISSED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage reports, users, and campaigns
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalUsers}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.activeUsers} active (last 7 days)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalCampaigns}
                </div>
                <div className="flex gap-2 mt-2">
                  {stats.campaignsByStatus.map((item) => (
                    <Badge key={item.status} variant="default">
                      {item.status}: {item.count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Lobbies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalLobbies}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalPledges} pledges
                </p>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600">
                  Pending Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">
                  {stats.pendingReports}
                </div>
                <p className="text-xs text-red-600 mt-1">Require review</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Campaigns by Signal Score</CardTitle>
                  <CardDescription>
                    Highest momentum campaigns on the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.topCampaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {campaign.title}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="default">
                              {campaign.status}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {campaign._count.lobbies} lobbies,{' '}
                              {campaign._count.pledges} pledges
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-violet-600">
                            {campaign.signalScore
                              ? campaign.signalScore.toFixed(1)
                              : 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Signal Score
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <div className="flex gap-2 mb-4">
              {['OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'].map(
                (status) => (
                  <Button
                    key={status}
                    variant={reportStatus === status ? 'primary' : 'outline'}
                    onClick={() => {
                      setReportStatus(status)
                      setPage(1)
                    }}
                  >
                    {status}
                  </Button>
                )
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Reports</CardTitle>
                <CardDescription>
                  Manage user reports and violations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <div className="text-center py-8">
                    <Flag className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500">No reports found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-start justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              className={getStatusColor(report.status)}
                              variant="default"
                            >
                              {report.status}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {report.targetType}
                            </span>
                          </div>
                          <p className="font-medium text-gray-900">
                            {report.reason}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {report.details}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Reported by {report.reporter.displayName} on{' '}
                            {new Date(report.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {report.status === 'OPEN' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleReportAction(
                                    report.id,
                                    'INVESTIGATING'
                                  )
                                }
                              >
                                Investigate
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleReportAction(report.id, 'DISMISSED')
                                }
                              >
                                Dismiss
                              </Button>
                            </>
                          )}
                          {report.status === 'INVESTIGATING' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleReportAction(report.id, 'RESOLVED')
                                }
                              >
                                Resolve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleReportAction(report.id, 'DISMISSED')
                                }
                              >
                                Dismiss
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search users by email, name, or handle..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>Manage platform users</CardDescription>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500">No users found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">
                            User
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">
                            Email
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">
                            Status
                          </th>
                          <th className="text-center py-3 px-4 font-medium text-gray-700">
                            Campaigns
                          </th>
                          <th className="text-center py-3 px-4 font-medium text-gray-700">
                            Lobbies
                          </th>
                          <th className="text-center py-3 px-4 font-medium text-gray-700">
                            Reports
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{user.displayName}</td>
                            <td className="py-3 px-4 text-gray-600">
                              {user.email}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-1">
                                {user.emailVerified && (
                                  <Badge variant="default">
                                    Email Verified
                                  </Badge>
                                )}
                                {user.phoneVerified && (
                                  <Badge variant="default">
                                    Phone Verified
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {user.campaignCount}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {user.lobbyCount}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {user.reportCount > 0 && (
                                <Badge variant="error">
                                  {user.reportCount}
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Campaigns</CardTitle>
                <CardDescription>
                  All campaigns sorted by signal score
                </CardDescription>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500">No campaigns found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium text-gray-900">
                              {campaign.title}
                            </p>
                            <Badge variant="default">
                              {campaign.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Category: {campaign.category}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            By {campaign.creator.displayName} •{' '}
                            {campaign._count.lobbies} lobbies •{' '}
                            {campaign._count.pledges} pledges
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-violet-600">
                            {campaign.signalScore
                              ? campaign.signalScore.toFixed(1)
                              : 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Signal Score
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
