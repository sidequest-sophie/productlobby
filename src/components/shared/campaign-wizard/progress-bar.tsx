'use client'

import { Check } from 'lucide-react'

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
}

export function ProgressBar({ currentStep, totalSteps, stepLabels }: ProgressBarProps) {
  return (
    <div className="bg-white border-b sticky top-0 z-40">
      {/* Compact on phones: the bar is sticky, so every px of its height is
          stolen from a small screen for the whole form. */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center">
                {Array.from({ length: totalSteps }).map((_, index) => {
                  const stepNum = index + 1
                  const isCompleted = stepNum < currentStep
                  const isCurrent = stepNum === currentStep

                  return (
                    <div key={index} className="flex items-center flex-1">
                      <div className="flex flex-col items-center w-full">
                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                            isCurrent
                              ? 'bg-violet-600 text-white ring-4 ring-violet-100'
                              : isCompleted
                                ? 'bg-lime-500 text-white'
                                : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {isCompleted ? <Check className="w-5 h-5" /> : stepNum}
                        </div>
                      </div>

                      {stepNum < totalSteps && (
                        <div className="flex-1 h-1 mx-2 transition-all">
                          <div
                            className={`h-full rounded-full ${
                              isCompleted ? 'bg-lime-500' : 'bg-gray-200'
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="hidden sm:grid grid-cols-6 gap-1 text-xs">
            {stepLabels.map((label, index) => (
              <div
                key={index}
                className={`text-center font-medium transition-colors ${
                  index + 1 <= currentStep ? 'text-violet-600' : 'text-gray-500'
                }`}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="text-center text-xs text-gray-500">
            Step {currentStep} of {totalSteps}
            {/* Phones hide the six-label grid above, so name the current step here. */}
            <span className="sm:hidden"> · {stepLabels[currentStep - 1]}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
