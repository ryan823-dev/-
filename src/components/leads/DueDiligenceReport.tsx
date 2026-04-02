'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Target, 
  Newspaper, 
  AlertTriangle,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface DueDiligenceReportProps {
  leadId: string
  isOpen: boolean
  onClose: () => void
}

interface DueDiligenceData {
  id: string
  companyLegalName?: string
  foundedYear?: number
  headquarters?: string
  employeeCount?: number
  estimatedRevenue?: string
  totalFunding?: string
  latestFundingRound?: string
  latestFundingAmount?: string
  investors?: any[]
  businessModel?: string
  targetMarket?: string
  keyProducts?: string[]
  recentNews?: any[]
  keyCompetitors?: string[]
  riskSignals?: any[]
  executiveSummary?: string
  fullReport?: string
  status: string
  createdAt: string
  completedAt?: string
}

export function DueDiligenceReport({ leadId, isOpen, onClose }: DueDiligenceReportProps) {
  const [data, setData] = useState<DueDiligenceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && leadId) {
      fetchReport()
    }
  }, [isOpen, leadId])

  const fetchReport = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/leads/${leadId}/due-diligence`)
      if (!response.ok) {
        throw new Error('Failed to fetch report')
      }
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = () => {
    if (!data) return
    
    const reportText = `
ENTERPRISE DUE DILIGENCE REPORT
Generated: ${new Date().toLocaleDateString()}

${data.executiveSummary || 'No executive summary available.'}

COMPANY OVERVIEW
----------------
Legal Name: ${data.companyLegalName || 'N/A'}
Founded: ${data.foundedYear || 'N/A'}
Headquarters: ${data.headquarters || 'N/A'}
Employee Count: ${data.employeeCount || 'N/A'}
Estimated Revenue: ${data.estimatedRevenue || 'N/A'}

FUNDING HISTORY
---------------
Total Funding: ${data.totalFunding || 'N/A'}
Latest Round: ${data.latestFundingRound || 'N/A'}
Latest Amount: ${data.latestFundingAmount || 'N/A'}

BUSINESS PROFILE
----------------
Business Model: ${data.businessModel || 'N/A'}
Target Market: ${data.targetMarket || 'N/A'}
Key Products: ${data.keyProducts?.join(', ') || 'N/A'}
`

    const blob = new Blob([reportText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `due-diligence-${data.companyLegalName || 'report'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Report exported successfully')
  }

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Due Diligence Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (error || !data) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Due Diligence Report</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Report not found'}
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl">Due Diligence Report</DialogTitle>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </DialogHeader>

        {/* Executive Summary */}
        {data.executiveSummary && (
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-gray-700">
                {data.executiveSummary}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Company Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Company Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Legal Name" value={data.companyLegalName} />
              <InfoRow label="Founded" value={data.foundedYear?.toString()} />
              <InfoRow label="Headquarters" value={data.headquarters} />
              <InfoRow label="Employees" value={data.employeeCount?.toString()} />
              <InfoRow label="Revenue" value={data.estimatedRevenue} />
            </CardContent>
          </Card>

          {/* Funding */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Funding History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Total Funding" value={data.totalFunding} />
              <InfoRow label="Latest Round" value={data.latestFundingRound} />
              <InfoRow label="Latest Amount" value={data.latestFundingAmount} />
              
              {data.investors && data.investors.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs text-muted-foreground">Key Investors:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {data.investors.slice(0, 3).map((inv: any, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {inv.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent News */}
        {data.recentNews && data.recentNews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-indigo-600" />
                Recent News
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentNews.slice(0, 3).map((news: any, i: number) => (
                <div key={i} className="border-l-2 border-indigo-200 pl-3 py-1">
                  <h4 className="text-sm font-medium text-gray-900">{news.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{news.source}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(news.date).toLocaleDateString()}
                    </span>
                  </div>
                  {news.summary && (
                    <p className="text-xs text-gray-600 mt-1">{news.summary}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
          <span>Report generated: {new Date(data.createdAt).toLocaleString()}</span>
          {data.completedAt && (
            <span>Completed: {new Date(data.completedAt).toLocaleString()}</span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value || 'N/A'}</span>
    </div>
  )
}
