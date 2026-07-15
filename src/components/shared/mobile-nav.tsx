'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/avatar'
import {
  Menu,
  X,
  Home,
  Search,
  Compass,
  Bell,
  User,
  Settings,
  LogOut,
  Zap,
  MessageSquare,
  Briefcase,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavLink {
  label: string
  href: string
  icon: React.ReactNode
  hidden?: boolean
}

export const MobileNav: React.FC<{ className?: string }> = ({ className }) => {
  const { user, isLoading, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const navigationLinks: NavLink[] = [
    { label: 'Dashboard', href: '/dashboard', icon: <Home className="w-5 h-5" /> },
    { label: 'Browse Campaigns', href: '/campaigns', icon: <Compass className="w-5 h-5" /> },
    { label: 'Explore', href: '/explore', icon: <Search className="w-5 h-5" /> },
    { label: 'How It Works', href: '/how-it-works', icon: <Zap className="w-5 h-5" /> },
    { label: 'Leaderboard', href: '/leaderboard', icon: <Briefcase className="w-5 h-5" /> },
    { label: 'Notifications', href: '/notifications', icon: <Bell className="w-5 h-5" /> },
  ]

  const userMenuLinks: NavLink[] = [
    { label: 'Profile', href: '/profile', icon: <User className="w-5 h-5" /> },
    { label: 'Settings', href: '/settings/notifications', icon: <Settings className="w-5 h-5" /> },
  ]

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        overlayRef.current &&
        e.target === overlayRef.current
      ) {
        setIsOpen(false)
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleLogout = async () => {
    setIsOpen(false)
    await logout()
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors',
          className
        )}
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {isOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-40 bg-black/20 transition-opacity"
          aria-hidden="true"
        />
      )}

      <div
        ref={drawerRef}
        className={cn(
          'fixed top-0 left-0 h-screen w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-out overflow-y-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {user && !isLoading && (
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-4">
              <Avatar
                src={user.avatar || undefined}
                alt={user.displayName}
                initials={user.displayName
                  .split(' ')
                  .map((n) => n.charAt(0))
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
                size="default"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {user.displayName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="p-4 space-y-2">
          {navigationLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-foreground rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <span className="text-gray-600 group-hover:text-violet-600 transition-colors">
                {link.icon}
              </span>
              <span className="font-medium text-sm group-hover:text-violet-600 transition-colors">
                {link.label}
              </span>
            </Link>
          ))}
        </nav>

        {user && !isLoading && (
          <>
            <div className="border-t border-gray-200 p-4 space-y-2">
              {userMenuLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-foreground rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <span className="text-gray-600 group-hover:text-violet-600 transition-colors">
                    {link.icon}
                  </span>
                  <span className="font-medium text-sm group-hover:text-violet-600 transition-colors">
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>

            <div className="border-t border-gray-200 p-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 rounded-lg hover:bg-red-50 transition-colors group font-medium text-sm"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
