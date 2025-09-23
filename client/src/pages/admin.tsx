import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { insertTestimonialSchema, insertCaseStudySchema } from '@shared/schema';
import type { SelectTestimonial, SelectCaseStudy, InsertTestimonial, InsertCaseStudy, LeadProfile, LeadActivity, LeadScore } from '@shared/schema';
import { 
  Edit, Trash2, Plus, Eye, EyeOff, CheckCircle, XCircle, 
  Download, FileText, Code, ExternalLink, RefreshCw, MoreHorizontal, UserPlus 
} from 'lucide-react';
import { z } from 'zod';

const testimonialFormSchema = insertTestimonialSchema.extend({
  displayOrder: z.coerce.number().min(1),
});

const caseStudyFormSchema = insertCaseStudySchema.extend({
  displayOrder: z.coerce.number().min(1),
  timesSaved: z.coerce.number().optional(),
  errorsPrevented: z.coerce.number().optional(),
  costSavings: z.coerce.number().optional(),
  roiPercentage: z.coerce.number().optional(),
  complianceImprovement: z.coerce.number().optional(),
  teamProductivity: z.coerce.number().optional(),
});

type TestimonialFormData = z.infer<typeof testimonialFormSchema>;
type CaseStudyFormData = z.infer<typeof caseStudyFormSchema>;

export default function AdminPage() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('testimonials');

  // Fetch data
  const { data: testimonials = [], isLoading: testimonialsLoading } = useQuery<SelectTestimonial[]>({
    queryKey: ['/api/testimonials']
  });

  const { data: caseStudies = [], isLoading: caseStudiesLoading } = useQuery<SelectCaseStudy[]>({
    queryKey: ['/api/case-studies']
  });

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['/api/leads'],
    queryFn: () => apiRequest('GET', '/api/leads?limit=100')
  });

  const leads = leadsData?.leads || [];

  const { data: leadAnalytics } = useQuery({
    queryKey: ['/api/leads/analytics/summary'],
    queryFn: () => apiRequest('GET', '/api/leads/analytics/summary')
  });

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage content, leads, and CRM integration for Foldera
          </p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="testimonials" data-testid="tab-testimonials">
              Testimonials ({testimonials.length})
            </TabsTrigger>
            <TabsTrigger value="case-studies" data-testid="tab-case-studies">
              Case Studies ({caseStudies.length})
            </TabsTrigger>
            <TabsTrigger value="leads" data-testid="tab-leads">
              Leads ({leads.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="testimonials">
            <TestimonialsTab testimonials={testimonials} loading={testimonialsLoading} />
          </TabsContent>

          <TabsContent value="case-studies">
            <CaseStudiesTab caseStudies={caseStudies} loading={caseStudiesLoading} />
          </TabsContent>

          <TabsContent value="leads">
            <LeadsTab leads={leads} leadAnalytics={leadAnalytics} loading={leadsLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function TestimonialsTab({ testimonials, loading }: { testimonials: SelectTestimonial[]; loading: boolean }) {
  const { toast } = useToast();
  const [editingTestimonial, setEditingTestimonial] = useState<SelectTestimonial | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<TestimonialFormData>({
    resolver: zodResolver(testimonialFormSchema),
    defaultValues: {
      customerName: '',
      title: '',
      company: '',
      quote: '',
      industry: 'technology',
      companySize: 'startup',
      featured: false,
      approved: false,
      displayOrder: 1,
      verificationBadge: 'none',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: TestimonialFormData) => apiRequest('POST', '/api/testimonials', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/testimonials'] });
      toast({ title: 'Success', description: 'Testimonial created successfully' });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create testimonial', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TestimonialFormData }) =>
      apiRequest('PATCH', `/api/testimonials/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/testimonials'] });
      toast({ title: 'Success', description: 'Testimonial updated successfully' });
      setDialogOpen(false);
      setEditingTestimonial(null);
      form.reset();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update testimonial', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/testimonials/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/testimonials'] });
      toast({ title: 'Success', description: 'Testimonial deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete testimonial', variant: 'destructive' });
    },
  });

  const handleSubmit = (data: TestimonialFormData) => {
    if (editingTestimonial) {
      updateMutation.mutate({ id: editingTestimonial.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const startEdit = (testimonial: SelectTestimonial) => {
    setEditingTestimonial(testimonial);
    form.reset({
      ...testimonial,
      displayOrder: testimonial.displayOrder || 1,
    });
    setDialogOpen(true);
  };

  const startCreate = () => {
    setEditingTestimonial(null);
    form.reset();
    setDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-8">Loading testimonials...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Manage Testimonials</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={startCreate} data-testid="button-add-testimonial">
              <Plus className="w-4 h-4 mr-2" />
              Add Testimonial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-customer-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-company" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quote</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={4} data-testid="textarea-quote" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger data-testid="select-industry">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="healthcare">Healthcare</SelectItem>
                            <SelectItem value="legal">Legal</SelectItem>
                            <SelectItem value="consulting">Consulting</SelectItem>
                            <SelectItem value="manufacturing">Manufacturing</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companySize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Size</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger data-testid="select-company-size">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="startup">Startup</SelectItem>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="mid-market">Mid-market</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="displayOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Order</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-display-order" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center space-x-6">
                  <FormField
                    control={form.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                            data-testid="switch-featured"
                          />
                        </FormControl>
                        <FormLabel>Featured</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="approved"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                            data-testid="switch-approved"
                          />
                        </FormControl>
                        <FormLabel>Approved</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-testimonial"
                  >
                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {testimonials.map((testimonial) => (
          <Card key={testimonial.id} data-testid={`card-testimonial-${testimonial.id}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {testimonial.customerName} - {testimonial.title}
                  </CardTitle>
                  <CardDescription>
                    {testimonial.company} • {testimonial.industry}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {testimonial.featured && <Badge variant="secondary">Featured</Badge>}
                  {testimonial.approved ? (
                    <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
                  ) : (
                    <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Pending</Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(testimonial)}
                    data-testid={`button-edit-${testimonial.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(testimonial.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${testimonial.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 italic">"{testimonial.quote}"</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {testimonials.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No testimonials found. Click "Add Testimonial" to create your first one.
        </div>
      )}
    </div>
  );
}

function CaseStudiesTab({ caseStudies, loading }: { caseStudies: SelectCaseStudy[]; loading: boolean }) {
  if (loading) {
    return <div className="text-center py-8">Loading case studies...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Manage Case Studies</h2>
        <Button data-testid="button-add-case-study">
          <Plus className="w-4 h-4 mr-2" />
          Add Case Study
        </Button>
      </div>

      <div className="grid gap-4">
        {caseStudies.map((caseStudy) => (
          <Card key={caseStudy.id} data-testid={`card-case-study-${caseStudy.id}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{caseStudy.title}</CardTitle>
                  <CardDescription>
                    {caseStudy.company} • {caseStudy.industry} • {caseStudy.companySize}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {caseStudy.featured && <Badge variant="secondary">Featured</Badge>}
                  {caseStudy.published ? (
                    <Badge variant="default"><Eye className="w-3 h-3 mr-1" />Published</Badge>
                  ) : (
                    <Badge variant="destructive"><EyeOff className="w-3 h-3 mr-1" />Draft</Badge>
                  )}
                  <Button variant="outline" size="sm" data-testid={`button-edit-case-study-${caseStudy.id}`}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" data-testid={`button-delete-case-study-${caseStudy.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-semibold text-green-600">Time Saved</div>
                  <div>{caseStudy.timesSaved || 0} hours</div>
                </div>
                <div>
                  <div className="font-semibold text-blue-600">Errors Prevented</div>
                  <div>{caseStudy.errorsPrevented || 0}</div>
                </div>
                <div>
                  <div className="font-semibold text-purple-600">Cost Savings</div>
                  <div>${((caseStudy.costSavings || 0) / 1000000).toFixed(1)}M</div>
                </div>
                <div>
                  <div className="font-semibold text-orange-600">ROI</div>
                  <div>{caseStudy.roiPercentage || 0}%</div>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mt-3 line-clamp-2">
                {caseStudy.problemDescription}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {caseStudies.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No case studies found. Click "Add Case Study" to create your first one.
        </div>
      )}
    </div>
  );
}

function LeadsTab({ leads, leadAnalytics, loading }: { 
  leads: LeadProfile[]; 
  leadAnalytics: any; 
  loading: boolean; 
}) {
  const { toast } = useToast();
  const [selectedLead, setSelectedLead] = useState<LeadProfile | null>(null);
  const [filterQualification, setFilterQualification] = useState<string>('all');
  const [filterStage, setFilterStage] = useState<string>('all');

  const filteredLeads = leads.filter(lead => {
    if (filterQualification !== 'all' && lead.qualification !== filterQualification) return false;
    if (filterStage !== 'all' && lead.stage !== filterStage) return false;
    return true;
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LeadProfile> }) =>
      apiRequest('PUT', `/api/leads/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leads/analytics/summary'] });
      toast({ title: 'Success', description: 'Lead updated successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update lead', variant: 'destructive' });
    },
  });

  const qualificationColors = {
    hot: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    warm: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    cold: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  };

  const stageColors = {
    visitor: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    lead: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    mql: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    sql: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    opportunity: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    customer: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  };

  if (loading) {
    return <div className="text-center py-8">Loading leads...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Lead Analytics Summary */}
      {leadAnalytics?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{leadAnalytics.summary.total}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Leads</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{leadAnalytics.summary.qualified}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Qualified</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{leadAnalytics.summary.hot}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Hot</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{leadAnalytics.summary.warm}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Warm</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{leadAnalytics.summary.cold}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Cold</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and CRM Actions */}
      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Qualification</label>
          <Select value={filterQualification} onValueChange={setFilterQualification}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="hot">Hot</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
              <SelectItem value="cold">Cold</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Stage</label>
          <Select value={filterStage} onValueChange={setFilterStage}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="visitor">Visitor</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="mql">MQL</SelectItem>
              <SelectItem value="sql">SQL</SelectItem>
              <SelectItem value="opportunity">Opportunity</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* CRM Export Actions */}
        <div className="flex gap-2 ml-auto">
          <CRMExportActions leads={filteredLeads} />
        </div>
      </div>

      {/* Leads Grid */}
      <div className="grid gap-4">
        {filteredLeads.map((lead) => (
          <Card key={lead.id} className="cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => setSelectedLead(lead)}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">
                      {lead.name || 'Anonymous'}
                      {lead.company && (
                        <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">
                          @ {lead.company}
                        </span>
                      )}
                    </h3>
                    <Badge className={`${qualificationColors[lead.qualification as keyof typeof qualificationColors] || qualificationColors.cold}`}>
                      {lead.qualification?.toUpperCase()}
                    </Badge>
                    <Badge className={`${stageColors[lead.stage as keyof typeof stageColors] || stageColors.visitor}`}>
                      {lead.stage?.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Score</div>
                      <div className="text-2xl font-bold text-primary">{lead.score || 0}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-600 dark:text-gray-400">Email</div>
                      <div className="truncate">{lead.email || 'Not provided'}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-600 dark:text-gray-400">Page Views</div>
                      <div>{lead.totalPageViews || 0}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-600 dark:text-gray-400">Last Activity</div>
                      <div>{lead.lastActivityAt ? new Date(lead.lastActivityAt).toLocaleDateString() : 'Never'}</div>
                    </div>
                  </div>

                  {lead.firstSource && (
                    <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                      Source: {lead.firstSource} {lead.firstMedium && `/ ${lead.firstMedium}`} 
                      {lead.firstCampaign && `/ ${lead.firstCampaign}`}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  {lead.isQualified && (
                    <Badge variant="default">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Qualified
                    </Badge>
                  )}
                  {lead.crmSyncStatus === 'synced' && (
                    <Badge variant="secondary">
                      Synced to CRM
                    </Badge>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLead(lead);
                    }}
                    data-testid={`button-view-lead-${lead.id}`}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No leads found with the current filters.
        </div>
      )}

      {/* Lead Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Lead Details: {selectedLead?.name || 'Anonymous'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedLead && <LeadDetailView lead={selectedLead} onUpdate={updateLeadMutation} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LeadDetailView({ lead, onUpdate }: { 
  lead: LeadProfile; 
  onUpdate: any; 
}) {
  const [activeTab, setActiveTab] = useState('profile');
  
  const { data: activities = [] } = useQuery<LeadActivity[]>({
    queryKey: ['/api/leads', lead.id, 'activities'],
    queryFn: () => apiRequest('GET', `/api/leads/${lead.id}/activities`)
  });

  const { data: scoreHistory = [] } = useQuery<LeadScore[]>({
    queryKey: ['/api/leads', lead.id, 'score-history'],
    queryFn: () => apiRequest('GET', `/api/leads/${lead.id}/score-history`)
  });

  return (
    <div className="space-y-6">
      {/* Quick Info Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-card/30 rounded-lg">
        <div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Score</div>
          <div className="text-2xl font-bold text-primary">{lead.score || 0}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Qualification</div>
          <Badge className="mt-1">{lead.qualification?.toUpperCase()}</Badge>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Stage</div>
          <Badge variant="secondary" className="mt-1">{lead.stage?.toUpperCase()}</Badge>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">CRM Status</div>
          <Badge 
            variant={lead.crmSyncStatus === 'synced' ? 'default' : 'destructive'} 
            className="mt-1"
          >
            {lead.crmSyncStatus?.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Detail Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="activities">Activities ({activities.length})</TabsTrigger>
          <TabsTrigger value="scoring">Scoring History ({scoreHistory.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <div className="text-sm">{lead.name || 'Not provided'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <div className="text-sm">{lead.email || 'Not provided'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Company</label>
                  <div className="text-sm">{lead.company || 'Not provided'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Job Title</label>
                  <div className="text-sm">{lead.jobTitle || 'Not provided'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <div className="text-sm">{lead.phoneNumber || 'Not provided'}</div>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Total Page Views</label>
                  <div className="text-sm">{lead.totalPageViews || 0}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Total Sessions</label>
                  <div className="text-sm">{lead.totalSessions || 0}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Time on Site</label>
                  <div className="text-sm">
                    {lead.totalTimeOnSite ? `${Math.round(lead.totalTimeOnSite / 60000)} minutes` : '0 minutes'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">First Seen</label>
                  <div className="text-sm">
                    {lead.firstSeenAt ? new Date(lead.firstSeenAt).toLocaleString() : 'Unknown'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Last Activity</label>
                  <div className="text-sm">
                    {lead.lastActivityAt ? new Date(lead.lastActivityAt).toLocaleString() : 'Never'}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lead Source */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Source</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium">First Source</label>
                  <div className="text-sm">{lead.firstSource || 'Unknown'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">First Medium</label>
                  <div className="text-sm">{lead.firstMedium || 'Unknown'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">First Campaign</label>
                  <div className="text-sm">{lead.firstCampaign || 'Unknown'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Last Source</label>
                  <div className="text-sm">{lead.lastSource || 'Unknown'}</div>
                </div>
              </CardContent>
            </Card>

            {/* Management */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Assigned To</label>
                  <div className="text-sm">{lead.assignedTo || 'Unassigned'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Handoff Triggered</label>
                  <div className="text-sm">{lead.handoffTriggered ? 'Yes' : 'No'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">CRM Contact ID</label>
                  <div className="text-sm">{lead.crmContactId || 'Not synced'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Last CRM Sync</label>
                  <div className="text-sm">
                    {lead.crmLastSyncAt ? new Date(lead.crmLastSyncAt).toLocaleString() : 'Never'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <div className="space-y-3">
            {activities.map((activity) => (
              <Card key={activity.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{activity.activityName}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {activity.activityType} • {activity.pointsAwarded} points
                      </div>
                      {activity.pageUrl && (
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {activity.pageUrl}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-500">
                      {new Date(activity.createdAt).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {activities.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No activities recorded for this lead.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="scoring" className="space-y-4">
          <div className="space-y-3">
            {scoreHistory.map((score) => (
              <Card key={score.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{score.reason}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {score.previousScore} → {score.newScore} 
                        <span className={`ml-2 ${score.scoreChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ({score.scoreChange > 0 ? '+' : ''}{score.scoreChange})
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-500">
                      {new Date(score.createdAt).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {scoreHistory.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No scoring history available for this lead.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CRMExportActions({ leads }: { leads: LeadProfile[] }) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const exportToCRM = useMutation({
    mutationFn: (format: 'csv' | 'json' | 'hubspot' | 'salesforce') =>
      apiRequest('POST', '/api/leads/export', { format, leadIds: leads.map(l => l.id) }),
    onSuccess: (data, format) => {
      if (format === 'csv' || format === 'json') {
        // Create download
        const blob = new Blob([data.data], { 
          type: format === 'csv' ? 'text/csv' : 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads_export_${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      toast({ 
        title: 'Success', 
        description: `Successfully exported ${leads.length} leads to ${format.toUpperCase()}` 
      });
      setIsExporting(false);
    },
    onError: () => {
      toast({ 
        title: 'Error', 
        description: 'Failed to export leads', 
        variant: 'destructive' 
      });
      setIsExporting(false);
    },
  });

  const triggerCRMSync = useMutation({
    mutationFn: () => apiRequest('POST', '/api/leads/crm/sync-all'),
    onSuccess: () => {
      toast({ title: 'Success', description: 'CRM sync initiated successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to initiate CRM sync', variant: 'destructive' });
    },
  });

  const handleExport = async (format: 'csv' | 'json' | 'hubspot' | 'salesforce') => {
    setIsExporting(true);
    exportToCRM.mutate(format);
  };

  return (
    <div className="flex gap-2">
      {/* Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isExporting} data-testid="button-export-leads">
            <Download className="w-4 h-4 mr-2" />
            Export ({leads.length})
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleExport('csv')} data-testid="export-csv">
            <FileText className="w-4 h-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('json')} data-testid="export-json">
            <Code className="w-4 h-4 mr-2" />
            Export as JSON
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleExport('hubspot')} data-testid="export-hubspot">
            <ExternalLink className="w-4 h-4 mr-2" />
            Send to HubSpot
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('salesforce')} data-testid="export-salesforce">
            <ExternalLink className="w-4 h-4 mr-2" />
            Send to Salesforce
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* CRM Sync Button */}
      <Button 
        variant="outline" 
        onClick={() => triggerCRMSync.mutate()}
        disabled={triggerCRMSync.isPending}
        data-testid="button-sync-crm"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${triggerCRMSync.isPending ? 'animate-spin' : ''}`} />
        Sync CRM
      </Button>

      {/* Bulk Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" data-testid="button-bulk-actions">
            <MoreHorizontal className="w-4 h-4 mr-2" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem data-testid="bulk-qualify">
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark as Qualified
          </DropdownMenuItem>
          <DropdownMenuItem data-testid="bulk-assign">
            <UserPlus className="w-4 h-4 mr-2" />
            Assign to Sales Rep
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem data-testid="bulk-delete" className="text-red-600">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Selected
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}