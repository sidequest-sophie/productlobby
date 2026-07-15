import { Metadata } from 'next';
import {
  Trophy,
  Star,
  Award,
  Flame,
  Crown,
  Shield,
  Heart,
  Share2,
  MessageSquare,
  Users,
  Zap,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Achievements',
  description:
    'Discover all available platform achievements and badges you can earn on ProductLobby.',
};

interface Achievement {
  id: string;
  name: string;
  description: string;
  points: number;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
  category: 'Campaigner' | 'Supporter' | 'Social' | 'Community' | 'Pioneer';
  icon: React.ReactNode;
}

const achievements: Achievement[] = [
  // Campaigner (Creating Campaigns)
  {
    id: 'first-campaign',
    name: 'Campaign Starter',
    description: 'Create your first campaign',
    points: 50,
    rarity: 'Common',
    category: 'Campaigner',
    icon: <Target className="w-8 h-8" />,
  },
  {
    id: 'campaign-milestone-5',
    name: 'Campaign Enthusiast',
    description: 'Create 5 campaigns',
    points: 150,
    rarity: 'Uncommon',
    category: 'Campaigner',
    icon: <Target className="w-8 h-8" />,
  },
  {
    id: 'campaign-milestone-10',
    name: 'Campaign Master',
    description: 'Create 10 campaigns',
    points: 300,
    rarity: 'Rare',
    category: 'Campaigner',
    icon: <Award className="w-8 h-8" />,
  },
  {
    id: 'campaign-reached-100',
    name: 'Century Campaigner',
    description: 'Create a campaign that reaches 100 supporters',
    points: 250,
    rarity: 'Rare',
    category: 'Campaigner',
    icon: <Crown className="w-8 h-8" />,
  },
  {
    id: 'viral-campaign',
    name: 'Viral Sensation',
    description: 'Create a campaign that reaches 1,000 supporters',
    points: 500,
    rarity: 'Epic',
    category: 'Campaigner',
    icon: <Zap className="w-8 h-8" />,
  },
  {
    id: 'legendary-campaigner',
    name: 'Campaign Visionary',
    description: 'Create 20 successful campaigns',
    points: 1000,
    rarity: 'Legendary',
    category: 'Campaigner',
    icon: <Trophy className="w-8 h-8" />,
  },

  // Supporter (Lobbying)
  {
    id: 'first-support',
    name: 'Supporter',
    description: 'Support your first campaign',
    points: 25,
    rarity: 'Common',
    category: 'Supporter',
    icon: <Heart className="w-8 h-8" />,
  },
  {
    id: 'support-milestone-10',
    name: 'Dedicated Supporter',
    description: 'Support 10 campaigns',
    points: 100,
    rarity: 'Uncommon',
    category: 'Supporter',
    icon: <Heart className="w-8 h-8" />,
  },
  {
    id: 'support-milestone-50',
    name: 'Champion Supporter',
    description: 'Support 50 campaigns',
    points: 300,
    rarity: 'Rare',
    category: 'Supporter',
    icon: <Shield className="w-8 h-8" />,
  },
  {
    id: 'all-categories',
    name: 'Universal Champion',
    description: 'Support campaigns in all categories',
    points: 200,
    rarity: 'Epic',
    category: 'Supporter',
    icon: <Star className="w-8 h-8" />,
  },
  {
    id: 'power-supporter',
    name: 'Power Lobbier',
    description: 'Support 100 campaigns',
    points: 500,
    rarity: 'Legendary',
    category: 'Supporter',
    icon: <Flame className="w-8 h-8" />,
  },

  // Social (Sharing)
  {
    id: 'first-share',
    name: 'Spreader',
    description: 'Share your first campaign',
    points: 25,
    rarity: 'Common',
    category: 'Social',
    icon: <Share2 className="w-8 h-8" />,
  },
  {
    id: 'share-milestone-10',
    name: 'Social Butterfly',
    description: 'Share 10 campaigns',
    points: 100,
    rarity: 'Uncommon',
    category: 'Social',
    icon: <Share2 className="w-8 h-8" />,
  },
  {
    id: 'share-milestone-50',
    name: 'Viral Advocate',
    description: 'Share 50 campaigns',
    points: 250,
    rarity: 'Rare',
    category: 'Social',
    icon: <Zap className="w-8 h-8" />,
  },
  {
    id: 'share-gets-supporters',
    name: 'Influencer',
    description: 'Share a campaign that gains 50 supporters from your shares',
    points: 200,
    rarity: 'Epic',
    category: 'Social',
    icon: <Users className="w-8 h-8" />,
  },
  {
    id: 'legendary-advocate',
    name: 'Social Legend',
    description: 'Share 100 campaigns',
    points: 500,
    rarity: 'Legendary',
    category: 'Social',
    icon: <Crown className="w-8 h-8" />,
  },

  // Community (Commenting)
  {
    id: 'first-comment',
    name: 'Voice',
    description: 'Leave your first comment',
    points: 10,
    rarity: 'Common',
    category: 'Community',
    icon: <MessageSquare className="w-8 h-8" />,
  },
  {
    id: 'comment-milestone-25',
    name: 'Conversationalist',
    description: 'Leave 25 comments',
    points: 75,
    rarity: 'Uncommon',
    category: 'Community',
    icon: <MessageSquare className="w-8 h-8" />,
  },
  {
    id: 'comment-milestone-100',
    name: 'Community Voice',
    description: 'Leave 100 comments',
    points: 200,
    rarity: 'Rare',
    category: 'Community',
    icon: <Users className="w-8 h-8" />,
  },
  {
    id: 'helpful-commenter',
    name: 'Thoughtful Contributor',
    description: 'Receive 50 likes on your comments',
    points: 150,
    rarity: 'Epic',
    category: 'Community',
    icon: <Heart className="w-8 h-8" />,
  },
  {
    id: 'community-legend',
    name: 'Community Pillar',
    description: 'Leave 500 comments and receive 200+ likes total',
    points: 750,
    rarity: 'Legendary',
    category: 'Community',
    icon: <Trophy className="w-8 h-8" />,
  },

  // Pioneer (Early Adopter)
  {
    id: 'early-adopter',
    name: 'Pioneer',
    description: 'Join ProductLobby in the first month',
    points: 100,
    rarity: 'Rare',
    category: 'Pioneer',
    icon: <Shield className="w-8 h-8" />,
  },
  {
    id: 'founding-member',
    name: 'Founding Member',
    description: 'Be among the first 1,000 users',
    points: 200,
    rarity: 'Epic',
    category: 'Pioneer',
    icon: <Crown className="w-8 h-8" />,
  },
  {
    id: 'early-investor',
    name: 'Early Investor',
    description: 'Support campaigns within your first week',
    points: 75,
    rarity: 'Uncommon',
    category: 'Pioneer',
    icon: <Star className="w-8 h-8" />,
  },
];

const categories = [
  'All',
  'Campaigner',
  'Supporter',
  'Social',
  'Community',
  'Pioneer',
] as const;

const rarityColors = {
  Common: 'from-slate-400 to-slate-500',
  Uncommon: 'from-green-400 to-green-600',
  Rare: 'from-blue-400 to-blue-600',
  Epic: 'from-violet-500 to-violet-700',
  Legendary: 'from-yellow-400 via-amber-500 to-yellow-600',
};

const rarityBgColors = {
  Common: 'bg-slate-50 border-slate-200',
  Uncommon: 'bg-green-50 border-green-200',
  Rare: 'bg-blue-50 border-blue-200',
  Epic: 'bg-violet-50 border-violet-200',
  Legendary: 'bg-yellow-50 border-yellow-200',
};

const rarityTextColors = {
  Common: 'text-slate-700',
  Uncommon: 'text-green-700',
  Rare: 'text-blue-700',
  Epic: 'text-violet-700',
  Legendary: 'text-yellow-700',
};

export default function AchievementsPage() {
  const stats = {
    total: achievements.length,
    earners: Math.floor(Math.random() * 10000) + 5000,
    rarest: achievements
      .filter((a) => a.rarity === 'Legendary')
      .slice(0, 1)[0]?.name,
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-lime-500/10 to-violet-500/10" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 inline-flex rounded-full bg-gradient-to-r from-violet-500 to-lime-500 p-4 shadow-lg">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight bg-gradient-to-r from-violet-600 via-lime-600 to-violet-600 bg-clip-text text-transparent mb-4">
              Platform Achievements
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl">
              Unlock badges and earn points as you engage with ProductLobby. From creating impactful campaigns
              to building our community, every action is rewarded.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-lg border border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Achievements</p>
                <p className="text-3xl font-bold text-violet-600 mt-2">{stats.total}</p>
              </div>
              <Award className="w-12 h-12 text-violet-400" />
            </div>
          </div>

          <div className="rounded-lg border border-lime-200 bg-gradient-to-br from-lime-50 to-lime-100/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Community Earners</p>
                <p className="text-3xl font-bold text-lime-600 mt-2">{stats.earners.toLocaleString()}</p>
              </div>
              <Users className="w-12 h-12 text-lime-400" />
            </div>
          </div>

          <div className="rounded-lg border border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Rarest Achievement</p>
                <p className="text-lg font-bold text-yellow-700 mt-2">{stats.rarest}</p>
              </div>
              <Crown className="w-12 h-12 text-yellow-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Explore by Category</h2>
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <Button
              key={category}
              variant={category === 'All' ? 'primary' : 'outline'}
              className={
                category === 'All'
                  ? 'bg-gradient-to-r from-violet-600 to-lime-600 hover:from-violet-700 hover:to-lime-700'
                  : ''
              }
            >
              {category}
            </Button>
          ))}
        </div>
      </section>

      {/* Achievements Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`rounded-lg border-2 p-6 transition-all hover:shadow-lg ${rarityBgColors[achievement.rarity]}`}
            >
              {/* Icon */}
              <div
                className={`inline-flex p-3 rounded-lg mb-4 bg-gradient-to-r ${
                  rarityColors[achievement.rarity]
                } text-white`}
              >
                {achievement.icon}
              </div>

              {/* Name and Rarity */}
              <h3 className="text-lg font-bold text-slate-900 mb-2">{achievement.name}</h3>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-slate-600">{achievement.description}</p>
              </div>

              {/* Rarity Badge */}
              <div className="mb-4 inline-block">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${rarityTextColors[achievement.rarity]}`}
                >
                  {achievement.rarity === 'Legendary' && '⭐ '}
                  {achievement.rarity}
                </span>
              </div>

              {/* Points */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Points Value</span>
                <span className="text-lg font-bold text-violet-600">{achievement.points}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-gradient-to-r from-violet-600 via-lime-600 to-violet-600 p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Achievement Journey?</h2>
          <p className="text-lg text-violet-100 mb-8">
            Join thousands of users building the future of product advocacy.
          </p>
          <Button className="bg-white text-violet-600 hover:bg-violet-50 font-semibold text-lg px-8 py-6">
            Explore Campaigns
          </Button>
        </div>
      </section>
    </main>
  );
}
