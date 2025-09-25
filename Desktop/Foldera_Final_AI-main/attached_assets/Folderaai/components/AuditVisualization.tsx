'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, CheckCircle, Clock, FileText, Filter, Eye, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useQuery } from '@tanstack/react-query'

interface Discrepancy {
  id: string
  type: 'date' | 'entity' | 'amount'
  file_a: string
  value_a: string
  file_b: string
  value_b: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  created_at: string
}

interface AuditLog {
  id: string
  causality_id: string
  action: string
  details: any
  created_at: string
}

const severityConfig = {
  low: {
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    icon: CheckCircle,
    priority: 1
  },
  medium: {
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    icon: Clock,
    priority: 2
  },
  high: {
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    icon: AlertTriangle,
    priority: 3
  },
  critical: {
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    icon: AlertTriangle,
    priority: 4
  }
}

const typeLabels = {
  date: 'Date Mismatch',
  entity: 'Entity Variance',
  amount: 'Amount Discrepancy'
}

export default function AuditVisualization() {
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [expandedCausality, setExpandedCausality] = useState<string | null>(null)
  const supabase = createClient()

  // Fetch discrepancies
  const { data: discrepancyData } = useQuery({
    queryKey: ['/api/discrepancies', severityFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (severityFilter !== 'all') params.append('severity', severityFilter)
      if (typeFilter !== 'all') params.append('type', typeFilter)
      
      const response = await fetch(`/api/discrepancies?${params}`)
      if (!response.ok) throw new Error('Failed to fetch discrepancies')
      return response.json()
    }
  })

  // Fetch audit logs for expanded causality
  const { data: auditLogs } = useQuery({
    queryKey: ['/api/audit-logs', expandedCausality],
    queryFn: async () => {
      if (!expandedCausality) return null
      
      const { data } = await supabase
        .from('audit_log')
        .select('*')
        .eq('causality_id', expandedCausality)
        .order('created_at', { ascending: true })
      
      return data
    },
    enabled: !!expandedCausality
  })

  const discrepancies: Discrepancy[] = discrepancyData?.discrepancies || []
  const summary = discrepancyData?.summary || { total: 0, bySeverity: {} }

  const showReceipts = (causalityId: string) => {
    setExpandedCausality(expandedCausality === causalityId ? null : causalityId)
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getActionDescription = (action: string, details: any) => {
    const actionMap: Record<string, string> = {
      file_upload_started: `Started uploading ${details.fileCount} files`,
      file_processed: `Processed ${details.filename}`,
      upload_completed: `Upload completed - ${details.discrepanciesFound} discrepancies found`,
      discrepancy_detected: `Detected ${details.type} discrepancy`,
      discrepancies_viewed: `Viewed discrepancies (${details.resultCount} results)`
    }
    
    return actionMap[action] || action
  }

  return (
    <div className="space-y-6" data-testid="audit-visualization">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Issues</p>
                <p className="text-2xl font-bold">{summary.total}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        {Object.entries(severityConfig).map(([severity, config]) => (
          <Card key={severity}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground capitalize">{severity}</p>
                  <p className="text-2xl font-bold">{summary.bySeverity[severity] || 0}</p>
                </div>
                <config.icon className={`h-8 w-8 ${severity === 'critical' || severity === 'high' ? 'text-red-500' : severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="discrepancies" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="discrepancies">Discrepancies</TabsTrigger>
          <TabsTrigger value="live-feed">Live Audit Feed</TabsTrigger>
        </TabsList>

        <TabsContent value="discrepancies" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="entity">Entity</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Discrepancies Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detected Discrepancies</CardTitle>
            </CardHeader>
            <CardContent>
              {discrepancies.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Issues Found</h3>
                  <p className="text-muted-foreground">All documents are consistent and compliant.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Files</TableHead>
                      <TableHead>Values</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discrepancies.map(discrepancy => {
                      const config = severityConfig[discrepancy.severity]
                      return (
                        <TableRow key={discrepancy.id} data-testid={`discrepancy-row-${discrepancy.id}`}>
                          <TableCell>
                            <Badge variant="outline">
                              {typeLabels[discrepancy.type]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={config.color}>
                              {discrepancy.severity.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="space-y-1">
                              <p className="text-sm truncate" title={discrepancy.file_a}>
                                📄 {discrepancy.file_a}
                              </p>
                              <p className="text-sm truncate" title={discrepancy.file_b}>
                                📄 {discrepancy.file_b}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="space-y-1">
                              <p className="text-sm font-mono bg-muted p-1 rounded">
                                {discrepancy.value_a}
                              </p>
                              <p className="text-sm font-mono bg-muted p-1 rounded">
                                {discrepancy.value_b}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatTimestamp(discrepancy.created_at)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => showReceipts(discrepancy.id)}
                              data-testid={`show-receipts-${discrepancy.id}`}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Show Receipts
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Expanded Audit Trail */}
          {expandedCausality && auditLogs && (
            <Card>
              <CardHeader>
                <CardTitle>Audit Trail - Causality Chain</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {auditLogs.map((log: AuditLog, index) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                        data-testid={`audit-log-${log.id}`}
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {getActionDescription(log.action, log.details)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTimestamp(log.created_at)}
                          </p>
                          {log.details && (
                            <details className="mt-2">
                              <summary className="text-xs cursor-pointer text-primary">
                                View Details
                              </summary>
                              <pre className="text-xs mt-1 bg-background p-2 rounded border overflow-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="live-feed">
          <Card>
            <CardHeader>
              <CardTitle>Live System Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Real-time Feed</h3>
                <p className="text-muted-foreground">
                  Live audit events will appear here as they happen
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}