'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import FileUpload from '@/components/FileUpload'
import AuditVisualization from '@/components/audit-log-visualization'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Shield, AlertTriangle, TrendingUp, FileText, Users, Settings, LogOut, Upload } from 'lucide-react'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        router.push('/auth/signin')
        return
      }
      setUser(user)
      setLoading(false)
    }

    getUser()
  }, [supabase, router])

  // Fetch user's projects
  const { data: projects } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5)
      return data || []
    },
    enabled: !!user
  })

  // Fetch discrepancies
  const { data: discrepancies } = useQuery({
    queryKey: ['/api/discrepancies'],
    queryFn: async () => {
      const { data } = await supabase
        .from('discrepancies')
        .select('*')
        .eq('project_id', user?.id)
        .order('created_at', { ascending: false })
      return data || []
    },
    enabled: !!user
  })

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const onUploadComplete = (result: any) => {
    // Refresh data after upload
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-primary animate-pulse mb-4" />
          <p className="text-lg text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="text-primary text-2xl mr-3" />
              <div>
                <h1 className="text-xl font-bold">Foldera Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="px-3 py-1">
                Pro Plan
              </Badge>
              <Button variant="ghost" size="sm" onClick={signOut} data-testid="sign-out-button">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Executive Briefing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Protected Today</p>
                  <p className="text-3xl font-bold text-green-600">
                    {projects?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Projects scanned</p>
                </div>
                <Shield className="h-12 w-12 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Risks Flagged</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {discrepancies?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Discrepancies found</p>
                </div>
                <AlertTriangle className="h-12 w-12 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Performance</p>
                  <p className="text-3xl font-bold text-blue-600">99.2%</p>
                  <p className="text-sm text-muted-foreground">Accuracy rate</p>
                </div>
                <TrendingUp className="h-12 w-12 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Recent Projects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Recent Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                {projects && projects.length > 0 ? (
                  <div className="space-y-3">
                    {projects.map((project: any) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        data-testid={`project-${project.id}`}
                      >
                        <div>
                          <h4 className="font-medium">{project.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Created {new Date(project.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Projects Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Upload your first batch of documents to get started
                    </p>
                    <Button onClick={() => {
                      const uploadTab = document.querySelector('[data-value="upload"]') as HTMLElement;
                      uploadTab?.click();
                    }}>
                      Upload Documents
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-primary mb-4" />
                  <h3 className="text-lg font-medium mb-2">Upload Documents</h3>
                  <p className="text-muted-foreground">
                    Start scanning for conflicts and compliance issues
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <Users className="mx-auto h-12 w-12 text-primary mb-4" />
                  <h3 className="text-lg font-medium mb-2">Team Management</h3>
                  <p className="text-muted-foreground">
                    Invite team members and manage permissions
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Upload & Processing</CardTitle>
                <p className="text-muted-foreground">
                  Upload documents for AI-powered conflict detection and compliance analysis
                </p>
              </CardHeader>
              <CardContent>
                <FileUpload onUploadComplete={onUploadComplete} maxFiles={50} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <AuditVisualization />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Plan</label>
                    <p className="text-sm text-muted-foreground mt-1">Pro Plan - $99/month</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Member Since</label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(user?.created_at || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="pt-4 border-t">
                    <Button variant="destructive">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}