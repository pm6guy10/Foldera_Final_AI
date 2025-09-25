import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, TrendingUp, Clock, Shield, DollarSign, Users, CheckCircle, Target, BarChart3, Building } from "lucide-react";
import type { CaseStudy } from "@shared/schema";
import { trackEvent } from "@/lib/analytics";

interface CaseStudiesProps {
  featured?: boolean;
  limit?: number;
  showMetrics?: boolean;
  className?: string;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  trend?: "up" | "down" | "neutral";
}

function MetricCard({ icon, label, value, prefix = "", suffix = "", trend = "up" }: MetricCardProps) {
  const trendColor = trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-muted-foreground";
  
  return (
    <div className="flex items-center space-x-3 p-4 rounded-lg border bg-card">
      <div className="flex-shrink-0 p-2 rounded-full bg-primary/10">
        {icon}
      </div>
      <div>
        <div className={`text-2xl font-bold ${trendColor}`}>
          {prefix}{value}{suffix}
        </div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

export default function CaseStudies({
  featured = true,
  limit = 3,
  showMetrics = true,
  className = ""
}: CaseStudiesProps) {
  const [expandedStudy, setExpandedStudy] = useState<string | null>(null);

  const { data: caseStudies = [], isLoading } = useQuery<CaseStudy[]>({
    queryKey: featured ? ['/api/case-studies', { featured: true }] : ['/api/case-studies', { published: true }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (featured) params.set('featured', 'true');
      else params.set('published', 'true');
      
      const response = await fetch(`/api/case-studies?${params}`);
      if (!response.ok) throw new Error('Failed to fetch case studies');
      const data = await response.json();
      return data.slice(0, limit);
    },
  });

  const handleCaseStudyClick = (caseStudy: CaseStudy) => {
    trackEvent({
      type: 'interaction',
      name: 'case_study_click',
      props: { 
        case_study_id: caseStudy.id,
        title: caseStudy.title,
        company: caseStudy.company,
        industry: caseStudy.industry
      }
    });
  };

  const handleExpandToggle = (caseStudyId: string) => {
    const newExpanded = expandedStudy === caseStudyId ? null : caseStudyId;
    setExpandedStudy(newExpanded);
    
    trackEvent({
      type: 'interaction',
      name: 'case_study_expand',
      props: { 
        case_study_id: caseStudyId,
        expanded: newExpanded !== null
      }
    });
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-muted rounded-full" />
                <div className="space-y-2">
                  <div className="h-6 bg-muted rounded w-48" />
                  <div className="h-4 bg-muted rounded w-32" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="space-y-2">
                      <div className="h-8 bg-muted rounded w-16" />
                      <div className="h-4 bg-muted rounded w-20" />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!caseStudies.length) {
    return null;
  }

  return (
    <div className={`space-y-8 ${className}`} data-testid="case-studies-section">
      {caseStudies.map((caseStudy) => (
        <Card 
          key={caseStudy.id} 
          className="overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary"
          data-testid={`case-study-${caseStudy.id}`}
        >
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarImage src={caseStudy.companyLogo || ''} alt={caseStudy.company} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                    {caseStudy.company.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-1">{caseStudy.title}</h3>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Building className="h-4 w-4" />
                    <span>{caseStudy.company}</span>
                    <Badge variant="outline" className="capitalize">
                      {caseStudy.industry}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {caseStudy.companySize}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExpandToggle(caseStudy.id)}
                data-testid={`case-study-expand-${caseStudy.id}`}
              >
                <ArrowRight 
                  className={`h-4 w-4 transition-transform ${
                    expandedStudy === caseStudy.id ? 'rotate-90' : ''
                  }`} 
                />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Key Metrics */}
            {showMetrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {caseStudy.timesSaved && (
                  <MetricCard
                    icon={<Clock className="h-5 w-5 text-primary" />}
                    label="Hours Saved/Month"
                    value={caseStudy.timesSaved}
                  />
                )}
                {caseStudy.errorsPrevented && (
                  <MetricCard
                    icon={<Shield className="h-5 w-5 text-primary" />}
                    label="Errors Prevented"
                    value={caseStudy.errorsPrevented}
                  />
                )}
                {caseStudy.costSavings && (
                  <MetricCard
                    icon={<DollarSign className="h-5 w-5 text-primary" />}
                    label="Annual Savings"
                    value={caseStudy.costSavings.toLocaleString()}
                    prefix="$"
                  />
                )}
                {caseStudy.roiPercentage && (
                  <MetricCard
                    icon={<TrendingUp className="h-5 w-5 text-primary" />}
                    label="ROI"
                    value={caseStudy.roiPercentage}
                    suffix="%"
                  />
                )}
                {caseStudy.complianceImprovement && (
                  <MetricCard
                    icon={<CheckCircle className="h-5 w-5 text-primary" />}
                    label="Compliance Improvement"
                    value={caseStudy.complianceImprovement}
                    suffix="%"
                  />
                )}
                {caseStudy.teamProductivity && (
                  <MetricCard
                    icon={<Users className="h-5 w-5 text-primary" />}
                    label="Team Productivity"
                    value={caseStudy.teamProductivity}
                    suffix="% increase"
                  />
                )}
              </div>
            )}

            {/* Problem & Solution Summary */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-red-500" />
                  <h4 className="font-semibold text-foreground">Challenge</h4>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {caseStudy.problemDescription}
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <h4 className="font-semibold text-foreground">Solution</h4>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {caseStudy.solutionDescription}
                </p>
              </div>
            </div>

            {/* Client Quote */}
            {caseStudy.clientQuote && (
              <div className="bg-secondary/30 rounded-lg p-6 border-l-4 border-l-primary">
                <blockquote className="text-foreground/90 text-lg italic mb-4">
                  "{caseStudy.clientQuote}"
                </blockquote>
                <div className="flex items-center space-x-3">
                  <div className="text-sm">
                    <div className="font-semibold text-foreground">{caseStudy.clientName}</div>
                    <div className="text-muted-foreground">{caseStudy.clientTitle}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Expanded Details */}
            {expandedStudy === caseStudy.id && (
              <div className="space-y-6 pt-4 border-t border-border">
                {/* Pain Points */}
                {caseStudy.painPoints && Array.isArray(caseStudy.painPoints) && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 flex items-center">
                      <Target className="h-4 w-4 text-red-500 mr-2" />
                      Specific Pain Points
                    </h4>
                    <ul className="space-y-2">
                      {(caseStudy.painPoints as string[]).map((point, index) => (
                        <li key={index} className="flex items-start space-x-2 text-muted-foreground">
                          <div className="h-2 w-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Implementation Steps */}
                {caseStudy.implementationSteps && Array.isArray(caseStudy.implementationSteps) && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 flex items-center">
                      <BarChart3 className="h-4 w-4 text-primary mr-2" />
                      Implementation Process
                    </h4>
                    <ol className="space-y-3">
                      {(caseStudy.implementationSteps as string[]).map((step, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center">
                            {index + 1}
                          </div>
                          <span className="text-muted-foreground">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Results */}
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                    Results & Impact
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {caseStudy.resultsDescription}
                  </p>
                </div>

                {/* Additional Custom Metrics */}
                {caseStudy.customMetrics && typeof caseStudy.customMetrics === 'object' && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 flex items-center">
                      <BarChart3 className="h-4 w-4 text-primary mr-2" />
                      Additional Metrics
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(caseStudy.customMetrics as Record<string, any>).map(([key, value]) => (
                        <div key={key} className="bg-secondary/30 rounded-lg p-4">
                          <div className="text-2xl font-bold text-primary mb-1">{value}</div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Button */}
            <div className="pt-4">
              <Button
                variant="default"
                className="w-full md:w-auto"
                onClick={() => handleCaseStudyClick(caseStudy)}
                data-testid={`case-study-cta-${caseStudy.id}`}
              >
                Read Full Case Study
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}