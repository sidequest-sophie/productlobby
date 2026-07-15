'use client'

import React, { useState, useEffect } from 'react'
import { Loader2, Calendar, Twitter, Facebook, Linkedin, Instagram, Plus, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ScheduledPost {
  id: string
  title: string
  content: string
  platform: 'twitter' | 'facebook' | 'linkedin' | 'instagram'
  scheduledDate: string
  scheduledTime: string
  status: 'scheduled' | 'published' | 'failed' | 'draft'
  engagement?: number
}

interface ContentSchedulerProps {
  campaignId: string
}

export function ContentScheduler({ campaignId }: ContentSchedulerProps) {
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    platform: 'twitter' as const,
    scheduledDate: '',
    scheduledTime: '',
  })
  const [notAvailable, setNotAvailable] = useState(false)

  useEffect(() => {
    fetchScheduledPosts()
  }, [campaignId])

  const fetchScheduledPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns/${campaignId}/content-scheduler`)
      if (response.status === 404) {
        setNotAvailable(true)
        return
      }
      if (!response.ok) throw new Error('Failed to fetch scheduled posts')
      const data = await response.json()
      setPosts(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.content || !formData.scheduledDate) {
      setError('Please fill in all required fields')
      return
    }

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/content-scheduler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to create post')
      
      await fetchScheduledPosts()
      setShowCreateForm(false)
      setFormData({
        title: '',
        content: '',
        platform: 'twitter',
        scheduledDate: '',
        scheduledTime: '',
      })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const getPlatformIcon = (platform: ScheduledPost['platform']) => {
    switch (platform) {
      case 'twitter':
        return <Twitter className="h-5 w-5" />
      case 'facebook':
        return <Facebook className="h-5 w-5" />
      case 'linkedin':
        return <Linkedin className="h-5 w-5" />
      case 'instagram':
        return <Instagram className="h-5 w-5" />
    }
  }

  const getPlatformColor = (platform: ScheduledPost['platform']) => {
    switch (platform) {
      case 'twitter':
        return 'bg-blue-100 text-blue-700'
      case 'facebook':
        return 'bg-indigo-100 text-indigo-700'
      case 'linkedin':
        return 'bg-cyan-100 text-cyan-700'
      case 'instagram':
        return 'bg-pink-100 text-pink-700'
    }
  }

  const getStatusColor = (status: ScheduledPost['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800'
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (notAvailable) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-violet-600 to-lime-500 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Content Scheduler</h2>
        <p className="text-violet-100">Schedule posts across social platforms</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-violet-600 hover:bg-violet-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Schedule Post
        </Button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Scheduled Post</h3>
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="Post title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="Post content"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platform
                </label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                >
                  <option value="twitter">Twitter</option>
                  <option value="facebook">Facebook</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="instagram">Instagram</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platform
                </label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                >
                  <option value="twitter">Twitter</option>
                  <option value="facebook">Facebook</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="instagram">Instagram</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-violet-600 hover:bg-violet-700">
                Schedule Post
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduled Posts</h3>
        {posts.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No scheduled posts yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn('p-2 rounded-lg', getPlatformColor(post.platform))}>
                      {getPlatformIcon(post.platform)}
                    </div>
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-semibold',
                        getStatusColor(post.status)
                      )}
                    >
                      {post.status}
                    </span>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-900 mb-2">{post.title}</h4>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.content}</p>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(post.scheduledDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {post.scheduledTime || '12:00'}
                  </div>
                </div>

                {post.engagement !== undefined && post.status === 'published' && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-lime-600 font-semibold">
                      {post.engagement} engagements
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
