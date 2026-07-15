'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Trash2, Plus, Filter } from 'lucide-react';

interface Stakeholder {
  id: string;
  name: string;
  role: string;
  organization: string;
  category: 'internal' | 'external' | 'partner' | 'investor' | 'regulator' | 'community';
  influence: number; // 1-5
  interest: number; // 1-5
  engagement: 'engaged' | 'neutral' | 'resistant' | 'unknown';
  notes?: string;
}

interface StakeholderMapProps {
  campaignId: string;
}

export function StakeholderMap({ campaignId }: StakeholderMapProps) {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterInfluence, setFilterInfluence] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    organization: '',
    category: 'internal' as Stakeholder['category'],
    influence: 3,
    interest: 3,
    engagement: 'unknown' as Stakeholder['engagement'],
    notes: '',
  });

  useEffect(() => {
    fetchStakeholders();
  }, [campaignId]);

  const fetchStakeholders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/campaigns/${campaignId}/stakeholders`);
      if (!response.ok) throw new Error('Failed to fetch stakeholders');
      const data = await response.json();
      setStakeholders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stakeholders');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStakeholder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/stakeholders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to add stakeholder');
      await fetchStakeholders();
      setFormData({
        name: '',
        role: '',
        organization: '',
        category: 'internal',
        influence: 3,
        interest: 3,
        engagement: 'unknown',
        notes: '',
      });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add stakeholder');
    }
  };

  const handleDeleteStakeholder = async (id: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/stakeholders/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete stakeholder');
      await fetchStakeholders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete stakeholder');
    }
  };

  const filteredStakeholders = stakeholders.filter((s) => {
    if (filterCategory && s.category !== filterCategory) return false;
    if (filterInfluence && s.influence < filterInfluence) return false;
    return true;
  });

  const stats = {
    total: stakeholders.length,
    byCategory: {
      internal: stakeholders.filter((s) => s.category === 'internal').length,
      external: stakeholders.filter((s) => s.category === 'external').length,
      partner: stakeholders.filter((s) => s.category === 'partner').length,
      investor: stakeholders.filter((s) => s.category === 'investor').length,
      regulator: stakeholders.filter((s) => s.category === 'regulator').length,
      community: stakeholders.filter((s) => s.category === 'community').length,
    },
    avgInfluence:
      stakeholders.length > 0
        ? (stakeholders.reduce((sum, s) => sum + s.influence, 0) / stakeholders.length).toFixed(1)
        : 0,
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      internal: 'bg-blue-100 text-blue-700',
      external: 'bg-orange-100 text-orange-700',
      partner: 'bg-green-100 text-green-700',
      investor: 'bg-yellow-100 text-yellow-700',
      regulator: 'bg-red-100 text-red-700',
      community: 'bg-purple-100 text-purple-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const getEngagementColor = (engagement: string) => {
    const colors: Record<string, string> = {
      engaged: 'bg-lime-100 text-lime-700',
      neutral: 'bg-gray-100 text-gray-700',
      resistant: 'bg-red-100 text-red-700',
      unknown: 'bg-slate-100 text-slate-700',
    };
    return colors[engagement] || 'bg-gray-100 text-gray-700';
  };

  const getInfluenceColor = (level: number) => {
    if (level >= 4) return 'text-violet-600';
    if (level >= 3) return 'text-violet-500';
    return 'text-violet-400';
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg border border-gray-200">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Stakeholder Map</h2>
          <p className="text-sm text-gray-500 mt-1">Manage and visualize stakeholder relationships</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Stakeholder
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-violet-50 to-violet-100 p-4 rounded-lg border border-violet-200">
          <p className="text-sm font-medium text-violet-700">Total Stakeholders</p>
          <p className="text-3xl font-bold text-violet-900 mt-2">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-lime-50 to-lime-100 p-4 rounded-lg border border-lime-200">
          <p className="text-sm font-medium text-lime-700">Avg Influence</p>
          <p className="text-3xl font-bold text-lime-900 mt-2">{stats.avgInfluence}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-700">Internal</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">{stats.byCategory.internal}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
          <p className="text-sm font-medium text-orange-700">External</p>
          <p className="text-3xl font-bold text-orange-900 mt-2">{stats.byCategory.external}</p>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleAddStakeholder} className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                placeholder="Stakeholder name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input
                type="text"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                placeholder="Job title or role"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
              <input
                type="text"
                required
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                placeholder="Organization name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as
                      | 'internal'
                      | 'external'
                      | 'partner'
                      | 'investor'
                      | 'regulator'
                      | 'community',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500"
              >
                <option value="internal">Internal</option>
                <option value="external">External</option>
                <option value="partner">Partner</option>
                <option value="investor">Investor</option>
                <option value="regulator">Regulator</option>
                <option value="community">Community</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Influence Level: {formData.influence}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.influence}
                onChange={(e) => setFormData({ ...formData, influence: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interest Level: {formData.interest}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.interest}
                onChange={(e) => setFormData({ ...formData, interest: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Engagement Status</label>
              <select
                value={formData.engagement}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    engagement: e.target.value as 'engaged' | 'neutral' | 'resistant' | 'unknown',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500"
              >
                <option value="unknown">Unknown</option>
                <option value="engaged">Engaged</option>
                <option value="neutral">Neutral</option>
                <option value="resistant">Resistant</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                placeholder="Additional notes about this stakeholder"
                rows={2}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white">
              Add Stakeholder
            </Button>
            <Button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-900"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Button
          variant={filterCategory === null ? 'primary' : 'outline'}
          onClick={() => setFilterCategory(null)}
          className={filterCategory === null ? 'bg-violet-600 hover:bg-violet-700 text-white' : ''}
        >
          <Filter className="w-4 h-4 mr-1" />
          All Categories
        </Button>
        {['internal', 'external', 'partner', 'investor', 'regulator', 'community'].map((cat) => (
          <Button
            key={cat}
            variant={filterCategory === cat ? 'primary' : 'outline'}
            onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
            className={filterCategory === cat ? 'bg-violet-600 hover:bg-violet-700 text-white' : ''}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </Button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && <div className="text-center py-8 text-gray-500">Loading stakeholders...</div>}

      {/* Stakeholder Grid */}
      {!loading && filteredStakeholders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStakeholders.map((stakeholder) => (
            <div
              key={stakeholder.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{stakeholder.name}</h3>
                  <p className="text-sm text-gray-600">{stakeholder.role}</p>
                </div>
                <Button
                  onClick={() => handleDeleteStakeholder(stakeholder.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-xs text-gray-600 mb-3">{stakeholder.organization}</p>

              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <span className={cn('text-xs font-medium px-2 py-1 rounded', getCategoryColor(stakeholder.category))}>
                    {stakeholder.category.charAt(0).toUpperCase() + stakeholder.category.slice(1)}
                  </span>
                  <span className={cn('text-xs font-medium px-2 py-1 rounded', getEngagementColor(stakeholder.engagement))}>
                    {stakeholder.engagement.charAt(0).toUpperCase() + stakeholder.engagement.slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div>
                  <p className="text-gray-600 font-medium">Influence</p>
                  <div className="flex gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'w-2 h-6 rounded-sm',
                          i < stakeholder.influence ? getInfluenceColor(stakeholder.influence) : 'bg-gray-200'
                        )}
                      />
                    ))}
                  </div>
                  <p className={cn('text-xs font-semibold mt-1', getInfluenceColor(stakeholder.influence))}>
                    {stakeholder.influence}/5
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Interest</p>
                  <div className="flex gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'w-2 h-6 rounded-sm',
                          i < stakeholder.interest ? 'bg-lime-400' : 'bg-gray-200'
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-lime-600 mt-1">{stakeholder.interest}/5</p>
                </div>
              </div>

              {stakeholder.notes && (
                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
                  {stakeholder.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredStakeholders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">
            {stakeholders.length === 0 ? 'No stakeholders added yet' : 'No stakeholders match your filters'}
          </p>
          {stakeholders.length === 0 && (
            <Button onClick={() => setShowForm(true)} className="bg-violet-600 hover:bg-violet-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Stakeholder
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
