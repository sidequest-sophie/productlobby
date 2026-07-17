'use client'

import React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

export interface TabsProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {}

export const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  TabsProps
>(
  (
    {
      className,
      ...props
    },
    ref
  ) => {
    return (
      <TabsPrimitive.Root
        ref={ref}
        className={cn('w-full', className)}
        {...props}
      />
    )
  }
)

Tabs.displayName = TabsPrimitive.Root.displayName

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(
  (
    {
      className,
      ...props
    },
    ref
  ) => {
    return (
      <TabsPrimitive.List
        ref={ref}
        className={cn(
          // max-w-full: an inline-flex strip sizes to its content, so without a
          // cap a long tab row widens the page's layout viewport on mobile
          // (breaking every fixed/centered element). Capping it lets callers'
          // overflow-x-auto actually scroll instead.
          'inline-flex max-w-full items-center justify-center rounded-lg bg-gray-100 p-1 text-gray-600',
          className
        )}
        {...props}
      />
    )
  }
)

TabsList.displayName = TabsPrimitive.List.displayName

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(
  (
    {
      className,
      ...props
    },
    ref
  ) => {
    return (
      <TabsPrimitive.Trigger
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          'text-gray-500 data-[state=active]:text-violet-700 data-[state=active]:border-b-2 data-[state=active]:border-violet-600 hover:text-gray-700',
          className
        )}
        {...props}
      />
    )
  }
)

TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(
  (
    {
      className,
      ...props
    },
    ref
  ) => {
    return (
      <TabsPrimitive.Content
        ref={ref}
        className={cn(
          'mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2',
          className
        )}
        {...props}
      />
    )
  }
)

TabsContent.displayName = TabsPrimitive.Content.displayName
