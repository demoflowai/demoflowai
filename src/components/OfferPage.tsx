import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bot, CheckCircle2, Zap, ShieldCheck, Download, CreditCard, Loader2, Star, Clock, ArrowRight } from 'lucide-react';
import { doc, getDoc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { analyzeBusiness, BusinessProfile } from '../services/gemini';
import ChatWidget from './ChatWidget';

interface OfferPageProps {
  leadId: string;
}

export const OfferPage: React.FC<OfferPageProps> = ({ leadId }) => {
  const [lead, setLead] = useState<any>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60); // 24 hours in seconds

  useEffect(() => {
    const fetchLead = async () => {
      if (!leadId) return;
      try {
        const leadDoc = await getDoc(doc(db, 'leads', leadId));
        if (leadDoc.exists()) {
          const data = leadDoc.data();
          setLead(data);
          
          // Automatically record 'demo_viewed' event
          await updateDoc(doc(db, 'leads', leadId), {
            status: 'demo_viewed',
            lastUpdated: serverTimestamp(),
            statusHistory: arrayUnion({
              status: 'demo_viewed',
              timestamp: new Date().toISOString()
            })
          });

          // Analyze their business to generate the bot
          setIsAnalyzing(true);
          const result = await analyzeBusiness(data.website);
          setProfile(result);
          setIsAnalyzing(false);
        }
      } catch (error) {
        console.error("Error fetching lead:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [leadId]);

  useEffect(() => {
    const STORAGE_KEY = `offer_timer_${leadId}`;
    const now = Date.now();
    const storedStartTime = localStorage.getItem(STORAGE_KEY);
    
    let startTime: number;
    if (storedStartTime) {
      startTime = parseInt(storedStartTime, 10);
    } else {
      startTime = now;
      localStorage.setItem(STORAGE_KEY, startTime.toString());
    }

    const duration = 24 * 60 * 60 * 1000; // 24 hours in ms
    const elapsed = now - startTime;
    const remaining = Math.max(0, Math.floor((duration - elapsed) / 1000));
    
    setTimeLeft(remaining);

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [leadId]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading || isAnalyzing) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mb-4" />
        <h2 className="text-2xl font-medium">Preparing your personalized AI demo...</h2>
        <p className="text-white/40 mt-2">We're analyzing your website to train your custom assistant.</p>
      </div>
    );
  }

  if (!lead || !profile) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
        <h2 className="text-2xl font-medium">Demo not found</h2>
        <p className="text-white/40 mt-2">The link might be expired or incorrect.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      {/* Navbar */}
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Bot className="text-black w-5 h-5" />
            </div>
            <span className="font-bold text-xl">DemoFlow<span className="text-emerald-500">AI</span></span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400 uppercase tracking-widest">
              <Clock className="w-3 h-3" />
              Offer expires in {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Demo Section */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400 mb-6">
              <Zap className="w-3 h-3" />
              <span>Custom Bot Ready for {lead.companyName}</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tight mb-8 leading-tight">
              Automate Your Sales <br />
              <span className="text-emerald-500">While You Sleep</span>
            </h1>
            <p className="text-xl text-white/60 mb-10 leading-relaxed">
              We've analyzed <strong>{lead.website}</strong> and built an AI assistant that understands your services, captures leads, and answers customer questions instantly.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-sm text-white/80">24/7 Customer Support</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-sm text-white/80">Instant Lead Capture</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-sm text-white/80">Brand Accurate Training</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-sm text-white/80">Easy 1-Minute Install</span>
              </div>
            </div>

            <a href="#pricing" className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 text-black font-bold rounded-2xl hover:bg-emerald-400 transition-all group">
              View Pricing Plans
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-emerald-500/10 blur-3xl rounded-full opacity-50" />
            <div className="relative aspect-[4/5] rounded-[40px] overflow-hidden border border-white/10 bg-black shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-12 bg-white/5 border-b border-white/10 flex items-center px-6 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                <div className="ml-4 px-4 py-1 rounded bg-white/5 text-[10px] text-white/40 flex-1 truncate">
                  {lead.website}
                </div>
              </div>
              <div className="absolute inset-0 pt-12">
                <ChatWidget profile={profile} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Pricing Section */}
        <section id="pricing" className="mb-32 scroll-mt-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-white/40">Choose the plan that fits your business growth.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Monthly Plan */}
            <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 flex flex-col">
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2">Monthly</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$30</span>
                  <span className="text-white/40">/month</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-sm text-white/60">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Full AI Agent Access
                </li>
                <li className="flex items-center gap-3 text-sm text-white/60">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Unlimited Conversations
                </li>
                <li className="flex items-center gap-3 text-sm text-white/60">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Lead Dashboard
                </li>
                <li className="flex items-center gap-3 text-sm text-white/60">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Email Support
                </li>
              </ul>
              <a href="/checkout/monthly" className="w-full py-4 bg-white/10 text-white font-bold rounded-2xl text-center hover:bg-white/20 transition-all border border-white/10">
                Get Started
              </a>
            </div>

            {/* Annual Plan */}
            <div className="p-8 rounded-[32px] bg-emerald-500/5 border-2 border-emerald-500 relative flex flex-col">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-500 text-black text-[10px] font-bold uppercase tracking-widest rounded-full">
                Most Popular
              </div>
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2">Annual</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$275</span>
                  <span className="text-white/40">/year</span>
                </div>
                <div className="text-xs text-emerald-400 font-bold mt-1">Save $85 per year</div>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-sm text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Everything in Monthly
                </li>
                <li className="flex items-center gap-3 text-sm text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Priority Support
                </li>
                <li className="flex items-center gap-3 text-sm text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Custom Branding
                </li>
                <li className="flex items-center gap-3 text-sm text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Advanced Analytics
                </li>
              </ul>
              <a href="/checkout/annual" className="w-full py-4 bg-emerald-500 text-black font-bold rounded-2xl text-center hover:bg-emerald-400 transition-all">
                Get Started
              </a>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Trusted by Business Owners</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Jenkins",
                role: "Real Estate Agent",
                text: "The AI agent has been a game changer. It captures leads while I'm out on viewings. My conversion rate has doubled!",
                stars: 5
              },
              {
                name: "Mark Thompson",
                role: "Law Firm Partner",
                text: "Professional, accurate, and incredibly fast. It handles initial inquiries perfectly, saving our staff hours every week.",
                stars: 5
              },
              {
                name: "Elena Rodriguez",
                role: "E-commerce Founder",
                text: "I was skeptical at first, but the custom training is spot on. It knows my products better than some of my employees!",
                stars: 5
              }
            ].map((t, i) => (
              <div key={i} className="p-8 rounded-3xl bg-white/[0.03] border border-white/5">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.stars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-white/60 mb-6 italic">"{t.text}"</p>
                <div>
                  <div className="font-bold">{t.name}</div>
                  <div className="text-xs text-white/40">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center py-20 bg-emerald-500/5 rounded-[40px] border border-emerald-500/10">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Website?</h2>
          <p className="text-white/40 mb-10 max-w-xl mx-auto">
            Join hundreds of businesses using DemoFlowAI to automate their sales and support.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="text-red-400 font-bold flex items-center gap-2 mb-4 sm:mb-0">
              <Clock className="w-5 h-5" />
              Offer ends in {formatTime(timeLeft)}
            </div>
            <a href="#pricing" className="px-10 py-4 bg-emerald-500 text-black font-bold rounded-2xl hover:bg-emerald-400 transition-all">
              Claim Your Discount Now
            </a>
          </div>
        </section>
      </main>

      <footer className="py-12 px-6 border-t border-white/5 text-center text-white/20 text-sm">
        © 2026 DemoFlowAI. All rights reserved.
      </footer>
    </div>
  );
};
