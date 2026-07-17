'use client';

import { useEffect, useState } from 'react';
import { Users, TrendingUp, BarChart3, MessageSquare, Zap } from 'lucide-react';

interface AnalyticsOverview {
  totalLobbies: number;
  uniqueSupporters: number;
  totalUpdates: number;
  totalComments: number;
  totalPollVotes: number;
  confidenceScore: number;
}

interface TimelineEntry {
  date: string;
  count: number;
}

interface RecentActivityEntry {
  id: string;
  userName: string;
  intensity: 'NEAT_IDEA' | 'PROBABLY_BUY' | 'TAKE_MY_MONEY';
  createdAt: string;
  isAnonymous: boolean;
}

interface TopSupporter {
  displayName: string;
  handle: string;
  avatar?: string;
  intensity: 'NEAT_IDEA' | 'PROBABLY_BUY' | 'TAKE_MY_MONEY';
}

interface AnalyticsResponse {
  success: boolean;
  data: {
    overview: AnalyticsOverview;
    timeline: TimelineEntry[];
    intensityBreakdown: {
      NEAT_IDEA: number;
      PROBABLY_BUY: number;
      TAKE_MY_MONEY: number;
    };
    recentActivity: RecentActivityEntry[];
    topSupporters: TopSupporter[];
  };
}

interface CreatorAnalyticsDashboardProps {
  campaignId: string;
}

// Helper function to format relative time
function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 2592000)}mo ago`;
}

// Helper function for conditional classnames
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Intensity badge color mappings
function getIntensityStyles(intensity: string): {
  bg: string;
  text: string;
  label: string;
} {
  switch (intensity) {
    case 'NEAT_IDEA':
      return {
        bg: 'bg-green-100',
        text: 'text-green-700',
        label: 'Neat Idea',
      };
    case 'PROBABLY_BUY':
      return {
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        label: 'Probably Buy',
      };
    case 'TAKE_MY_MONEY':
      return {
        bg: 'bg-violet-100',
        text: 'text-violet-700',
        label: 'Take My Money',
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        label: intensity,
      };
  }
}

// Loading skeleton component
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse"
          >
            <div className="h-10 w-10 bg-gray-200 rounded-lg mb-4" />
            <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-8 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Intensity breakdown skeleton */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded mb-6" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="mb-6">
            <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-2 w-full bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Timeline skeleton */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
        <div className="h-6 w-40 bg-gray-200 rounded mb-6" />
        <div className="h-48 bg-gray-200 rounded" />
      </div>

      {/* Recent activity skeleton */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded mb-6" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-100 rounded mb-3" />
        ))}
      </div>
    </div>
  );
}

// Stats Card component
interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
}

function StatsCard({ icon, label, value, subtext }: StatsCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-2">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
        <div className="text-violet-600 bg-violet-50 p-3 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  );
}

// Intensity progress bar component
interface IntensityBarProps {
  label: string;
  intensity: 'NEAT_IDEA' | 'PROBABLY_BUY' | 'TAKE_MY_MONEY';
  count: number;
  total: number;
}

function IntensityBar({ label, intensity, count, total }: IntensityBarProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  const styles = getIntensityStyles(intensity);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm text-gray-600">
          {count} ({percentage.toFixed(0)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            intensity === 'NEAT_IDEA' && 'bg-green-500',
            intensity === 'PROBABLY_BUY' && 'bg-amber-500',
            intensity === 'TAKE_MY_MONEY' && 'bg-violet-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Timeline chart component
interface TimelineChartProps {
  data: TimelineEntry[];
}

function TimelineChart({ data }: TimelineChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-1 h-40">
        {data.map((entry, index) => {
          const heightPercent = (entry.count / maxCount) * 100;
          const date = new Date(entry.date);
          const dayOfWeek = date.toLocaleDateString('en-US', {
            weekday: 'short',
          });

          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center gap-2 group"
            >
              <div className="w-full flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-violet-500 to-violet-400 rounded-t transition-all duration-200 group-hover:from-violet-600 group-hover:to-violet-500 cursor-pointer"
                  style={{ height: `${Math.max(heightPercent, 4)}%` }}
                  title={`${entry.date}: ${entry.count} lobbies`}
                />
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {dayOfWeek}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-500 px-1">
        <span>{data.length > 0 ? data[0]?.date : 'N/A'}</span>
        <span>{data.length > 0 ? data[data.length - 1]?.date : 'N/A'}</span>
      </div>
    </div>
  );
}

// Recent activity item component
interface RecentActivityItemProps {
  activity: RecentActivityEntry;
}

function RecentActivityItem({ activity }: RecentActivityItemProps) {
  const intensityStyles = getIntensityStyles(activity.intensity);
  const displayName = activity.isAnonymous
    ? 'Anonymous Supporter'
    : activity.userName;

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{displayName}</p>
        <p className="text-xs text-gray-500">{timeAgo(activity.createdAt)}</p>
      </div>
      <span
        className={cn(
          'px-3 py-1 rounded-full text-xs font-medium',
          intensityStyles.bg,
          intensityStyles.text
        )}
      >
        {intensityStyles.label}
      </span>
    </div>
  );
}

// Top supporter item component
interface TopSupporterItemProps {
  supporter: TopSupporter;
}

function TopSupporterItem({ supporter }: TopSupporterItemProps) {
  const intensityStyles = getIntensityStyles(supporter.intensity);

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-shrink-0">
        {supporter.avatar ? (
          <img
            src={supporter.avatar}
            alt={supporter.displayName}
            className="w-10 h-10 rounded-full bg-violet-100"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
            <span className="text-xs font-semibold text-violet-700">
              {supporter.displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">
          {supporter.displayName}
        </p>
        <p className="text-xs text-gray-500">@{supporter.handle}</p>
      </div>
      <span
        className={cn(
          'px-2 py-1 rounded-full text-xs font-medium',
          intensityStyles.bg,
          intensityStyles.text
        )}
      >
        {intensityStyles.label}
      </span>
    </div>
  );
}

// Main component
export default function CreatorAnalyticsDashboard({
  campaignId,
}: CreatorAnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/campaigns/${campaignId}/analytics`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const result: AnalyticsResponse = await response.json();

        if (!result.success) {
          throw new Error('Analytics request was not successful');
        }

        // Defensive: the analytics API currently returns a different shape
        // (kpis/historicalData) than this dashboard renders. Without this
        // guard the missing fields crash the whole campaign detail page for
        // owners. Degrade to the error card instead until the dashboard is
        // wired to the real response shape.
        if (!result.data?.overview || !result.data?.intensityBreakdown) {
          throw new Error('Analytics data is not available yet');
        }

        setData(result.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load analytics'
        );
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) {
      fetchAnalytics();
    }
  }, [campaignId]);

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">
          {error || 'Failed to load analytics data'}
        </p>
      </div>
    );
  }

  const totalLobbyCount =
    data.intensityBreakdown.NEAT_IDEA +
    data.intensityBreakdown.PROBABLY_BUY +
    data.intensityBreakdown.TAKE_MY_MONEY;

  return (
    <div className="space-y-6">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={<BarChart3 size={20} />}
          label="Total Lobbies"
          value={data.overview.totalLobbies}
        />
        <StatsCard
          icon={<Users size={20} />}
          label="Unique Supporters"
          value={data.overview.uniqueSupporters}
        />
        <StatsCard
          icon={<TrendingUp size={20} />}
          label="Confidence Score"
          value={`${data.overview.confidenceScore.toFixed(0)}%`}
          subtext={`${data.overview.totalPollVotes} votes`}
        />
        <StatsCard
          icon={<MessageSquare size={20} />}
          label="Total Updates"
          value={data.overview.totalUpdates}
          subtext={`${data.overview.totalComments} comments`}
        />
      </div>

      {/* Intensity Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-display font-bold text-gray-900 mb-6">
          Support Intensity Breakdown
        </h2>
        <IntensityBar
          label="Neat Idea"
          intensity="NEAT_IDEA"
          count={data.intensityBreakdown.NEAT_IDEA}
          total={totalLobbyCount}
        />
        <IntensityBar
          label="Probably Buy"
          intensity="PROBABLY_BUY"
          count={data.intensityBreakdown.PROBABLY_BUY}
          total={totalLobbyCount}
        />
        <IntensityBar
          label="Take My Money"
          intensity="TAKE_MY_MONEY"
          count={data.intensityBreakdown.TAKE_MY_MONEY}
          total={totalLobbyCount}
        />
      </div>

      {/* Lobby Timeline Chart */}
      {data.timeline.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-display font-bold text-gray-900 mb-6">
            Lobby Activity (Last 30 Days)
          </h2>
          <TimelineChart data={data.timeline} />
        </div>
      )}

      {/* Recent Activity and Top Supporters - Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        {data.recentActivity.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-display font-bold text-gray-900 mb-6">
              Recent Activity
            </h2>
            <div className="space-y-0">
              {data.recentActivity.map((activity) => (
                <RecentActivityItem
                  key={activity.id}
                  activity={activity}
                />
              ))}
            </div>
          </div>
        )}

        {/* Top Supporters */}
        {data.topSupporters.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-display font-bold text-gray-900 mb-6">
              Top Supporters
            </h2>
            <div className="space-y-0">
              {data.topSupporters.map((supporter, index) => (
                <TopSupporterItem
                  key={`${supporter.handle}-${index}`}
                  supporter={supporter}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
