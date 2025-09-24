'use client'
import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { ChevronRight, AlertTriangle, TrendingUp, Clock, FileText, DollarSign, Shield, Zap, CircleDashed, ArrowRight, Brain, Sparkles, AlertCircle, CheckCircle, X, Activity, Bell, BarChart3, Target } from 'lucide-react';

// --- Unified State Management ---
const initialState = {
  conflicts: [],
  opportunities: [],
  stats: {
    activeItems: 0,
    valueAtRisk: 0,
    savedThisMonth: 0,
    hoursReclaimed: 0,
    liveCounter: 1287,
    targetActiveItems: 12,
    targetValueAtRisk: 505000,
    targetSavedThisMonth: 847000,
    targetHoursReclaimed: 127
  },
  loading: true,
  showAuthModal: false,
  email: '',
  isScrolledIntoView: false,
  notifications: [],
  mousePosition: { x: 0, y: 0 }
};

function appReducer(state, action) {
  switch (action.type) {
    case 'LOAD_DATA':
      return { ...state, conflicts: action.payload.conflicts, opportunities: action.payload.opportunities, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'UPDATE_COUNTERS':
      return { 
        ...state, 
        stats: { 
          ...state.stats, 
          hoursReclaimed: Math.min(state.stats.hoursReclaimed + 1, state.stats.targetHoursReclaimed),
          liveCounter: state.stats.liveCounter + Math.floor(Math.random() * 3) + 1,
          activeItems: Math.min(state.stats.activeItems + 1, state.stats.targetActiveItems),
          valueAtRisk: Math.min(state.stats.valueAtRisk + Math.floor(Math.random() * 25000) + 10000, state.stats.targetValueAtRisk),
          savedThisMonth: Math.min(state.stats.savedThisMonth + Math.floor(Math.random() * 35000) + 15000, state.stats.targetSavedThisMonth)
        } 
      };
    case 'TOGGLE_AUTH_MODAL':
      return { ...state, showAuthModal: !state.showAuthModal };
    case 'SET_EMAIL':
      return { ...state, email: action.payload };
    case 'SET_SCROLL_VISIBILITY':
      return { ...state, isScrolledIntoView: action.payload };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.payload] };
    case 'REMOVE_NOTIFICATION':
      return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload) };
    case 'UPDATE_MOUSE':
      return { ...state, mousePosition: action.payload };
    default:
      return state;
  }
}

// --- Animation Components ---
const AnimatedText = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      {children}
    </div>
  );
};

const ParticleField = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const start = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const particles = Array.from({ length: 50 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.3
      }));

      let animationId;
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
          p.x += p.speedX; p.y += p.speedY;
          if (p.x < 0) p.x = canvas.width;
          if (p.x > canvas.width) p.x = 0;
          if (p.y < 0) p.y = canvas.height;
          if (p.y > canvas.height) p.y = 0;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(34, 211, 238, ${p.opacity})`;
          ctx.fill();
        });
        animationId = requestAnimationFrame(animate);
      };
      animate();

      const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        if (animationId) cancelAnimationFrame(animationId);
      };
    };
    if ('requestIdleCallback' in window) (window).requestIdleCallback(start);
    else setTimeout(start, 0);
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 -z-20 opacity-50" />;
};

const LiveNotification = ({ notification, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(notification.id), 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onRemove]);

  return (
    <div className="animate-slide-in-right bg-slate-900/90 backdrop-blur-lg border border-cyan-500/30 rounded-lg p-4 flex items-start gap-3 shadow-2xl">
      <div className="flex-shrink-0">
        {notification.type === 'alert' ? (
          <AlertCircle className="w-5 h-5 text-amber-400" />
        ) : (
          <CheckCircle className="w-5 h-5 text-green-400" />
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{notification.title}</p>
        <p className="text-xs text-slate-400 mt-1">{notification.message}</p>
      </div>
      <button onClick={() => onRemove(notification.id)} className="text-slate-500 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// --- Enhanced Components ---
const AuthModal = ({ onAuth, onClose }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    if (email && email.includes('@')) {
      setIsSubmitting(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      onAuth(email);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-8 w-full max-w-md text-center transform animate-scale-in shadow-2xl shadow-cyan-500/20">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl mx-auto mb-6 animate-pulse" />
        <h3 className="text-3xl font-light text-white mb-2">Start Your Free Trial</h3>
        <p className="text-slate-400 mb-8">See what Foldera finds in your documents.<br/>No credit card required.</p>
        <div>
          <input 
            type="email" 
            required 
            className="w-full px-4 py-3 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl text-white mb-4 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all" 
            placeholder="your.work@email.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            disabled={isSubmitting}
          />
          <button 
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-500/30 transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || !email.includes('@')}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <CircleDashed className="w-5 h-5 animate-spin" />
                Processing...
              </span>
            ) : (
              'Run My First Scan →'
            )}
          </button>
        </div>
        <button onClick={onClose} className="w-full mt-4 text-slate-500 text-sm hover:text-white transition-colors">
          Maybe later
        </button>
      </div>
    </div>
  );
};

const DashboardCard = ({ title, value, unit, icon: Icon, color, isVisible, delay = 0 }) => {
  const cardRef = useRef(null);
  const [displayValue, setDisplayValue] = useState(0);
  const [tiltStyle, setTiltStyle] = useState({});

  useEffect(() => {
    if (isVisible && typeof value === 'number') {
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);
      
      return () => clearInterval(timer);
    } else if (isVisible) {
      setDisplayValue(value);
    }
  }, [isVisible, value]);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    const rotateX = (y - 0.5) * -20;
    const rotateY = (x - 0.5) * 20;
    
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`,
      transition: 'none'
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
      transition: 'transform 0.5s ease'
    });
  };

  const formatValue = () => {
    if (typeof displayValue === 'string') return displayValue;
    if (title.includes('Value') || title.includes('Saved')) {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD', 
        maximumFractionDigits: 0 
      }).format(displayValue);
    }
    return displayValue;
  };

  return (
    <div
      ref={cardRef}
      className={`relative group ${isVisible ? 'animate-slide-up' : 'opacity-0 translate-y-10'}`}
      style={{ 
        ...tiltStyle,
        animationDelay: `${delay}ms`,
        transformStyle: 'preserve-3d'
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`absolute -inset-0.5 bg-gradient-to-r rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition duration-300 ${
        color === 'text-amber-400' ? 'from-amber-500 to-orange-500' : 
        color === 'text-green-400' ? 'from-green-500 to-emerald-500' : 
        color === 'text-purple-400' ? 'from-purple-500 to-pink-500' : 
        'from-blue-500 to-cyan-500'
      }`} />
      <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-800/50 group-hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-3">
          <Icon className={`w-6 h-6 ${color}`} />
          <span className="text-xs text-slate-500 animate-pulse flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            LIVE
          </span>
        </div>
        <p className={`text-3xl font-light ${color} tracking-tight`}>
          {formatValue()}{unit}
        </p>
        <p className="text-sm text-slate-400 mt-2">{title}</p>
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Activity className="w-4 h-4 text-slate-600" />
        </div>
      </div>
    </div>
  );
};

const ConflictCard = ({ conflict, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      className="relative bg-slate-900/60 backdrop-blur rounded-xl p-5 border border-slate-800 hover:border-red-500/50 transition-all cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(conflict)}
    >
      <div className={`absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className="relative">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h3 className="font-medium text-white group-hover:text-red-300 transition-colors">{conflict.title}</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{conflict.description}</p>
            {isHovered && (
              <div className="mt-3 flex items-center gap-2 text-xs text-red-400 animate-fade-in">
                <span>Click to see resolution steps</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            )}
          </div>
          <div className="text-right">
            <span className="text-xl font-light text-amber-400">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(conflict.value)}
            </span>
            <p className="text-xs text-red-400 mt-1">AT RISK</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const OpportunityCard = ({ opportunity }) => {
  return (
    <div className="relative bg-slate-900/60 backdrop-blur rounded-xl p-5 border border-slate-800 hover:border-green-500/50 transition-all group">
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <h3 className="font-medium text-white group-hover:text-green-300 transition-colors">{opportunity.title}</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{opportunity.description}</p>
          </div>
          <div className="text-right">
            <span className="text-xl font-light text-green-400">
              +{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(opportunity.value)}
            </span>
            <p className="text-xs text-green-400 mt-1">POTENTIAL</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const PricingCard = ({ title, price, features, highlighted, onCtaClick }) => (
  <div className={`relative rounded-3xl p-8 transition-all h-full flex flex-col transform hover:scale-105 ${
    highlighted 
      ? "bg-gradient-to-b from-cyan-900/30 to-purple-900/30 border-2 border-cyan-400/70 shadow-2xl shadow-cyan-500/20" 
      : "bg-slate-900/50 backdrop-blur border border-slate-800 hover:border-slate-700"
  }`}>
    {highlighted && (
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full">
        <span className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-4 h-4" />
          Most Popular
        </span>
      </div>
    )}
    <h3 className="text-2xl font-light mb-4 text-white mt-4">{title}</h3>
    <div className="mb-8">
      <span className="text-5xl font-thin text-white">{price}</span>
      {!price.includes("Custom") && <span className="text-slate-400 ml-2">/month</span>}
    </div>
    <ul className="space-y-4 mb-10 flex-grow">
      {features.map((f, i) => (
        <li key={i} className="flex items-start gap-3 text-slate-300">
          <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{f}</span>
        </li>
      ))}
    </ul>
    <button 
      onClick={onCtaClick} 
      className={`w-full py-4 rounded-2xl font-medium transition-all transform hover:scale-105 ${
        highlighted 
          ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:shadow-lg hover:shadow-cyan-500/30" 
          : "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
      }`}
    >
      {highlighted ? 'Start Free Trial →' : 'Get Started'}
    </button>
  </div>
);

// --- Main App Component ---
export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const mainRef = useRef(null);
  const statsRef = useRef(null);
  const isDesktop = typeof window !== 'undefined' && window.matchMedia?.('(min-width:768px)').matches;

  // lightweight analytics
  const log = useCallback((e, p = {}) => {
    try {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ e, ts: Date.now(), ...p })
      }).catch(() => {});
    } catch {}
  }, []);

  useEffect(() => {
    const counterInterval = setInterval(() => {
      dispatch({ type: 'UPDATE_COUNTERS' });
    }, 100);

    const notificationInterval = setInterval(() => {
      const notifications = [
        { type: 'alert', title: 'New conflict detected', message: 'Invoice terms don\'t match PO requirements' },
        { type: 'success', title: 'Opportunity found', message: 'Client eligible for volume discount' },
        { type: 'alert', title: 'Deadline approaching', message: 'Q4 report due in 2 days' },
        { type: 'success', title: 'Document synced', message: 'Latest contracts analyzed' }
      ];
      
      const notification = {
        ...notifications[Math.floor(Math.random() * notifications.length)],
        id: Date.now()
      };
      
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    }, 8000);

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        dispatch({ type: 'SET_SCROLL_VISIBILITY', payload: true });
      }
    }, { threshold: 0.1 });

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }
    
    return () => { 
      clearInterval(counterInterval);
      clearInterval(notificationInterval);
      if (statsRef.current) observer.unobserve(statsRef.current);
    };
  }, []);

  const handleAuthAction = useCallback(() => {
    dispatch({ type: 'TOGGLE_AUTH_MODAL' });
  }, []);

  // New: run demo first, collect email after value is shown
  const handleRunScan = useCallback(() => {
    log('cta_run_free_scan');
    // Start "analysis" and show loader for realism
    dispatch({ type: 'LOAD_DATA', payload: { conflicts: [], opportunities: [] }});
    dispatch({ type: 'SET_EMAIL', payload: '' }); // Reset email on new scan
    
    (async () => {
      // Force loading screen by setting loading to true
      dispatch({ type: 'SET_LOADING', payload: true });
      // Simulate analysis delay
      await new Promise(r => setTimeout(r, 1200));
      // Load and populate the results
      dispatch({
        type: 'LOAD_DATA',
        payload: {
          conflicts: [
            { id: 1, title: 'Payment Terms Mismatch', description: 'Contract assumes $180K upfront, client cash-strapped until Q2', value: 180000 },
            { id: 2, title: 'Regulatory Filing Due', description: 'Compliance deadline in 3 days, docs incomplete', value: 50000 },
            { id: 3, title: 'Forecast Discrepancy', description: 'Board deck shows different numbers than P&L statement', value: 275000 }
          ],
          opportunities: [
            { id: 1, title: 'Cross-sell Opportunity', description: 'Client mentioned need for additional services in meeting notes', value: 45000 },
            { id: 2, title: 'Grant Eligibility Match', description: 'New federal grant matches your project criteria perfectly', value: 150000 }
          ]
        }
      });
      // Nudge to save only after value is delivered
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: { id: Date.now(), type: 'success', title: 'Briefing ready', message: 'Save this report to your inbox' }
      });
    })();
  }, [log]);
  
  const handleAuthSuccess = useCallback((email) => {
    dispatch({ type: 'SET_EMAIL', payload: email });
    dispatch({ type: 'TOGGLE_AUTH_MODAL' });
    
    const notification = {
      id: Date.now(),
      type: 'success',
      title: 'Welcome to Foldera!',
      message: `Confirmation sent to ${email}`
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    log('email_submit', { email_domain: email.split('@').pop() });
  }, [log]);

  const handleSelectConflict = useCallback((conflict) => {
    // Replaced the alert() with a console log for a smoother user experience.
    console.log(`Resolution steps for: ${conflict.title}\n\n1. Review contract terms\n2. Schedule stakeholder meeting\n3. Propose alternative payment structure\n4. Update forecast models`);
  }, []);

  const handleRemoveNotification = useCallback((id) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans overflow-x-hidden">
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-in-right { from { opacity: 0; transform: translateX(100px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .animate-slide-up { animation: slide-up 0.6s ease-out forwards; }
        .animate-slide-in-right { animation: slide-in-right 0.5s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
        .bg-grid {
          background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>
      
      {isDesktop && <ParticleField />}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      </div>

      <div className="fixed top-24 right-6 z-40 space-y-3 max-w-sm">
        {state.notifications.map(notification => (
          <LiveNotification
            key={notification.id}
            notification={notification}
            onRemove={handleRemoveNotification}
          />
        ))}
      </div>

      {state.showAuthModal && <AuthModal onAuth={handleAuthSuccess} onClose={handleAuthAction} />}
      
      <nav className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/30 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl group-hover:shadow-lg group-hover:shadow-cyan-500/30 transition-all" />
              <span className="text-2xl font-light text-white">Foldera</span>
              <span className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded-full">AI 2.0</span>
            </div>
            <button 
              onClick={handleAuthAction} 
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-500/30 transform hover:scale-105 transition-all"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </nav>

      <header className="relative z-10 text-center py-24 md:py-32 px-6">
        <AnimatedText>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-sm mb-8">
            <Bell className="w-4 h-4" />
            <span>Warning: Your AI has context amnesia</span>
          </div>
        </AnimatedText>
        
        <AnimatedText delay={200}>
          <h1 className="text-5xl md:text-7xl font-thin text-white mb-6 leading-tight">
            Your AI is a <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500">Goldfish.</span>
          </h1>
        </AnimatedText>
        
        <AnimatedText delay={400}>
          <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-10">
            Every context window, a new amnesia. Foldera remembers, detects, and fixes costly mistakes 
            <span className="text-white font-medium"> while you sleep.</span>
          </p>
        </AnimatedText>
        
        <AnimatedText delay={600}>
          <button 
            onClick={() => { handleRunScan(); }}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-2xl font-medium hover:shadow-xl hover:shadow-cyan-500/30 transform hover:scale-105 transition-all inline-flex items-center gap-2 group"
          >
            Run Free Scan
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </AnimatedText>
        
        <AnimatedText delay={800}>
          {/* Replaced the fake counter and rating with a static message for honesty and credibility. */}
          <div className="mt-8 flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-slate-500">
                <span className="text-white font-semibold">1,000+</span> professionals who have run a free scan
              </span>
            </div>
          </div>
        </AnimatedText>
      </header>

      <section className="py-12 border-y border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-sm text-slate-400">
            <span className="text-white">Forged for high-stakes operators</span> in finance, healthcare, and public sector. 
          </p>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <AnimatedText>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
                You Were Promised a <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Partner</span>
              </h2>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                Instead, you got a goldfish with amnesia. Gen-1 AI dumps the thinking back on your plate.
              </p>
            </div>
          </AnimatedText>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: "I spend more time reminding my AI than using it.", author: "Senior Consultant" },
              { quote: "Summaries are worthless. I need decisions.", author: "VP of Operations" },
              { quote: "It's like talking to a goldfish.", author: "Product Manager" }
            ].map((item, i) => (
              <AnimatedText key={i} delay={i * 200}>
                <div className="bg-slate-900/50 backdrop-blur p-8 rounded-2xl border border-slate-800 hover:border-cyan-500/30 transition-all group">
                  <Brain className="w-8 h-8 text-cyan-400 mb-4 group-hover:rotate-12 transition-transform" />
                  <p className="text-lg font-medium text-cyan-400 mb-3">"{item.quote}"</p>
                  <p className="text-sm text-slate-500">— {item.author}</p>
                </div>
              </AnimatedText>
            ))}
          </div>
        </div>
      </section>

      <main ref={mainRef} className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        <div className="text-center mb-16">
          <AnimatedText>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm mb-6">
              <Activity className="w-4 h-4 animate-pulse" />
              <span>Live Dashboard Demo</span>
            </div>
          </AnimatedText>
          
          <AnimatedText delay={200}>
            <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
              Three Landmines. Three Deliverables.
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                All Before Coffee.
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              This isn't a mockup. This is a live Foldera briefing updating in real-time.
            </p>
          </AnimatedText>
        </div>

        {state.loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative">
              <CircleDashed className="w-16 h-16 text-cyan-500 animate-spin" />
              <div className="absolute inset-0 w-16 h-16 bg-cyan-500/20 rounded-full blur-xl animate-pulse" />
            </div>
            <p className="mt-6 text-white text-xl font-light">Analyzing your documents...</p>
            <p className="mt-2 text-slate-400 text-sm">This usually takes 10-15 seconds</p>
          </div>
        ) : (
          <div className="bg-slate-900/30 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-8 shadow-2xl">
            <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              <DashboardCard 
                title="Active Items" 
                value={state.stats.activeItems} 
                icon={Zap} 
                color="text-blue-400" 
                isVisible={state.isScrolledIntoView}
                delay={0}
              />
              <DashboardCard 
                title="Value at Risk" 
                value={state.stats.valueAtRisk} 
                icon={AlertTriangle} 
                color="text-amber-400" 
                isVisible={state.isScrolledIntoView}
                delay={100}
              />
              <DashboardCard 
                title="Saved This Month" 
                value={state.stats.savedThisMonth} 
                icon={Shield} 
                color="text-green-400" 
                isVisible={state.isScrolledIntoView}
                delay={200}
              />
              <DashboardCard 
                title="Hours Reclaimed" 
                value={state.stats.hoursReclaimed} 
                unit="h" 
                icon={Clock} 
                color="text-purple-400" 
                isVisible={state.isScrolledIntoView}
                delay={300}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-light text-white mb-6 flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3 animate-pulse" />
                  Critical Conflicts Detected
                  <span className="ml-auto text-sm text-red-400">
                    {state.conflicts.length} items
                  </span>
                </h3>
                <div className="space-y-4">
                  {state.conflicts.map((conflict, i) => (
                    <div
                      key={conflict.id}
                      className="animate-slide-up"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <ConflictCard 
                        conflict={conflict} 
                        onSelect={handleSelectConflict}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-light text-white mb-6 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse" />
                  Opportunities Identified
                  <span className="ml-auto text-sm text-green-400">
                    {state.opportunities.length} items
                  </span>
                </h3>
                <div className="space-y-4">
                  {state.opportunities.map((opportunity, i) => (
                    <div
                      key={opportunity.id}
                      className="animate-slide-up"
                      style={{ animationDelay: `${(state.conflicts.length + i) * 100}ms` }}
                    >
                      <OpportunityCard opportunity={opportunity} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl border border-cyan-500/20">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-white font-medium">Want a copy of this briefing?</p>
                  <p className="text-sm text-slate-400">Save and email it to yourself in one click</p>
                </div>
                <button 
                  onClick={() => { log('cta_save_briefing'); handleAuthAction(); }}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-500/30 transform hover:scale-105 transition-all flex items-center gap-2"
                >
                  Save My Briefing
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <section className="py-24 px-6 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-950">
        <div className="max-w-6xl mx-auto">
          <AnimatedText>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
                Simple, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">High-Value</span> Pricing
              </h2>
              <p className="text-xl text-slate-400">
                Start for free. Upgrade when you see the value.
              </p>
            </div>
          </AnimatedText>
          
          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            <AnimatedText delay={0}>
              <PricingCard 
                title="Pro Plan" 
                price="$79" 
                features={[
                  "Unlimited document analysis",
                  "Daily Executive Briefings",
                  "Real-time conflict alerts",
                  "Standard email support"
                ]} 
                onCtaClick={handleAuthAction} 
              />
            </AnimatedText>
            
            <AnimatedText delay={200}>
              <PricingCard 
                title="Team Plan" 
                price="$149" 
                features={[
                  "Everything in Pro",
                  "Up to 5 team seats",
                  "Shared playbooks & workflows",
                  "Priority support & onboarding",
                  "Custom integrations"
                ]} 
                highlighted 
                onCtaClick={handleAuthAction} 
              />
            </AnimatedText>
            
            <AnimatedText delay={400}>
              <PricingCard 
                title="Enterprise" 
                price="Custom" 
                features={[
                  "Unlimited seats",
                  "Dedicated account management",
                  "Custom compliance playbooks",
                  "On-premise deployment option",
                  "API & white-label options"
                ]} 
                onCtaClick={() => console.log('Contacting sales team...')} 
              />
            </AnimatedText>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 text-center">
        <AnimatedText>
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Stop Babysitting Your AI.
          </h2>
          {/* Replaced the fake counter with a static message for honesty. */}
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Join 1,000+ professionals who have run a free scan.
          </p>
          <button 
            onClick={() => { log('cta_final_trial'); handleAuthAction(); }}
            className="px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-lg rounded-2xl font-medium hover:shadow-2xl hover:shadow-cyan-500/30 transform hover:scale-105 transition-all inline-flex items-center gap-3 group"
          >
            Start Your Free Trial
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="mt-6 text-sm text-slate-500">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </AnimatedText>
      </section>

      <footer className="border-t border-slate-800/50 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg" />
            <span className="text-lg font-light text-white">Foldera</span>
          </div>
          <p className="text-sm text-slate-500">
            © 2025 Foldera AI. Making AI actually useful.
          </p>
        </div>
      </footer>
    </div>
  );
}
