import type { Metadata } from 'next';
import Link from 'next/link';
import { Heart, Link2, Users, Share2, LayoutDashboard, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Referrals',
  description:
    'How referrals work on ProductLobby: lobby a campaign, share your personal link, and see the supporters you bring counted on your dashboard.',
};

// Only show platform-wide numbers when they are real and meaningful.
const MIN_STAT_THRESHOLD = 50;

async function getReferralStats() {
  try {
    const [linkClicks, referredJoins] = await Promise.all([
      prisma.share.aggregate({
        _sum: { clickCount: true },
        where: { referralCode: { not: null } },
      }),
      prisma.contributionEvent.count({
        where: { eventType: 'REFERRAL_SIGNUP' },
      }),
    ]);

    return {
      linkClicks: linkClicks._sum.clickCount ?? 0,
      referredJoins,
    };
  } catch {
    return { linkClicks: 0, referredJoins: 0 };
  }
}

export default async function ReferralsPage() {
  const stats = await getReferralStats();
  const showStats =
    stats.linkClicks >= MIN_STAT_THRESHOLD ||
    stats.referredJoins >= MIN_STAT_THRESHOLD;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 inline-flex rounded-full bg-violet-100 dark:bg-violet-900 p-4">
              <Share2 className="h-12 w-12 text-violet-600 dark:text-violet-400" />
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Bring Friends to the Campaigns You Believe In
            </h1>
            <p className="mb-8 text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
              When you lobby a campaign, you get a personal share link. Friends
              who join through it are counted as part of your impact — visible
              on your supporter dashboard.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white"
            >
              <Link href="/explore">
                <Heart className="mr-2 h-5 w-5" />
                Find a Campaign to Lobby
              </Link>
            </Button>
          </div>

          {showStats && (
            <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {stats.linkClicks >= MIN_STAT_THRESHOLD && (
                <div className="rounded-lg bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Share Link Visits
                      </p>
                      <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                        {stats.linkClicks.toLocaleString()}
                      </p>
                    </div>
                    <Link2 className="h-8 w-8 text-violet-500" />
                  </div>
                </div>
              )}
              {stats.referredJoins >= MIN_STAT_THRESHOLD && (
                <div className="rounded-lg bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Supporters Referred by Friends
                      </p>
                      <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                        {stats.referredJoins.toLocaleString()}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-lime-500" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-white dark:bg-slate-800">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-slate-900 dark:text-white">
            How It Works
          </h2>
          <p className="mb-12 text-center text-slate-600 dark:text-slate-400">
            No sign-up forms, no codes to remember — your link is created for
            you the moment you lobby
          </p>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-600">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">
                Lobby a Campaign
              </h3>
              <p className="text-center text-slate-600 dark:text-slate-400">
                Back a product idea you want to exist. Right after you lobby,
                the success screen shows your personal share link for that
                campaign.
              </p>
              <div className="mt-4 text-sm font-semibold text-violet-600 dark:text-violet-400">
                Step 1
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-lime-500">
                <Link2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">
                Share Your Link
              </h3>
              <p className="text-center text-slate-600 dark:text-slate-400">
                Send it to friends however you like — messages, social media,
                email. Your link is also available any time from your supporter
                dashboard.
              </p>
              <div className="mt-4 text-sm font-semibold text-violet-600 dark:text-violet-400">
                Step 2
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-lime-500 to-lime-600">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">
                Your Impact Is Counted
              </h3>
              <p className="text-center text-slate-600 dark:text-slate-400">
                When friends join the campaign through your link, they are
                attributed to you — and your dashboard shows the supporters you
                brought in.
              </p>
              <div className="mt-4 text-sm font-semibold text-violet-600 dark:text-violet-400">
                Step 3
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why It Matters */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-slate-900 dark:text-white">
            Why Sharing Matters
          </h2>
          <p className="mb-12 text-center text-slate-600 dark:text-slate-400">
            Campaigns win when brands see real demand — and demand grows one
            supporter at a time
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-lg bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
                Stronger Demand Signal
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Every supporter you bring adds to the campaign&apos;s lobby
                count — the signal brands look at when deciding whether to
                respond.
              </p>
            </div>
            <div className="rounded-lg bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
                Your Impact, Visible
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Your supporter dashboard shows the campaigns you&apos;ve backed
                and the friends who joined through your link, so you can see
                the difference your sharing makes.
              </p>
            </div>
            <div className="rounded-lg bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
                Better Odds for Products You Want
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                The more supporters a campaign gathers, the more likely a brand
                commits to making the product — so sharing directly helps the
                things you want get built.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg bg-gradient-to-r from-violet-600 to-lime-500 p-12 text-center text-white shadow-xl">
            <h2 className="mb-4 text-3xl font-bold">
              Ready to Grow a Campaign?
            </h2>
            <p className="mb-8 text-lg opacity-90">
              Lobby a campaign you believe in, grab your personal link, and see
              your impact on your dashboard.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-white text-violet-600 hover:bg-slate-100"
              >
                <Link href="/explore">
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Explore Campaigns
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white bg-transparent text-white hover:bg-white/10"
              >
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-5 w-5" />
                  View Your Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
