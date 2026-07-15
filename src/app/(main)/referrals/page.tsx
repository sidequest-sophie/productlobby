import type { Metadata } from 'next';
import { Gift, Users, Award, Share2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Referral Program',
  description: 'Invite friends and earn rewards through our referral program.',
};

const ReferralStats = {
  totalReferrals: 12543,
  activeReferrers: 3421,
  pointsDistributed: 89234,
};

const RewardTiers = [
  {
    milestone: '1-5 Friends',
    points: '100',
    description: 'Invite your first friends',
    color: 'from-violet-500 to-violet-600',
  },
  {
    milestone: '6-15 Friends',
    points: '500',
    description: 'Building your network',
    color: 'from-violet-400 to-violet-500',
  },
  {
    milestone: '16+ Friends',
    points: '1000+',
    description: 'Elite referrer status',
    color: 'from-lime-400 to-violet-500',
  },
];

const TopReferrers = [
  { rank: 1, name: 'User_Alpha', referrals: 487, points: 48700 },
  { rank: 2, name: 'User_Beta', referrals: 342, points: 34200 },
  { rank: 3, name: 'User_Gamma', referrals: 298, points: 29800 },
  { rank: 4, name: 'User_Delta', referrals: 267, points: 26700 },
  { rank: 5, name: 'User_Epsilon', referrals: 245, points: 24500 },
];

export default function ReferralProgramPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 inline-flex rounded-full bg-violet-100 dark:bg-violet-900 p-4">
              <Gift className="h-12 w-12 text-violet-600 dark:text-violet-400" />
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Invite Friends, Earn Rewards
            </h1>
            <p className="mb-8 text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
              Share your unique referral link with friends and earn points for every successful sign-up. Both you and your friends receive rewards!
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white"
            >
              <Share2 className="mr-2 h-5 w-5" />
              Start Referring
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-lg bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Total Referrals
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                    {ReferralStats.totalReferrals.toLocaleString()}
                  </p>
                </div>
                <Users className="h-8 w-8 text-violet-500" />
              </div>
            </div>
            <div className="rounded-lg bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Active Referrers
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                    {ReferralStats.activeReferrers.toLocaleString()}
                  </p>
                </div>
                <Award className="h-8 w-8 text-lime-500" />
              </div>
            </div>
            <div className="rounded-lg bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Points Distributed
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                    {ReferralStats.pointsDistributed.toLocaleString()}
                  </p>
                </div>
                <Trophy className="h-8 w-8 text-violet-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-white dark:bg-slate-800">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-slate-900 dark:text-white">
            How It Works
          </h2>
          <p className="mb-12 text-center text-slate-600 dark:text-slate-400">
            Three simple steps to start earning rewards
          </p>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-600">
                <Share2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">
                Share Your Link
              </h3>
              <p className="text-center text-slate-600 dark:text-slate-400">
                Copy your unique referral link and share it with friends via email, social media, or messaging apps.
              </p>
              <div className="mt-4 text-sm font-semibold text-violet-600 dark:text-violet-400">
                Step 1
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-lime-500">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">
                Friend Signs Up
              </h3>
              <p className="text-center text-slate-600 dark:text-slate-400">
                Your friend creates an account using your referral link and completes their profile setup.
              </p>
              <div className="mt-4 text-sm font-semibold text-violet-600 dark:text-violet-400">
                Step 2
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-lime-500 to-lime-600">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">
                Both Earn Points
              </h3>
              <p className="text-center text-slate-600 dark:text-slate-400">
                You and your friend receive bonus points immediately that can be used for premium features.
              </p>
              <div className="mt-4 text-sm font-semibold text-violet-600 dark:text-violet-400">
                Step 3
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reward Tiers */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-slate-900 dark:text-white">
            Reward Tiers
          </h2>
          <p className="mb-12 text-center text-slate-600 dark:text-slate-400">
            Earn more points as you refer more friends
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {RewardTiers.map((tier) => (
              <div
                key={tier.milestone}
                className={`rounded-lg bg-gradient-to-br ${tier.color} p-6 text-white shadow-lg`}
              >
                <h3 className="mb-2 text-lg font-bold">{tier.milestone}</h3>
                <p className="mb-4 text-sm opacity-90">{tier.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{tier.points}</span>
                  <span className="text-sm opacity-75">points each</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Referral Leaderboard */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-white dark:bg-slate-800">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            <h2 className="text-center text-3xl font-bold text-slate-900 dark:text-white">
              Top Referrers
            </h2>
          </div>
          <p className="mb-12 text-center text-slate-600 dark:text-slate-400">
            Celebrate our most active referrers this month
          </p>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">
                    Name
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">
                    Referrals
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody>
                {TopReferrers.map((referrer) => (
                  <tr
                    key={referrer.rank}
                    className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-lime-500 font-bold text-white">
                          {referrer.rank}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-900 dark:text-white">
                      {referrer.name}
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900 dark:text-white">
                      {referrer.referrals.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-semibold text-violet-600 dark:text-violet-400">
                      {referrer.points.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg bg-gradient-to-r from-violet-600 to-lime-500 p-12 text-center text-white shadow-xl">
            <h2 className="mb-4 text-3xl font-bold">
              Ready to Start Earning?
            </h2>
            <p className="mb-8 text-lg opacity-90">
              Join thousands of users earning rewards by sharing ProductLobby with their network.
            </p>
            <Button
              size="lg"
              className="bg-white text-violet-600 hover:bg-slate-100"
            >
              <Gift className="mr-2 h-5 w-5" />
              Get Your Referral Link
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
