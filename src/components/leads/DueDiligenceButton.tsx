'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, FileSearch, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface DueDiligenceButtonProps {
  leadId: string
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | null
  onSuccess?: () => void
}

const CREDIT_COST = 40

export function DueDiligenceButton({ leadId, status, onSuccess }: DueDiligenceButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleStartDueDiligence = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/leads/${leadId}/due-diligence`, {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === 'Due diligence already completed') {
          toast.info('Due diligence already completed')
          onSuccess?.()
        } else if (data.error === 'Insufficient credits') {
          toast.error(`Insufficient credits. Required: ${data.required} credits`)
        } else {
          toast.error(data.error || 'Failed to start due diligence')
        }
        return
      }

      toast.success('Due diligence started! This will take 2-5 minutes.')
      onSuccess?.()
      setIsOpen(false)
    } catch (error) {
      toast.error('Failed to start due diligence')
    } finally {
      setIsLoading(false)
    }
  }

  // 根据状态显示不同的按钮
  if (status === 'COMPLETED') {
    return (
      <Button
        variant="outline"
        size="sm"
        className="text-green-600 border-green-200 hover:bg-green-50"
        onClick={onSuccess}
      >
        <CheckCircle className="w-4 h-4 mr-1" />
        View Report
      </Button>
    )
  }

  if (status === 'PROCESSING') {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="text-blue-600 border-blue-200"
      >
        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
        Processing...
      </Button>
    )
  }

  if (status === 'FAILED') {
    return (
      <Button
        variant="outline"
        size="sm"
        className="text-red-600 border-red-200 hover:bg-red-50"
        onClick={() => setIsOpen(true)}
      >
        <AlertCircle className="w-4 h-4 mr-1" />
        Retry
      </Button>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-purple-600 border-purple-200 hover:bg-purple-50"
      >
        <FileSearch className="w-4 h-4 mr-1" />
        Background Check
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enterprise Background Check</DialogTitle>
            <DialogDescription>
              Generate a comprehensive due diligence report for this lead.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Report Includes:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Company foundation & legal structure</li>
                <li>• Employee count & growth trends</li>
                <li>• Funding history & investors</li>
                <li>• Business model & target market</li>
                <li>• Recent news & executive changes</li>
                <li>• Competitive landscape</li>
                <li>• Risk assessment</li>
              </ul>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium">Cost</span>
              <span className="text-lg font-bold text-purple-600">{CREDIT_COST} credits</span>
            </div>

            <p className="text-xs text-muted-foreground">
              This process takes 2-5 minutes. You will be notified when the report is ready.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStartDueDiligence}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>Start Investigation</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
