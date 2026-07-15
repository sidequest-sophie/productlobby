'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  size?: 'default' | 'lg'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      size = 'default',
      className,
      id,
      type = 'text',
      disabled = false,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

    const sizeStyles = {
      default: 'h-10',
      lg: 'h-12',
    }

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground mb-2"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          className={cn(
            'w-full px-3.5 py-2.5 text-base border border-gray-300 text-foreground placeholder:text-gray-400 transition-colors duration-200 rounded-md',
            'focus:outline-none focus:border-violet-600 focus:ring-3 focus:ring-violet-100',
            'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:ring-red-100 focus:border-red-500',
            sizeStyles[size],
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
