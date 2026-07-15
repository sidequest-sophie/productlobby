'use client'

import { useState, useEffect } from 'react'
import { Palette, RotateCcw, Check, Eye, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface BrandedColorsProps {
  campaignId: string
  currentColors?: {
    primary: string
    accent: string
    background: string
  }
  onSave: (colors: {
    primary: string
    accent: string
    background: string
  }) => void | Promise<void>
}

interface ColorPalette {
  name: string
  colors: {
    primary: string
    accent: string
    background: string
  }
}

const PRESET_PALETTES: ColorPalette[] = [
  {
    name: 'Violet & Lime',
    colors: {
      primary: '#7c3aed',
      accent: '#84cc16',
      background: '#f8fafc',
    },
  },
  {
    name: 'Ocean',
    colors: {
      primary: '#0369a1',
      accent: '#06b6d4',
      background: '#f0f9ff',
    },
  },
  {
    name: 'Sunset',
    colors: {
      primary: '#dc2626',
      accent: '#f59e0b',
      background: '#fffbeb',
    },
  },
  {
    name: 'Forest',
    colors: {
      primary: '#15803d',
      accent: '#10b981',
      background: '#f0fdf4',
    },
  },
  {
    name: 'Monochrome',
    colors: {
      primary: '#1f2937',
      accent: '#6b7280',
      background: '#f9fafb',
    },
  },
]

const DEFAULT_COLORS = {
  primary: '#7c3aed',
  accent: '#84cc16',
  background: '#f8fafc',
}

export function BrandedColors({
  campaignId,
  currentColors = DEFAULT_COLORS,
  onSave,
}: BrandedColorsProps) {
  const [colors, setColors] = useState(currentColors)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    setColors(currentColors)
  }, [currentColors])

  const handleColorChange = (
    key: 'primary' | 'accent' | 'background',
    value: string
  ) => {
    setColors((prev) => ({
      ...prev,
      [key]: value,
    }))
    setSaveSuccess(false)
  }

  const handleHexInputChange = (
    key: 'primary' | 'accent' | 'background',
    value: string
  ) => {
    // Ensure value starts with # and is valid
    let hexValue = value
    if (!hexValue.startsWith('#')) {
      hexValue = '#' + hexValue
    }

    // Only update if it's a valid hex color (3 or 6 digits after #)
    if (/^#(?:[0-9a-f]{3}){1,2}$/i.test(hexValue)) {
      handleColorChange(key, hexValue)
    }
  }

  const handleApply = async () => {
    setIsSaving(true)
    try {
      await onSave(colors)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (error) {
      console.error('Failed to save colors:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setColors(DEFAULT_COLORS)
    setSaveSuccess(false)
  }

  const handlePaletteSelect = (palette: ColorPalette) => {
    setColors(palette.colors)
    setSaveSuccess(false)
  }

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Palette className="h-5 w-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">
          Campaign Branded Colors
        </h2>
      </div>

      {/* Color Pickers */}
      <div className="space-y-4">
        {/* Primary Color */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Primary Color
          </label>
          <div className="flex gap-3">
            <input
              type="color"
              value={colors.primary}
              onChange={(e) => handleColorChange('primary', e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-gray-200"
            />
            <Input
              type="text"
              value={colors.primary}
              onChange={(e) => handleHexInputChange('primary', e.target.value)}
              placeholder="#7c3aed"
              className="font-mono"
            />
          </div>
        </div>

        {/* Accent Color */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Accent Color
          </label>
          <div className="flex gap-3">
            <input
              type="color"
              value={colors.accent}
              onChange={(e) => handleColorChange('accent', e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-gray-200"
            />
            <Input
              type="text"
              value={colors.accent}
              onChange={(e) => handleHexInputChange('accent', e.target.value)}
              placeholder="#84cc16"
              className="font-mono"
            />
          </div>
        </div>

        {/* Background Color */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Background Color
          </label>
          <div className="flex gap-3">
            <input
              type="color"
              value={colors.background}
              onChange={(e) =>
                handleColorChange('background', e.target.value)
              }
              className="h-10 w-14 cursor-pointer rounded border border-gray-200"
            />
            <Input
              type="text"
              value={colors.background}
              onChange={(e) =>
                handleHexInputChange('background', e.target.value)
              }
              placeholder="#f8fafc"
              className="font-mono"
            />
          </div>
        </div>
      </div>

      {/* Preset Palettes */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Preset Palettes
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PRESET_PALETTES.map((palette) => (
            <button
              key={palette.name}
              onClick={() => handlePaletteSelect(palette)}
              className="group relative overflow-hidden rounded-lg border border-gray-200 p-3 transition-all hover:border-gray-400 hover:shadow-md"
            >
              <div className="mb-2 flex gap-1.5">
                <div
                  className="h-6 w-6 rounded border border-gray-200"
                  style={{ backgroundColor: palette.colors.primary }}
                />
                <div
                  className="h-6 w-6 rounded border border-gray-200"
                  style={{ backgroundColor: palette.colors.accent }}
                />
                <div
                  className="h-6 w-6 rounded border border-gray-200"
                  style={{ backgroundColor: palette.colors.background }}
                />
              </div>
              <p className="text-xs font-medium text-gray-700">
                {palette.name}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Live Preview */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Eye className="h-4 w-4" />
          Live Preview
        </label>
        <div
          className="rounded-lg border border-gray-200 p-6"
          style={{ backgroundColor: colors.background }}
        >
          <div className="space-y-3">
            <button
              className="w-full rounded-lg px-4 py-2 font-medium text-white transition-all hover:opacity-90"
              style={{ backgroundColor: colors.primary }}
            >
              Primary Action
            </button>
            <button
              className="w-full rounded-lg px-4 py-2 font-medium transition-all hover:opacity-90"
              style={{
                backgroundColor: colors.accent,
                color: colors.primary,
              }}
            >
              Secondary Action
            </button>
            <div className="rounded-lg border-2 p-3" style={{ borderColor: colors.primary }}>
              <p
                className="text-sm font-medium"
                style={{ color: colors.primary }}
              >
                Featured Content
              </p>
              <p className="mt-1 text-xs text-gray-600">
                This shows how your colors work together
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 border-t border-gray-200 pt-6">
        <Button
          onClick={handleApply}
          disabled={isSaving}
          className="flex-1 gap-2"
          variant="primary"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : saveSuccess ? (
            <>
              <Check className="h-4 w-4" />
              Applied
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Apply Colors
            </>
          )}
        </Button>
        <Button
          onClick={handleReset}
          variant="outline"
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Default
        </Button>
      </div>
    </div>
  )
}
