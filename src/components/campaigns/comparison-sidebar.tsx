'use client';

import type { ReactNode } from 'react';
import { ArrowLeftRight, TrendingUp, TrendingDown, Equal, Users, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/utils';

interface Campaign {
  id: string;
  name: string;
  lobbyCount: number;
  commentCount: number;
  signalScore: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  category: string;
}

interface ComparisonSidebarProps {
  campaign1: Campaign;
  campaign2: Campaign;
  onViewFull?: () => void;
}

export function ComparisonSidebar({
  campaign1,
  campaign2,
  onViewFull,
}: ComparisonSidebarProps) {
  const getMetricWinner = (
    value1: number,
    value2: number
  ): 'first' | 'second' | 'tie' => {
    if (value1 > value2) return 'first';
    if (value2 > value1) return 'second';
    return 'tie';
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-lime-600 dark:text-lime-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const getSentimentLabel = (sentiment: string) => {
    return sentiment.charAt(0).toUpperCase() + sentiment.slice(1);
  };

  const MetricRow = ({
    label,
    value1,
    value2,
    isNumeric = true,
    isSentiment = false,
  }: {
    label: ReactNode;
    value1: string | number;
    value2: string | number;
    isNumeric?: boolean;
    isSentiment?: boolean;
  }) => {
    let winner = 'tie';
    if (isNumeric && typeof value1 === 'number' && typeof value2 === 'number') {
      winner = getMetricWinner(value1, value2);
    }

    return (
      <div className="border-b border-slate-200 dark:border-slate-800 py-3 last:border-b-0">
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
          {label}
        </div>
        <div className="flex items-center justify-between gap-2">
          {/* Campaign 1 Value */}
          <div
            className={cn(
              'flex-1 px-3 py-2 rounded-md text-sm font-semibold text-center',
              winner === 'first' && !isSentiment
                ? 'bg-lime-100 dark:bg-lime-900/40 text-lime-900 dark:text-lime-300'
                : isSentiment
                  ? getSentimentColor(value1 as string)
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
            )}
          >
            {isSentiment
              ? getSentimentLabel(value1 as string)
              : formatNumber(typeof value1 === 'number' ? value1 : Number(value1))}
          </div>

          {/* Winner Indicator */}
          <div className="w-6 flex justify-center">
            {winner === 'first' && (
              <TrendingUp className="w-4 h-4 text-lime-600 dark:text-lime-400" />
            )}
            {winner === 'second' && (
              <TrendingDown className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            )}
            {winner === 'tie' && (
              <Equal className="w-4 h-4 text-slate-400 dark:text-slate-600" />
            )}
          </div>

          {/* Campaign 2 Value */}
          <div
            className={cn(
              'flex-1 px-3 py-2 rounded-md text-sm font-semibold text-center',
              winner === 'second' && !isSentiment
                ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-900 dark:text-violet-300'
                : isSentiment
                  ? getSentimentColor(value2 as string)
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
            )}
          >
            {isSentiment
              ? getSentimentLabel(value2 as string)
              : formatNumber(typeof value2 === 'number' ? value2 : Number(value2))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-50 to-lime-50 dark:from-violet-950/30 dark:to-lime-950/30 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                CAMPAIGN 1
              </p>
              <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                {campaign1.name}
              </p>
            </div>

            <div className="flex-shrink-0">
              <div className="bg-slate-200 dark:bg-slate-700 rounded-full p-2">
                <ArrowLeftRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </div>
            </div>

            <div className="flex-1 text-right">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                CAMPAIGN 2
              </p>
              <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                {campaign2.name}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-4">
          {/* Category */}
          <div className="border-b border-slate-200 dark:border-slate-800 py-3">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              Category
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 px-3 py-2 rounded-md text-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-center">
                {campaign1.category}
              </div>
              <div className="w-6" />
              <div className="flex-1 px-3 py-2 rounded-md text-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-center">
                {campaign2.category}
              </div>
            </div>
          </div>

          {/* Lobby Count */}
          <MetricRow
            label={
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                Lobby Count
              </div>
            }
            value1={campaign1.lobbyCount}
            value2={campaign2.lobbyCount}
          />

          {/* Comment Count */}
          <MetricRow
            label={
              <div className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                Comment Count
              </div>
            }
            value1={campaign1.commentCount}
            value2={campaign2.commentCount}
          />

          {/* Signal Score */}
          <MetricRow
            label="Signal Score"
            value1={campaign1.signalScore}
            value2={campaign2.signalScore}
          />

          {/* Sentiment */}
          <MetricRow
            label="Sentiment"
            value1={campaign1.sentiment}
            value2={campaign2.sentiment}
            isNumeric={false}
            isSentiment={true}
          />
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewFull}
            className="w-full text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/20"
          >
            View Full Comparison
          </Button>
        </div>
      </div>
    </div>
  );
}
