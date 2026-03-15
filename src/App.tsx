import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Zap, 
  Target, 
  ArrowRight, 
  Globe, 
  Sparkles, 
  CheckCircle2,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  ChevronRight,
  Loader2,
  Search,
  Mail
} from 'lucide-react';
import { cn } from './lib/utils';
import { analyzeBusiness, BusinessProfile } from './services/gemini';
import ChatWidget from './components/ChatWidget';
import { LeadsPage } from './components/LeadsPage';
import { OfferPage } from './components/OfferPage';
import { UnsubscribePage } from './components/UnsubscribePage';
import { DemoPage } from './components/DemoPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'leads' | 'demo' | 'unsubscribe'>('home');
  const [demoLeadId, setDemoLeadId] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [selectedTone, setSelectedTone] = useState('Professional');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/demo/')) {
      const id = path.split('/')[2];
      setDemoLeadId(id);
      setCurrentPage('demo');
    } else if (path === '/unsubscribe') {
      setCurrentPage('unsubscribe');
    }
  }, []);

  const handleStartDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setIsAnalyzing(true);
    try {
      const result = await analyzeBusiness(url, selectedTone);
      setProfile(result);
      setShowDemo(true);
      // Scroll to demo section
      setTimeout(() => {
        document.getElementById('demo-preview')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error("Analysis failed:", error);
      // Fallback or error state
    } finally {
      setIsAnalyzing(false);
    }
  };

  const tones = ['Professional', 'Friendly', 'Formal', 'Luxury', 'Playful', 'Direct'];

  if (currentPage === 'demo' && demoLeadId) {
    return <OfferPage leadId={demoLeadId} />;
  }

  if (currentPage === 'unsubscribe') {
    return <UnsubscribePage />;
  }

  if (currentPage === 'leads') {
    return (
      <>
        <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentPage('home')}>
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Bot className="text-black w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">DemoFlowAI</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
              <button onClick={() => setCurrentPage('home')} className="hover:text-white transition-colors">Home</button>
              <button onClick={() => setCurrentPage('leads')} className="text-white transition-colors flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" />
                Find Leads
              </button>
            </div>
            <button className="px-4 py-2 bg-white text-black text-sm font-bold rounded-full hover:bg-emerald-500 transition-all active:scale-95">
              Get Started
            </button>
          </div>
        </nav>
        <div className="pt-16">
          <LeadsPage />
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentPage('home')}>
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Bot className="text-black w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">DemoFlowAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <button onClick={() => setCurrentPage('home')} className={cn("hover:text-white transition-colors", (currentPage as string) === 'home' && "text-white")}>Home</button>
            <button onClick={() => setCurrentPage('leads')} className={cn("hover:text-white transition-colors flex items-center gap-1.5", (currentPage as string) === 'leads' && "text-white")}>
              <Search className="w-3.5 h-3.5" />
              Find Leads
            </button>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <button 
            onClick={() => setCurrentPage('leads')}
            className="px-4 py-2 bg-white text-black text-sm font-bold rounded-full hover:bg-emerald-500 transition-all active:scale-95"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-emerald-400 mb-6">
              <Sparkles className="w-3 h-3" />
              <span>The Future of AI Agency Sales</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
              Find businesses that need AI. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">
                Sell them yours.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto mb-10 leading-relaxed">
              DemoFlowAI scans the web to find local businesses without AI chatbots, builds a personalised demo link, and automates your outreach — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => setCurrentPage('leads')}
                className="px-10 py-5 bg-emerald-500 text-black font-bold rounded-2xl hover:bg-emerald-400 transition-all active:scale-95 text-lg flex items-center gap-2"
              >
                Start Finding Leads
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mt-12 flex items-center justify-center gap-6 text-sm text-white/40">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Instant Lead Discovery</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-32 px-6 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">How it Works</h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Three simple steps to scaling your AI automation agency.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Search className="w-6 h-6 text-emerald-400" />,
                title: "1. Search",
                desc: "Find businesses in any sector and area with no AI chatbot using our real-time scanning engine."
              },
              {
                icon: <Mail className="w-6 h-6 text-blue-400" />,
                title: "2. Outreach",
                desc: "Send personalised cold emails with a tracked demo link that shows them exactly what they're missing."
              },
              {
                icon: <Zap className="w-6 h-6 text-yellow-400" />,
                title: "3. Convert",
                desc: "Prospects see a live chatbot demo on their own site and can purchase your services directly."
              }
            ].map((step, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-white/40 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Simple Pricing</h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Start for free and upgrade as you scale your agency.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Starter */}
            <div className="p-10 rounded-[40px] bg-white/[0.03] border border-white/5 flex flex-col">
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-white/40">/month</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {[
                  "Up to 10 leads/day",
                  "Manual email outreach",
                  "Basic demo previews",
                  "Standard support"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/60">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => setCurrentPage('leads')}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all"
              >
                Get Started
              </button>
            </div>

            {/* Pro */}
            <div className="p-10 rounded-[40px] bg-emerald-500/10 border border-emerald-500/20 flex flex-col relative overflow-hidden">
              <div className="absolute top-6 right-6 px-3 py-1 bg-emerald-500 text-black text-[10px] font-bold uppercase rounded-full">
                Coming Soon
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">$49</span>
                <span className="text-white/40">/month</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {[
                  "Unlimited leads",
                  "Automated campaigns",
                  "Advanced analytics",
                  "Priority support",
                  "Custom branding"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/60">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button 
                disabled
                className="w-full py-4 bg-emerald-500 text-black font-bold rounded-2xl opacity-50 cursor-not-allowed"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10 mb-12">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Bot className="text-black w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight">DemoFlowAI</span>
            </div>
            <div className="flex gap-8 text-sm text-white/40">
              <button onClick={() => setCurrentPage('home')} className="hover:text-white transition-colors">Home</button>
              <button onClick={() => setCurrentPage('leads')} className="hover:text-white transition-colors">Find Leads</button>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            </div>
          </div>
          <div className="text-center text-sm text-white/20">
            © 2025 DemoFlowAI.com. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
