import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Quote, CheckCircle, Building, Award } from "lucide-react";
import type { Testimonial } from "@shared/schema";
import { trackEvent } from "@/lib/analytics";

interface TestimonialsProps {
  featured?: boolean;
  limit?: number;
  autoRotate?: boolean;
  rotationInterval?: number;
  showNavigation?: boolean;
  showIndicators?: boolean;
  className?: string;
}

export default function Testimonials({
  featured = true,
  limit = 6,
  autoRotate = true,
  rotationInterval = 5000,
  showNavigation = true,
  showIndicators = true,
  className = ""
}: TestimonialsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: testimonials = [], isLoading } = useQuery<Testimonial[]>({
    queryKey: featured ? ['/api/testimonials', { featured: true }] : ['/api/testimonials', { approved: true }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (featured) params.set('featured', 'true');
      else params.set('approved', 'true');
      
      const response = await fetch(`/api/testimonials?${params}`);
      if (!response.ok) throw new Error('Failed to fetch testimonials');
      const data = await response.json();
      return data.slice(0, limit);
    },
  });

  // Auto-rotation effect
  useEffect(() => {
    if (!autoRotate || testimonials.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
      );
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [autoRotate, rotationInterval, testimonials.length]);

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
    );
    trackEvent({
      type: 'interaction',
      name: 'testimonial_next',
      props: { current_index: currentIndex }
    });
  };

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
    trackEvent({
      type: 'interaction',
      name: 'testimonial_prev',
      props: { current_index: currentIndex }
    });
  };

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
    trackEvent({
      type: 'interaction',
      name: 'testimonial_indicator_click',
      props: { target_index: index }
    });
  };

  const handleTestimonialClick = (testimonial: Testimonial) => {
    trackEvent({
      type: 'interaction',
      name: 'testimonial_card_click',
      props: { 
        customer: testimonial.customerName,
        company: testimonial.company,
        industry: testimonial.industry
      }
    });
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="h-12 w-12 bg-muted rounded-full" />
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-24" />
                    <div className="h-3 bg-muted rounded w-20" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!testimonials.length) {
    return null;
  }

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div className={`space-y-8 ${className}`} data-testid="testimonials-section">
      {/* Hero Testimonial */}
      <div className="relative">
        <Card 
          className="border-2 border-primary/20 bg-gradient-to-br from-background to-secondary/20 cursor-pointer hover:shadow-lg transition-all duration-300"
          onClick={() => handleTestimonialClick(currentTestimonial)}
          data-testid={`testimonial-hero-${currentIndex}`}
        >
          <CardContent className="p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
              <div className="flex-shrink-0 relative">
                <Avatar className="h-20 w-20 lg:h-24 lg:w-24 border-4 border-primary/20">
                  <AvatarImage src={currentTestimonial.avatarUrl || ''} alt={currentTestimonial.customerName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                    {currentTestimonial.customerName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {currentTestimonial.verificationBadge && (
                  <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-1.5 rounded-full">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 text-center lg:text-left">
                <Quote className="h-8 w-8 text-primary/30 mb-4 mx-auto lg:mx-0" />
                <blockquote className="text-lg lg:text-xl text-foreground/90 mb-6 leading-relaxed">
                  "{currentTestimonial.quote}"
                </blockquote>
                
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div>
                    <div className="font-semibold text-foreground">{currentTestimonial.customerName}</div>
                    <div className="text-muted-foreground">{currentTestimonial.title}</div>
                    <div className="flex items-center justify-center lg:justify-start mt-2 space-x-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{currentTestimonial.company}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center lg:items-end space-y-2">
                    {currentTestimonial.industry && (
                      <Badge variant="secondary" className="capitalize">
                        {currentTestimonial.industry}
                      </Badge>
                    )}
                    {currentTestimonial.companySize && (
                      <Badge variant="outline" className="capitalize">
                        {currentTestimonial.companySize}
                      </Badge>
                    )}
                    {currentTestimonial.verificationBadge && (
                      <div className="flex items-center space-x-1 text-xs text-primary">
                        <Award className="h-3 w-3" />
                        <span>Verified</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        {showNavigation && testimonials.length > 1 && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-background/80 backdrop-blur-sm"
              onClick={prevTestimonial}
              data-testid="testimonial-prev-button"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-background/80 backdrop-blur-sm"
              onClick={nextTestimonial}
              data-testid="testimonial-next-button"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Indicators */}
      {showIndicators && testimonials.length > 1 && (
        <div className="flex justify-center space-x-2" data-testid="testimonial-indicators">
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={`h-3 w-3 rounded-full transition-all ${
                index === currentIndex ? 'bg-primary' : 'bg-muted hover:bg-muted-foreground/50'
              }`}
              onClick={() => goToTestimonial(index)}
              data-testid={`testimonial-indicator-${index}`}
            />
          ))}
        </div>
      )}

      {/* Additional testimonials grid */}
      {testimonials.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials
            .filter((_, index) => index !== currentIndex)
            .slice(0, 3)
            .map((testimonial, index) => (
            <Card 
              key={testimonial.id}
              className="hover:shadow-md transition-all duration-300 cursor-pointer"
              onClick={() => handleTestimonialClick(testimonial)}
              data-testid={`testimonial-card-${testimonial.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={testimonial.avatarUrl || ''} alt={testimonial.customerName} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {testimonial.customerName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm">{testimonial.customerName}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.title}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.company}</div>
                  </div>
                </div>
                <blockquote className="text-sm text-foreground/90 line-clamp-3">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex justify-between items-center mt-4">
                  {testimonial.industry && (
                    <Badge variant="secondary" className="text-xs capitalize">
                      {testimonial.industry}
                    </Badge>
                  )}
                  {testimonial.verificationBadge && (
                    <div className="flex items-center space-x-1 text-xs text-primary">
                      <CheckCircle className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}