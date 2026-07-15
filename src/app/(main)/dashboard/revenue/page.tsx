'use client'

import React from 'react'
import { DashboardLayout } from '@/components/shared/dashboard-layout'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface EarningRecord {
  campaign: string
  totalSales: string
  creatorShare: string
  status: 'Paid' | 'Pending'
}

interface PayoutRecord {
  date: string
  month: string
  year: number
  amount: string
  status: 'Paid' | 'Pending'
}

const earningsData: EarningRecord[] = [
  {
    campaign: "Nike Women's Running Shoes Extended Sizes",
    totalSales: '£14,250.00',
    creatorShare: '£142.50',
    status: 'Paid',
  },
  {
    campaign: 'Portable Air Purifier with HEPA Filter',
    totalSales: '£1,250.00',
    creatorShare: '£12.50',
    status: 'Paid',
  },
]

const payoutHistory: PayoutRecord[] = [
  {
    date: '15 Feb 2026',
    month: 'February',
    year: 2026,
    amount: '£45.20',
    status: 'Paid',
  },
  {
    date: '15 Jan 2026',
    month: 'January',
    year: 2026,
    amount: '£97.30',
    status: 'Paid',
  },
  {
    date: '15 Dec 2025',
    month: 'December',
    year: 2025,
    amount: '£32.10',
    status: 'Paid',
  },
]

export default function RevenueDashboard() {
  return (
    <DashboardLayout role="creator">
      <PageHeader title="Revenue Dashboard" />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-card">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Earnings</h3>
          <p className="text-3xl font-display font-bold text-foreground">£142.50</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-card">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Pending</h3>
          <p className="text-3xl font-display font-bold text-foreground">£23.00</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-card">
          <h3 className="text-sm font-medium text-gray-600 mb-2">This Month</h3>
          <p className="text-3xl font-display font-bold text-foreground">£45.20</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-card">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Campaigns Earning</h3>
          <p className="text-3xl font-display font-bold text-foreground">1</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Earnings Breakdown Table */}
        <div className="lg:col-span-2">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="font-display">Earnings Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                        Campaign
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">
                        Total Sales
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">
                        Your 1% Share
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {earningsData.map((record, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="py-3 px-4 text-sm text-foreground font-medium">
                          {record.campaign}
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-gray-600">
                          {record.totalSales}
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-semibold text-foreground">
                          {record.creatorShare}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Badge
                            variant={record.status === 'Paid' ? 'success' : 'warning'}
                            size="sm"
                          >
                            {record.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hero Pool Earnings */}
        <div>
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="font-display text-base">Hero Pool Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-lime-50 border border-lime-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">
                  You've also earned
                  <span className="font-display font-bold text-lime-700 block text-2xl mt-1">
                    £12.40
                  </span>
                </p>
                <p className="text-xs text-gray-600 mt-3">
                  from the 1% hero contributor pool across{' '}
                  <span className="font-semibold">2 campaigns</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payout History */}
      <Card className="bg-white border-gray-200 mb-6">
        <CardHeader>
          <CardTitle className="font-display">Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payoutHistory.map((payout, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {payout.month} {payout.year}
                  </p>
                  <p className="text-sm text-gray-600">{payout.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-display font-bold text-lg text-foreground">
                    {payout.amount}
                  </p>
                  <Badge variant={payout.status === 'Paid' ? 'success' : 'warning'} size="sm">
                    {payout.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Model Explanation */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="font-display">How Revenue Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              When a campaign gets funded and reaches milestones, the sales revenue is split among
              platform operations, creator rewards, and hero contributors.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  label: 'Platform Fee',
                  amount: '3%',
                  description: 'Covers operations & infrastructure',
                },
                {
                  label: 'Creator Share',
                  amount: '1%',
                  description: 'Your reward for lobbying',
                },
                {
                  label: 'Hero Pool',
                  amount: '1%',
                  description: 'Distributed to top contributors',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <p className="text-xs text-gray-600 uppercase font-semibold mb-1">
                    {item.label}
                  </p>
                  <p className="font-display font-bold text-2xl text-violet-600 mb-2">
                    {item.amount}
                  </p>
                  <p className="text-xs text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Note:</span> Revenue is paid out once campaigns
                reach funding milestones. The remaining 95% goes to the brand and community
                fund.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
