'use client'

import React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
  (
    {
      open,
      onOpenChange,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <div ref={ref} {...props}>
          {children}
        </div>
      </DialogPrimitive.Root>
    )
  }
)

Dialog.displayName = 'Dialog'

export const DialogTrigger = DialogPrimitive.Trigger

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(
  (
    {
      className,
      ...props
    },
    ref
  ) => {
    return (
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in" />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            'fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] bg-white rounded-xl shadow-elevated-lg p-6 animate-slide-up-center',
            'data-[state=open]:animate-slide-up-center data-[state=closed]:animate-fade-out',
            className
          )}
          {...props}
        />
      </DialogPrimitive.Portal>
    )
  }
)

DialogContent.displayName = DialogPrimitive.Content.displayName

export const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (
    {
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5 text-left', className)}
        {...props}
      />
    )
  }
)

DialogHeader.displayName = 'DialogHeader'

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(
  (
    {
      className,
      ...props
    },
    ref
  ) => {
    return (
      <DialogPrimitive.Title
        ref={ref}
        className={cn('text-lg font-semibold text-foreground font-display', className)}
        {...props}
      />
    )
  }
)

DialogTitle.displayName = DialogPrimitive.Title.displayName

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(
  (
    {
      className,
      ...props
    },
    ref
  ) => {
    return (
      <DialogPrimitive.Description
        ref={ref}
        className={cn('text-sm text-gray-600', className)}
        {...props}
      />
    )
  }
)

DialogDescription.displayName = DialogPrimitive.Description.displayName

export const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (
    {
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn('flex justify-end gap-3 pt-4', className)}
        {...props}
      />
    )
  }
)

DialogFooter.displayName = 'DialogFooter'

export const DialogClose = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>
>(
  (
    {
      className,
      ...props
    },
    ref
  ) => {
    return (
      <DialogPrimitive.Close
        ref={ref}
        className={cn(
          'absolute right-4 top-4 rounded-md opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2 disabled:pointer-events-none',
          className
        )}
        {...props}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    )
  }
)

DialogClose.displayName = DialogPrimitive.Close.displayName
