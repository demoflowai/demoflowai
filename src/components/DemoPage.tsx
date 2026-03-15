import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bot, CheckCircle2, Zap, ShieldCheck, Download, CreditCard, Loader2 } from 'lucide-react';
import { doc, getDoc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { analyzeBusiness, BusinessProfile } from '../services/gemini';
import ChatWidget from './ChatWidget';

interface DemoPageProps {
  leadId: string;
}

export const DemoPage: React.FC<DemoPageProps> = ({ leadId }) => {
  const [lead, setLead] = useState<any>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  useEffect(() => {
    const fetchLead = async () => {
      if (!leadId) return;
      try {
        const leadDoc = await getDoc(doc(db, 'leads', leadId));
        if (leadDoc.exists()) {
          const data = leadDoc.data();
          setLead(data);
          
          // Update status to demo_viewed if it was demo_sent
          if (data.status === 'demo_sent') {
            await updateDoc(doc(db, 'leads', leadId), {
              status: 'demo_viewed',
              lastUpdated: serverTimestamp(),
              statusHistory: arrayUnion({
                status: 'demo_viewed',
                timestamp: new Date().toISOString()
              })
            });
          }

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

  const handlePayment = async () => {
    setPaymentStatus('processing');
    // Simulate payment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (leadId) {
      await updateDoc(doc(db, 'leads', leadId), {
        status: 'paid',
        lastUpdated: serverTimestamp(),
        statusHistory: arrayUnion({
          status: 'paid',
          timestamp: new Date().toISOString()
        })
      });
    }
    setPaymentStatus('success');
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
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Bot className="text-black w-5 h-5" />
            </div>
            <span className="font-bold text-xl">DemoFlow<span className="text-emerald-500">AI</span></span>
          </div>
          <div className="text-sm font-medium text-white/60">
            Personalized Demo for <span className="text-white">{lead.companyName}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left Side: Sales Pitch */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400 mb-6">
              <CheckCircle2 className="w-3 h-3" />
              <span>Custom Bot Ready</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tight mb-8 leading-tight">
              Meet Your New <br />
              <span className="text-emerald-500">24/7 Sales Agent</span>
            </h1>
            <p className="text-xl text-white/60 mb-10 leading-relaxed">
              We've analyzed <strong>{lead.website}</strong> and built an AI assistant that understands your services, captures leads, and answers customer questions instantly.
            </p>

            <div className="space-y-6 mb-12">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                  <Zap className="text-yellow-400 w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-1">Instant Response</h4>
                  <p className="text-white/40">Never miss a lead again. Your bot answers in seconds, even while you sleep.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                  <ShieldCheck className="text-emerald-400 w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-1">Brand Accurate</h4>
                  <p className="text-white/40">Trained specifically on your website content. No generic responses.</p>
                </div>
              </div>
            </div>

            {paymentStatus === 'success' ? (
              <div className="p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Payment Successful!</h3>
                <p className="text-white/60 mb-6">Your AI agent is ready for deployment.</p>
                <button className="w-full py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-50 transition-all">
                  <Download className="w-5 h-5" />
                  Download Installation Package
                </button>
                <div className="mt-6 text-left">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-3">Installation Instructions:</h4>
                  <ol className="text-sm text-white/60 space-y-2 list-decimal pl-4">
                    <li>Download the ZIP file containing your custom script.</li>
                    <li>Copy the <code>&lt;script&gt;</code> tag from the <code>install.txt</code> file.</li>
                    <li>Paste it into the <code>&lt;head&gt;</code> section of your website.</li>
                    <li>Your AI agent will appear instantly!</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-sm text-white/40 uppercase tracking-widest mb-1">One-time Setup</div>
                    <div className="text-3xl font-bold">$299.00</div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                    Special Offer
                  </div>
                </div>
                <button 
                  onClick={handlePayment}
                  disabled={paymentStatus === 'processing'}
                  className="w-full py-4 bg-emerald-500 text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {paymentStatus === 'processing' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Get Your AI Agent Now
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-white/20 mt-4">
                  Secure payment via Stripe. 30-day money back guarantee.
                </p>
              </div>
            )}
          </motion.div>

          {/* Right Side: Interactive Demo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
            <div className="mt-6 text-center">
              <p className="text-sm text-white/40">
                Try interacting with the bot. It's already trained on your website!
              </p>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};
