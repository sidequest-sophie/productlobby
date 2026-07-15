'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Edit2, Plus, X } from 'lucide-react';

interface CompetitorExample {
  id: string;
  name: string;
  brand?: string | null;
  url?: string | null;
  imageUrl?: string | null;
  price?: number | null;
  currency: string;
  pros?: string | null;
  cons?: string | null;
  whyNotEnough?: string | null;
  order: number;
}

interface CompetitorComparisonProps {
  campaignId: string;
  isCreator: boolean;
}

export function CompetitorComparison({
  campaignId,
  isCreator,
}: CompetitorComparisonProps) {
  const [competitors, setCompetitors] = useState<CompetitorExample[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    url: '',
    imageUrl: '',
    price: '',
    currency: 'GBP',
    pros: '',
    cons: '',
    whyNotEnough: '',
  });

  // Fetch competitors
  useEffect(() => {
    fetchCompetitors();
  }, [campaignId]);

  const fetchCompetitors = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/campaigns/${campaignId}/competitors`);
      if (!response.ok) throw new Error('Failed to fetch competitors');
      const data = await response.json();
      setCompetitors(data);
      setError(null);
    } catch (err) {
      setError('Failed to load competitors');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddCompetitor = async () => {
    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }

    if (formData.price && isNaN(parseFloat(formData.price))) {
      setError('Price must be a valid number');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        name: formData.name,
        brand: formData.brand || undefined,
        url: formData.url || undefined,
        imageUrl: formData.imageUrl || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        currency: formData.currency,
        pros: formData.pros || undefined,
        cons: formData.cons || undefined,
        whyNotEnough: formData.whyNotEnough || undefined,
      };

      const response = await fetch(`/api/campaigns/${campaignId}/competitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add competitor');
      }

      await fetchCompetitors();
      resetForm();
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add competitor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCompetitor = async (competitorId: string) => {
    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }

    if (formData.price && isNaN(parseFloat(formData.price))) {
      setError('Price must be a valid number');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        name: formData.name,
        brand: formData.brand || undefined,
        url: formData.url || undefined,
        imageUrl: formData.imageUrl || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        currency: formData.currency,
        pros: formData.pros || undefined,
        cons: formData.cons || undefined,
        whyNotEnough: formData.whyNotEnough || undefined,
      };

      const response = await fetch(
        `/api/campaigns/${campaignId}/competitors/${competitorId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update competitor');
      }

      await fetchCompetitors();
      resetForm();
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update competitor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCompetitor = async (competitorId: string) => {
    if (!confirm('Are you sure you want to delete this competitor?')) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(
        `/api/campaigns/${campaignId}/competitors/${competitorId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete competitor');
      }

      await fetchCompetitors();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete competitor');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      brand: '',
      url: '',
      imageUrl: '',
      price: '',
      currency: 'GBP',
      pros: '',
      cons: '',
      whyNotEnough: '',
    });
  };

  const startEdit = (competitor: CompetitorExample) => {
    setFormData({
      name: competitor.name,
      brand: competitor.brand || '',
      url: competitor.url || '',
      imageUrl: competitor.imageUrl || '',
      price: competitor.price ? competitor.price.toString() : '',
      currency: competitor.currency,
      pros: competitor.pros || '',
      cons: competitor.cons || '',
      whyNotEnough: competitor.whyNotEnough || '',
    });
    setEditingId(competitor.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
    setEditingId(null);
    setShowForm(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <p className="text-gray-500">Loading competitors...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Competitor/Alternatives
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Show supporters how your idea improves on what exists
          </p>
        </div>
        {isCreator && !showForm && (
          <Button
            onClick={() => {
              resetForm();
              setEditingId(null);
              setShowForm(true);
            }}
            className="bg-violet-600 hover:bg-violet-700 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Competitor
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {showForm && (
        <Card className="p-6 border-2 border-violet-200 bg-violet-50">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">
                {editingId ? 'Edit Competitor' : 'Add a Competitor'}
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Slack"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand/Company
                </label>
                <Input
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  placeholder="e.g., Slack Technologies"
                  className="w-full"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website URL
                </label>
                <Input
                  value={formData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  placeholder="https://example.com"
                  className="w-full"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <Input
                  value={formData.imageUrl}
                  onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <Input
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500"
                >
                  <option>GBP</option>
                  <option>USD</option>
                  <option>EUR</option>
                  <option>AUD</option>
                  <option>CAD</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What's Good About It (Pros)
                </label>
                <Textarea
                  value={formData.pros}
                  onChange={(e) => handleInputChange('pros', e.target.value)}
                  placeholder="Describe the strengths and benefits..."
                  rows={3}
                  className="w-full"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What's Missing/Wrong (Cons)
                </label>
                <Textarea
                  value={formData.cons}
                  onChange={(e) => handleInputChange('cons', e.target.value)}
                  placeholder="Describe the limitations and weaknesses..."
                  rows={3}
                  className="w-full"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Why Isn't This Enough?
                </label>
                <Textarea
                  value={formData.whyNotEnough}
                  onChange={(e) => handleInputChange('whyNotEnough', e.target.value)}
                  placeholder="Explain why this product doesn't fully solve the problem your idea addresses..."
                  rows={3}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <button
                onClick={() => {
                  if (editingId) {
                    handleUpdateCompetitor(editingId);
                  } else {
                    handleAddCompetitor();
                  }
                }}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg disabled:bg-gray-400 transition-colors"
              >
                {submitting
                  ? 'Saving...'
                  : editingId
                    ? 'Update Competitor'
                    : 'Add Competitor'}
              </button>
              <button
                onClick={handleCancel}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg disabled:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}

      {competitors.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-600 mb-4">No competitors added yet</p>
          {isCreator && (
            <p className="text-sm text-gray-500 mb-4">
              Add competitors to show how your idea compares
            </p>
          )}
        </div>
      )}

      {competitors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {competitors.map((competitor) => (
            <Card
              key={competitor.id}
              className="p-5 border border-gray-200 hover:border-violet-300 transition-colors"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {competitor.name}
                    </h3>
                    {competitor.brand && (
                      <p className="text-sm text-gray-600 mt-1">
                        {competitor.brand}
                      </p>
                    )}
                  </div>
                  {isCreator && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(competitor)}
                        className="p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-md transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCompetitor(competitor.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Image */}
                {competitor.imageUrl && (
                  <div className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={competitor.imageUrl}
                      alt={competitor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Price */}
                {competitor.price !== null && competitor.price !== undefined && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-violet-600">
                      {competitor.currency} {competitor.price.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* URL */}
                {competitor.url && (
                  <a
                    href={competitor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-violet-600 hover:text-violet-700 hover:underline break-all"
                  >
                    Visit website
                  </a>
                )}

                {/* Pros */}
                {competitor.pros && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-lime-100 text-lime-800 hover:bg-lime-100">
                        Pros
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {competitor.pros}
                    </p>
                  </div>
                )}

                {/* Cons */}
                {competitor.cons && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                        Cons
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {competitor.cons}
                    </p>
                  </div>
                )}

                {/* Why Not Enough */}
                {competitor.whyNotEnough && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-violet-100 text-violet-800 hover:bg-violet-100">
                        Why Not Enough
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {competitor.whyNotEnough}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
