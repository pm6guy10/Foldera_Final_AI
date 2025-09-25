'use client';

import React, { useState, useEffect, useReducer, useRef, useCallback, createContext, useContext } from 'react';
import { ChevronRight, AlertTriangle, TrendingUp, Clock, FileText, DollarSign, Shield, Zap, CircleDashed, ArrowRight, Brain, Sparkles, AlertCircle, CheckCircle, X, Activity, Bell, BarChart3, Target } from 'lucide-react';

// ===================================================================================
// --- CONSTANTS ---
// ===================================================================================
const PRICING_PLANS = [
  {
    title: "Pro Plan",
    price: "$79",
    features: [
      "Unlimited document analysis",
      "Daily Executive Briefings",
      "Real-time conflict alerts",
      "Standard email support"
    ],
    highlighted: false,
  },
  {
    title: "Team Plan",
    price: "$149",
    features: [
      "Everything in Pro",
      "Up to 5 team seats",
      "Shared playbooks & workflows",
      "Priority support & onboarding",
      "Custom integrations"
    ],
    highlighted: true,
  },
  {
    title: "Enterprise",
    price: "Custom",
    features: [
      "Unlimited seats",
      "Dedicated account management",
      "Custom compliance playbooks",
      "On-premise deployment option",
      "API & white-label options"
    ],
    highlighted: false,
  }
];

// ===================================================================================
// --- HOOKS ---
// ===================================================================================
function useInterval(callback, delay) {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

// ===================================================================================
// --- CONTEXT ---
// ===================================================================================
const AppContext = createContext(null);

const initialState = {
  stats: { liveCounter: 1287 },
  loading: false,
  demoHasRun: false,
  showAuthModal: false,
  email: '',
  notifications: [],
};

function appReducer(state, action) {
  switch (action.type) {
    case 'START_DEMO':
      return { ...state, loading: true, demoHasRun: false };
    case 'SHOW_DEMO_RESULT':
      return { ...state, loading: false, demoHasRun: true };
    case 'UPDATE_LIVE_COUNTER':
      return { ...state, stats: { ...state.stats, liveCounter: state.stats.liveCounter + Math.floor(Math.random() * 3) + 1 } };
    case 'TOGGLE_AUTH_MODAL':
      return { ...state, showAuthModal: !state.showAuthModal };
    case 'CLOSE_MODALS':
      return { ...state, showAuthModal: false };
    case 'SET_EMAIL':
      return { ...state, email: action.payload };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications] };
    case 'REMOVE_NOTIFICATION':
      return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload) };
    default:
      return state;
  }
}

const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const handleRemoveNotification = useCallback((id) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, []);

  const value = { state, dispatch, handleRemoveNotification };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// ===================================================================================
// --- UI COMPONENTS ---
// ===================================================================================
const AnimatedText = React.memo(({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setTimeout(() => setIsVisible(true), delay);
        if (ref.current) observer.unobserve(ref.current);
      }
    }, { threshold: 0.1 });

    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current) };
  }, [delay]);

  return <div ref={ref} className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>{children}</div>;
});

const ParticleField = React.memo(() => {
    const canvasRef = useRef(null);

    useEffect(() => {
        let animationFrameId;
        const startParticles = () => {
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

            const animate = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                particles.forEach(p => {
                    p.x += p.speedX; p.y += p.speedY;
                    if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
                    if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(34, 211, 238, ${p.opacity})`;
                    ctx.fill();
                });
                animationFrameId = requestAnimationFrame(animate);
            };
            animate();
        };

        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };

        if ('requestIdleCallback' in window) {
            requestIdleCallback(startParticles);
        } else {
            setTimeout(startParticles, 200);
        }

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className="fixed inset-0 -z-20 opacity-50" />;
});

const LiveNotification = React.memo(({ notification, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(notification.id), 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onRemove]);

  return (
    <div className="animate-slide-in-right bg-slate-900/90 backdrop-blur-lg border border-cyan-500/30 rounded-lg p-4 flex items-start gap-3 shadow-2xl">
      <div className="flex-shrink-0"><CheckCircle className="w-5 h-5 text-green-400" /></div>
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{notification.title}</p>
        <p className="text-xs text-slate-400 mt-1">{notification.message}</p>
      </div>
      <button onClick={() => onRemove(notification.id)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
    </div>
  );
});

const AuthModal = ({ onAuth, onClose }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
        <h3 className="text-3xl font-light text-white mb-2">Save Your Briefing</h3>
        <p className="text-slate-400 mb-8">Enter your email to get a copy of this report.<br/>We'll also start your free trial.</p>
        <div>
          <input type="email" required className="w-full px-4 py-3 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl text-white mb-4 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all" placeholder="your.work@email.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSubmit()} disabled={isSubmitting} />
          <button onClick={handleSubmit} className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-500/30 transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed" disabled={isSubmitting || !email.includes('@')}>
            {isSubmitting ? (<span className="flex items-center justify-center gap-2"><CircleDashed className="w-5 h-5 animate-spin" />Processing...</span>) : ('Save & Start Trial →')}
          </button>
        </div>
        <button onClick={onClose} className="w-full mt-4 text-slate-500 text-sm hover:text-white transition-colors">Maybe later</button>
      </div>
    </div>
  );
};

const PricingCard = React.memo(({ title, price, features, highlighted, onCtaClick }) => (
    <div className={`relative rounded-3xl p-8 transition-all h-full flex flex-col transform hover:scale-105 ${highlighted ? "bg-gradient-to-b from-cyan-900/30 to-purple-900/30 border-2 border-cyan-400/70 shadow-2xl shadow-cyan-500/20" : "bg-slate-900/50 backdrop-blur border border-slate-800 hover:border-slate-700"}`}>
        {highlighted && (<div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"><span className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-1"><Sparkles className="w-4 h-4" />Most Popular</span></div>)}
        <div className={highlighted ? "pt-8" : ""}><h3 className="text-2xl font-light mb-4 text-white">{title}</h3><div className="mb-8"><span className="text-5xl font-thin text-white">{price}</span>{!price.includes("Custom") && <span className="text-slate-400 ml-2">/month</span>}</div></div>
        <ul className="space-y-4 mb-10 flex-grow">{features.map((f, i) => (<li key={i} className="flex items-start gap-3 text-slate-300"><CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" /><span className="text-sm">{f}</span></li>))}</ul>
        <button onClick={onCtaClick} className={`w-full py-4 rounded-2xl font-medium transition-all transform hover:scale-105 ${highlighted ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:shadow-lg hover:shadow-cyan-500/30" : "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"}`}>{highlighted ? 'Start Free Trial →' : 'Get Started'}</button>
    </div>
));

// ===================================================================================
// --- SECTIONS ---
// ===================================================================================
const Header = ({ onCtaClick }) => (
    <header className="relative z-10 text-center py-24 md:py-32 px-6">
        <AnimatedText><div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-sm mb-8"><Bell className="w-4 h-4" /><span>Warning: Your AI has context amnesia</span></div></AnimatedText>
        <AnimatedText delay={200}><h1 className="text-5xl md:text-7xl font-thin text-white mb-6 leading-tight">Your AI is a <span style={{ animation: 'unstable-text 4s ease-in-out infinite' }} className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500">Goldfish.</span></h1></AnimatedText>
        <AnimatedText delay={400}><p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-10">Every context window, a new amnesia. Foldera remembers, detects, and fixes costly mistakes <span className="text-white font-medium"> while you sleep.</span></p></AnimatedText>
        <AnimatedText delay={600}><button onClick={onCtaClick} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-2xl font-medium hover:shadow-xl hover:shadow-cyan-500/30 transform hover:scale-105 transition-all inline-flex items-center gap-2 group">Run Free Scan <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></button></AnimatedText>
        <AnimatedText delay={800}><div className="mt-8 flex items-center justify-center gap-8 text-sm"><div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /><span>Join <span className="text-white font-semibold">1,000+</span> professionals who have run a free scan</span></div></div></AnimatedText>
    </header>
);

const GeneratedReport = ({ onCtaClick }) => (
    <div className="bg-slate-900/30 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-4 md:p-8 shadow-2xl animate-fade-in">
      <AnimatedText>
        <img 
          src="https://storage.googleapis.com/gemini-prod-us-central1-cbf209c8-uploads/file-YJhSCGZe9QDHWtc7j9Zkbw-b2664355-2479-40af-91f3-c6bc0e9c8cc6.jpg" 
          alt="Foldera Executive Briefing Example"
          className="rounded-xl shadow-2xl shadow-cyan-500/10 w-full"
        />
      </AnimatedText>
      <AnimatedText delay={200}>
        <div className="mt-8 p-6 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl border border-cyan-500/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-white font-medium">Want a copy of this briefing?</p>
              <p className="text-sm text-slate-400">Save it to your email and start your free trial.</p>
            </div>
            <button 
              onClick={onCtaClick}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-500/30 transform hover:scale-105 transition-all flex items-center gap-2"
            >
              Save My Briefing
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </AnimatedText>
    </div>
);

const DemoSection = ({ loading, demoHasRun, onAuthAction }) => (
    <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
            <AnimatedText><div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm mb-6"><Activity className="w-4 h-4 animate-pulse" /><span>Live Dashboard Demo</span></div></AnimatedText>
            <AnimatedText delay={200}><h2 className="text-4xl md:text-5xl font-light text-white mb-6">This is Your New Executive Briefing.<span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Generated in Seconds.</span></h2><p className="text-xl text-slate-400 max-w-2xl mx-auto">This is a high-fidelity example of the report Foldera generates for you daily.</p></AnimatedText>
        </div>

        {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh]"><div className="relative"><CircleDashed className="w-16 h-16 text-cyan-500 animate-spin" /><div className="absolute inset-0 w-16 h-16 bg-cyan-500/20 rounded-full blur-xl animate-pulse" /></div><p className="mt-6 text-white text-xl font-light">Analyzing documents...</p><p className="mt-2 text-slate-400 text-sm">This is a demo simulation</p></div>
        ) : !demoHasRun ? (
            <div className="text-center min-h-[50vh] flex flex-col items-center justify-center"><div className="w-24 h-24 bg-slate-800/50 rounded-3xl flex items-center justify-center mb-6 border border-slate-700"><Target className="w-12 h-12 text-cyan-400" /></div><p className="text-2xl text-white font-light mb-4">Your dashboard is ready.</p><p className="text-slate-400 mb-8">Click "Run Free Scan" above to start the live demo.</p></div>
        ) : (
            <GeneratedReport onCtaClick={onAuthAction} />
        )}
    </section>
);

const PricingSection = ({ onCtaClick }) => (
    <section className="py-24 px-6 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-950">
        <div className="max-w-6xl mx-auto">
            <AnimatedText><div className="text-center mb-16"><h2 className="text-4xl md:text-5xl font-light text-white mb-4">Simple, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">High-Value</span> Pricing</h2><p className="text-xl text-slate-400">Start for free. Upgrade when you see the value.</p></div></AnimatedText>
            <div className="grid md:grid-cols-3 gap-8 items-stretch">
                {PRICING_PLANS.map((plan, i) => (
                    <AnimatedText delay={i * 200} key={plan.title}>
                        <PricingCard {...plan} onCtaClick={onCtaClick} />
                    </AnimatedText>
                ))}
            </div>
        </div>
    </section>
);

const FinalCTA = ({ onCtaClick, liveCounter }) => (
    <section className="py-24 px-6 text-center">
        <AnimatedText>
            <h2 className="text-4xl md:text-5xl font-light text-white mb-6">Stop Babysitting Your AI.</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">Join {liveCounter.toLocaleString()} professionals who've upgraded to AI that actually works.</p>
            <button onClick={onCtaClick} className="px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-lg rounded-2xl font-medium hover:shadow-2xl hover:shadow-cyan-500/30 transform hover:scale-105 transition-all inline-flex items-center gap-3 group">Start Your Free Trial <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" /></button>
            <p className="mt-6 text-sm text-slate-500">No credit card required • 14-day free trial • Cancel anytime</p>
        </AnimatedText>
    </section>
);

const Footer = () => (
    <footer className="border-t border-slate-800/50 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3"><div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg" /><span className="text-lg font-light text-white">Foldera</span></div>
            <p className="text-sm text-slate-500">© 2025 Foldera AI. Making AI actually useful.</p>
        </div>
    </footer>
);

// ===================================================================================
// --- MAIN APP ---
// ===================================================================================
const LandingPageContent = () => {
  const { state, dispatch, handleRemoveNotification } = useAppContext();

  useInterval(() => {
    dispatch({ type: 'UPDATE_LIVE_COUNTER' });
  }, 5000);

  const handleStartDemo = useCallback(() => {
    dispatch({ type: 'START_DEMO' });
    
    // Simulate demo loading
    setTimeout(() => {
      dispatch({ type: 'SHOW_DEMO_RESULT' });
      
      // Add success notification
      const notification = {
        id: Date.now(),
        title: 'Analysis Complete!',
        message: 'Found 3 critical conflicts in your documents'
      };
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    }, 3000);
  }, [dispatch]);

  const handleAuthAction = useCallback(() => {
    dispatch({ type: 'TOGGLE_AUTH_MODAL' });
  }, [dispatch]);

  const handleAuth = useCallback((email) => {
    dispatch({ type: 'SET_EMAIL', payload: email });
    dispatch({ type: 'CLOSE_MODALS' });
    
    // Add success notification
    const notification = {
      id: Date.now(),
      title: 'Welcome to Foldera!',
      message: 'Your free trial has started. Check your email for next steps.'
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  }, [dispatch]);

  const handleCloseModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODALS' });
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      <ParticleField />
      
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-4 max-w-sm">
        {state.notifications.map((notification) => (
          <LiveNotification 
            key={notification.id} 
            notification={notification} 
            onRemove={handleRemoveNotification} 
          />
        ))}
      </div>

      {/* Main Content */}
      <Header onCtaClick={handleStartDemo} />
      <DemoSection 
        loading={state.loading} 
        demoHasRun={state.demoHasRun} 
        onAuthAction={handleAuthAction} 
      />
      <PricingSection onCtaClick={handleAuthAction} />
      <FinalCTA onCtaClick={handleAuthAction} liveCounter={state.stats.liveCounter} />
      <Footer />

      {/* Auth Modal */}
      {state.showAuthModal && (
        <AuthModal onAuth={handleAuth} onClose={handleCloseModal} />
      )}
    </div>
  );
};

// Main export
export default function HomePage() {
  return (
    <AppProvider>
      <LandingPageContent />
    </AppProvider>
  );
}
