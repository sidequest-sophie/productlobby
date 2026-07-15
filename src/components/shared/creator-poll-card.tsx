'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { formatDistanceToNow } from 'date-fns'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CreatorPollOption {
  id: string
  text: string
  voteCount: number
  percentage: number
}

interface CreatorPollCardProps {
  poll: {
    id: string
    question: string
    description?: string | null
    pollType: 'SINGLE_SELECT' | 'MULTI_SELECT' | 'RANKED'
    maxSelections: number
    status: 'ACTIVE' | 'CLOSED' | 'DRAFT'
    closesAt?: string | null
    totalVotes: number
    createdAt: string
    options: CreatorPollOption[]
    userVotes: Array<{ optionId: string; rank?: number | null }>
    isCreator: boolean
    campaignId: string
  }
  onVote?: (optionIds: string[], ranks?: number[]) => Promise<void>
  onDelete?: () => Promise<void>
  onClose?: () => Promise<void>
}

export function CreatorPollCard({
  poll,
  onVote,
  onDelete,
  onClose,
}: CreatorPollCardProps) {
  const [isVoting, setIsVoting] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    poll.userVotes.map((v) => v.optionId)
  )
  const [rankedOptions, setRankedOptions] = useState<Array<{ optionId: string; rank: number }>>(
    poll.userVotes
      .filter((v) => v.rank)
      .map((v) => ({
        optionId: v.optionId,
        rank: v.rank!,
      }))
      .sort((a, b) => a.rank - b.rank)
  )
  const [showIntensity, setShowIntensity] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const hasVoted = poll.userVotes.length > 0
  const isActive = poll.status === 'ACTIVE'
  const isClosed = poll.closesAt ? new Date(poll.closesAt) < new Date() : false

  const handleSingleSelect = async (optionId: string) => {
    if (!onVote || isVoting) return
    setIsVoting(true)
    try {
      await onVote([optionId])
      setSelectedOptions([optionId])
    } finally {
      setIsVoting(false)
    }
  }

  const handleMultiSelect = (optionId: string) => {
    const newSelection = selectedOptions.includes(optionId)
      ? selectedOptions.filter((id) => id !== optionId)
      : [...selectedOptions, optionId]

    if (newSelection.length <= poll.maxSelections) {
      setSelectedOptions(newSelection)
    }
  }

  const handleSubmitMultiSelect = async () => {
    if (!onVote || isVoting || selectedOptions.length === 0) return
    setIsVoting(true)
    try {
      await onVote(selectedOptions)
    } finally {
      setIsVoting(false)
    }
  }

  const handleRanked = (optionId: string, rank: number) => {
    const existing = rankedOptions.find((r) => r.optionId === optionId)
    if (existing) {
      if (existing.rank === rank) {
        setRankedOptions(rankedOptions.filter((r) => r.optionId !== optionId))
      } else {
        setRankedOptions(
          rankedOptions.map((r) =>
            r.optionId === optionId ? { ...r, rank } : r
          )
        )
      }
    } else {
      setRankedOptions([...rankedOptions, { optionId, rank }])
    }
  }

  const handleSubmitRanked = async () => {
    if (
      !onVote ||
      isVoting ||
      rankedOptions.length === 0 ||
      rankedOptions.length !== poll.options.length
    ) {
      return
    }
    setIsVoting(true)
    try {
      const optionIds = rankedOptions.sort((a, b) => a.rank - b.rank).map((r) => r.optionId)
      const ranks = Array.from({ length: poll.options.length }, (_, i) => i + 1)
      await onVote(optionIds, ranks)
    } finally {
      setIsVoting(false)
    }
  }

  const getPollTypeLabel = () => {
    switch (poll.pollType) {
      case 'SINGLE_SELECT':
        return 'Single Choice'
      case 'MULTI_SELECT':
        return `Select up to ${poll.maxSelections}`
      case 'RANKED':
        return 'Rank in order'
      default:
        return ''
    }
  }

  const getTimeRemaining = () => {
    if (!poll.closesAt) return null
    const closeDate = new Date(poll.closesAt)
    if (closeDate < new Date()) return 'Closed'
    return formatDistanceToNow(closeDate, { addSuffix: true })
  }

  return (
    <Card className="w-full bg-white dark:bg-slate-950">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="default"
                className="bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-200"
              >
                {getPollTypeLabel()}
              </Badge>
              {poll.status === 'CLOSED' && (
                <Badge variant="outline" className="text-slate-600">
                  Closed
                </Badge>
              )}
              {isClosed && (
                <Badge variant="outline" className="text-slate-600">
                  Expired
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg font-semibold">{poll.question}</CardTitle>
            {poll.description && (
              <CardDescription className="mt-1">{poll.description}</CardDescription>
            )}
          </div>
          {poll.isCreator && hasVoted && (
            <button
              onClick={() => setShowIntensity(!showIntensity)}
              className="text-violet-600 hover:text-violet-700 dark:text-violet-400 p-2"
              title="View brand insights"
            >
              {showIntensity ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mt-3 text-sm text-slate-500 dark:text-slate-400">
          <span>{poll.totalVotes} votes</span>
          {poll.closesAt && <span>{getTimeRemaining()}</span>}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {hasVoted && !showIntensity ? (
          // Results View
          <div className="space-y-3">
            {poll.options.map((option) => (
              <div key={option.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {option.text}
                  </label>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {option.percentage}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-violet-600 dark:bg-violet-500 transition-all duration-300"
                    style={{ width: `${option.percentage}%` }}
                  />
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {option.voteCount} vote{option.voteCount !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        ) : !hasVoted && isActive && !isClosed ? (
          // Voting Interface
          <div className="space-y-4">
            {poll.pollType === 'SINGLE_SELECT' && (
              <RadioGroup
                value={selectedOptions[0] || ''}
                onValueChange={handleSingleSelect}
              >
                <div className="space-y-3">
                  {poll.options.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.id} id={option.id} disabled={isVoting} />
                      <Label htmlFor={option.id} className="cursor-pointer font-normal">
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            {poll.pollType === 'MULTI_SELECT' && (
              <>
                <div className="space-y-3">
                  {poll.options.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.id}
                        checked={selectedOptions.includes(option.id)}
                        onCheckedChange={() => handleMultiSelect(option.id)}
                        disabled={
                          isVoting ||
                          (selectedOptions.length >= poll.maxSelections &&
                            !selectedOptions.includes(option.id))
                        }
                      />
                      <Label htmlFor={option.id} className="cursor-pointer font-normal">
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedOptions.length > 0 && (
                  <Button
                    onClick={handleSubmitMultiSelect}
                    disabled={isVoting}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    {isVoting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      `Submit (${selectedOptions.length}/${poll.maxSelections})`
                    )}
                  </Button>
                )}
              </>
            )}

            {poll.pollType === 'RANKED' && (
              <>
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Drag to rank your preferences
                </div>
                <div className="space-y-2">
                  {poll.options.map((option, index) => (
                    <div
                      key={option.id}
                      className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <span className="flex-1">{option.text}</span>
                    </div>
                  ))}
                </div>
                {rankedOptions.length === poll.options.length && (
                  <Button
                    onClick={handleSubmitRanked}
                    disabled={isVoting}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    {isVoting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Rankings'
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        ) : (
          // Closed View
          <div className="text-center py-4 text-slate-500 dark:text-slate-400">
            {poll.status === 'CLOSED' ? 'Poll is closed' : 'Voting has ended'}
          </div>
        )}

        {poll.isCreator && (
          <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            {isActive && !isClosed && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setIsClosing(true)
                  try {
                    await onClose?.()
                  } finally {
                    setIsClosing(false)
                  }
                }}
                disabled={isClosing}
                className="flex-1"
              >
                {isClosing ? 'Closing...' : 'Close Poll'}
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                setIsDeleting(true)
                try {
                  await onDelete?.()
                } finally {
                  setIsDeleting(false)
                }
              }}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
