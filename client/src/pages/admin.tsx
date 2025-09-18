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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { insertTestimonialSchema, insertCaseStudySchema } from '@shared/schema';
import type { SelectTestimonial, SelectCaseStudy, InsertTestimonial, InsertCaseStudy } from '@shared/schema';
import { Edit, Trash2, Plus, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Content Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage testimonials and case studies for the Foldera website
          </p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="testimonials" data-testid="tab-testimonials">
              Testimonials ({testimonials.length})
            </TabsTrigger>
            <TabsTrigger value="case-studies" data-testid="tab-case-studies">
              Case Studies ({caseStudies.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="testimonials">
            <TestimonialsTab testimonials={testimonials} loading={testimonialsLoading} />
          </TabsContent>

          <TabsContent value="case-studies">
            <CaseStudiesTab caseStudies={caseStudies} loading={caseStudiesLoading} />
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