'use client'

import React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ModalProps
  extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
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

Modal.displayName = 'Modal'

export const ModalTrigger = DialogPrimitive.Trigger

export const ModalContent = React.forwardRef<
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
            // w-[calc(100%-2rem)]: keep a 1rem gutter each side on phones so
            // the rounded panel never touches the screen edge.
            'fixed left-[50%] top-[50%] z-50 w-[calc(100%-2rem)] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] border border-gray-200 bg-white shadow-elevated-lg rounded-lg duration-200 animate-slide-up-center',
            'data-[state=open]:animate-slide-up-center data-[state=closed]:animate-fade-out',
            className
          )}
          {...props}
        />
      </DialogPrimitive.Portal>
    )
  }
)

ModalContent.displayName = DialogPrimitive.Content.displayName

export const ModalHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
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
        className={cn('px-6 py-4 border-b border-gray-200', className)}
        {...props}
      />
    )
  }
)

ModalHeader.displayName = 'ModalHeader'

export const ModalTitle = React.forwardRef<
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
        className={cn('text-lg font-semibold text-foreground', className)}
        {...props}
      />
    )
  }
)

ModalTitle.displayName = DialogPrimitive.Title.displayName

export const ModalDescription = React.forwardRef<
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

ModalDescription.displayName = DialogPrimitive.Description.displayName

export const ModalBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
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
        className={cn('px-6 py-4', className)}
        {...props}
      />
    )
  }
)

ModalBody.displayName = 'ModalBody'

export const ModalFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
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
        className={cn('px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-3', className)}
        {...props}
      />
    )
  }
)

ModalFooter.displayName = 'ModalFooter'

export const ModalClose = React.forwardRef<
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
          // p-2.5 grows the 16px icon to a 36px+ touch target for phones;
          // z-20 keeps it above sticky modal footer/header content.
          'absolute right-1.5 top-1.5 z-20 p-2.5 rounded-md opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:pointer-events-none',
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

ModalClose.displayName = DialogPrimitive.Close.displayName
