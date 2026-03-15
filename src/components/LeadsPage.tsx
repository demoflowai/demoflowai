import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Building2, UserCircle2, Wrench, Stethoscope, Zap, ArrowRight, ExternalLink, BotOff, Loader2, Filter, Mail, Send, CheckCircle2, BarChart3, Clock, Globe, ChevronRight, Download, LayoutDashboard, MailSearch, TrendingUp, Users, DollarSign, MousePointer2, Lock, Unlock, Copy, StickyNote, MessageSquare, Beaker } from 'lucide-react';
import { searchLeads, Lead, generateOutreachEmail } from '../services/gemini';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { sendCampaignEmail, getRateLimitStatus, SENDER_EMAIL, SENDER_NAME } from '../services/emailCampaign';

const SECTORS = [
  { id: 'electricians', name: 'Electricians', icon: Zap, color: 'text-yellow-500' },
  { id: 'doctors', name: 'Doctors', icon: Stethoscope, color: 'text-blue-500' },
  { id: 'plumbers', name: 'Plumbers', icon: Wrench, color: 'text-cyan-500' },
  { id: 'lawyers', name: 'Lawyers', icon: Building2, color: 'text-indigo-500' },
  { id: 'dentists', name: 'Dentists', icon: UserCircle2, color: 'text-emerald-500' },
];

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-500 border-blue-500',
  demo_sent: 'bg-amber-500/10 text-amber-500 border-amber-500',
  demo_viewed: 'bg-purple-500/10 text-purple-500 border-purple-500',
  paid: 'bg-green-500/10 text-green-500 border-green-500',
  installed: 'bg-teal-500/10 text-teal-500 border-teal-500',
};

const STATUS_BORDER_COLORS: Record<string, string> = {
  new: 'border-l-blue-500',
  demo_sent: 'border-l-amber-500',
  demo_viewed: 'border-l-purple-500',
  paid: 'border-l-green-500',
  installed: 'border-l-teal-500',
};

export const LeadsPage: React.FC = () => {
  const [view, setView] = useState<'search' | 'funnel' | 'campaign' | 'analytics'>('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [areaTerm, setAreaTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [trackedLeads, setTrackedLeads] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [emailQuota, setEmailQuota] = useState(getRateLimitStatus());
  const [previewEmail, setPreviewEmail] = useState<{ leadId: string; content: any } | null>(null);
  const [isAdmin, setIsAdmin] = useState(sessionStorage.getItem('isAdmin') === 'true');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [hoveredEmailLead, setHoveredEmailLead] = useState<any | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'leads'), where('ownerUid', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTrackedLeads(docs);
    });

    return () => unsubscribe();
  }, []);

  const handleSendTestEmail = async () => {
    setIsSendingTestEmail(true);
    const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || "re_5RLXRMaU_DUBAfHRiomWm8mJY7yRaEPSm";
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: sans-serif;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #111827; padding: 30px; text-align: center;">
                      <h1 style="margin: 0; color: #22c55e; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">DemoFlowAI</h1>
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px; color: #374151; line-height: 1.6;">
                      <p style="margin-top: 0; font-size: 18px;">Hi Paul,</p>
                      <p>I was looking at <strong>Aquify</strong> and noticed that your website currently relies on traditional contact forms and phone calls to capture enquiries.</p>
                      <p>The reality is that many visitors who don't feel like calling right away are lost forever. They leave your site and move on to the next search result.</p>
                      <p><strong>DemoFlowAI</strong> solves this by installing an intelligent AI chatbot that:</p>
                      <ul style="padding-left: 20px;">
                        <li>Qualifies leads 24/7 in real-time</li>
                        <li>Books demos and meetings automatically</li>
                        <li>Sends immediate follow-up emails to keep prospects engaged</li>
                      </ul>
                      <p>It's like having your best sales person working every second of the day, for a fraction of the cost.</p>
                      
                      <div style="text-align: center; margin: 40px 0;">
                        <a href="https://demoflowai.com" style="background-color: #111827; color: #ffffff; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Book a Free Demo</a>
                      </div>
                      
                      <p style="margin-bottom: 0;">Best regards,<br><strong>The DemoFlowAI Team</strong><br><span style="color: #6b7280; font-size: 14px;">sales@demoflowai.com</span></p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: "DemoFlowAI <sales@demoflowai.com>",
          to: ["paulh2110@gmail.com"],
          subject: "AI Chatbot for Aquify — Never Miss a Lead Again",
          html: emailHtml,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert("Test email sent to paulh2110@gmail.com!");
      } else {
        alert(`Failed to send test email: ${result.error || response.statusText}`);
      }
    } catch (error) {
      console.error("Test Email Error:", error);
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleSearch = async (sector?: string) => {
    const query = sector || searchTerm;
    if (!query) return;

    setLoading(true);
    setError(null);
    try {
      const results = await searchLeads(query, areaTerm || 'Global');
      setLeads(results);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch leads. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveLead = async (lead: Lead) => {
    if (!auth.currentUser) {
      alert("Please sign in to track leads.");
      return;
    }

    try {
      await addDoc(collection(db, 'leads'), {
        ...lead,
        status: 'new',
        ownerUid: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        statusHistory: [{
          status: 'new',
          timestamp: new Date().toISOString()
        }]
      });
      alert("Lead saved to funnel!");
    } catch (err) {
      console.error("Error saving lead:", err);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'leads', leadId), {
        status: newStatus,
        lastUpdated: serverTimestamp(),
        statusHistory: arrayUnion({
          status: newStatus,
          timestamp: new Date().toISOString()
        })
      });
    } catch (err) {
      console.error("Error updating lead status:", err);
    }
  };

  const sendDemoEmail = async (leadId: string, lead: any) => {
    setSendingEmailId(leadId);
    try {
      const demoUrl = `${window.location.origin}/demo/${leadId}`;
      const emailContent = await generateOutreachEmail(lead, demoUrl);
      
      // Simulate sending email
      console.log("Sending Email to:", lead.email);
      
      await updateDoc(doc(db, 'leads', leadId), {
        status: 'demo_sent',
        lastUpdated: serverTimestamp(),
        outreachEmail: emailContent,
        demoUrl: demoUrl,
        statusHistory: arrayUnion({
          status: 'demo_sent',
          timestamp: new Date().toISOString()
        })
      });
      
      alert(`Demo email sent to ${lead.email}!`);
    } catch (err) {
      console.error("Error sending email:", err);
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleSendCampaignEmail = async (lead: any) => {
    setSendingEmailId(lead.id);
    try {
      const result = await sendCampaignEmail(lead);
      if (result.success) {
        setEmailQuota(getRateLimitStatus());
        setPreviewEmail(null);
        alert(`Campaign email sent to ${lead.companyName}!`);
      } else {
        alert(`Failed to send email: ${result.error}`);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'admin2026') {
      setIsAdmin(true);
      sessionStorage.setItem('isAdmin', 'true');
      setShowAdminModal(false);
      setAdminPassword('');
    } else {
      alert('Incorrect password');
    }
  };

  const updateLeadNote = async (leadId: string, note: string) => {
    try {
      await updateDoc(doc(db, 'leads', leadId), {
        note: note,
        lastUpdated: serverTimestamp()
      });
      setEditingNoteId(null);
    } catch (err) {
      console.error("Error updating lead note:", err);
    }
  };

  const copyDemoLink = (leadId: string) => {
    const url = `${window.location.origin}/demo/${leadId}`;
    navigator.clipboard.writeText(url);
    setCopyingId(leadId);
    setTimeout(() => setCopyingId(null), 2000);
  };

  const analytics = {
    totalLeads: trackedLeads.length,
    demoSent: trackedLeads.filter(l => l.status !== 'new').length,
    demoViewed: trackedLeads.filter(l => ['demo_viewed', 'paid', 'installed'].includes(l.status)).length,
    paid: trackedLeads.filter(l => ['paid', 'installed'].includes(l.status)).length,
    ctr: trackedLeads.filter(l => l.status !== 'new').length > 0 
      ? (trackedLeads.filter(l => ['demo_viewed', 'paid', 'installed'].includes(l.status)).length / trackedLeads.filter(l => l.status !== 'new').length * 100).toFixed(1)
      : 0,
    conversion: trackedLeads.filter(l => ['demo_viewed', 'paid', 'installed'].includes(l.status)).length > 0
      ? (trackedLeads.filter(l => ['paid', 'installed'].includes(l.status)).length / trackedLeads.filter(l => ['demo_viewed', 'paid', 'installed'].includes(l.status)).length * 100).toFixed(1)
      : 0,
    mrr: trackedLeads.filter(l => ['paid', 'installed'].includes(l.status)).length * 30
  };

  const filteredLeads = statusFilter === 'all' 
    ? trackedLeads 
    : trackedLeads.filter(lead => lead.status === statusFilter);

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans text-[#1A1A1A]">
      {/* Header */}
      <header className="bg-white border-b border-black/5 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                <Building2 className="text-white w-6 h-6" />
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight">Lead Explorer</h1>
                {isAdmin && (
                  <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold uppercase rounded-md">Admin</span>
                )}
              </div>
            </div>
            
            <nav className="flex items-center gap-1 bg-[#F5F5F5] p-1 rounded-xl">
              <button 
                onClick={() => setView('search')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'search' ? 'bg-white shadow-sm text-black' : 'text-black/40 hover:text-black'}`}
              >
                Search
              </button>
              <button 
                onClick={() => setView('funnel')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'funnel' ? 'bg-white shadow-sm text-black' : 'text-black/40 hover:text-black'}`}
              >
                Sales Funnel
              </button>
              <button 
                onClick={() => setView('campaign')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'campaign' ? 'bg-white shadow-sm text-black' : 'text-black/40 hover:text-black'}`}
              >
                Campaign
              </button>
              <button 
                onClick={() => {
                  if (isAdmin) {
                    setView('analytics');
                  } else {
                    setShowAdminModal(true);
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'analytics' ? 'bg-white shadow-sm text-black' : 'text-black/40 hover:text-black'}`}
              >
                Analytics
              </button>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => isAdmin ? (setIsAdmin(false), sessionStorage.removeItem('isAdmin')) : setShowAdminModal(true)}
              className={`p-2 rounded-xl border transition-all ${isAdmin ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-white border-black/5 text-black/40 hover:text-black'}`}
            >
              {isAdmin ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </button>

            {view === 'search' && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#F5F5F5] p-1 rounded-xl">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Sector (e.g. Plumbers)"
                    className="pl-11 pr-4 py-2.5 bg-white border-none rounded-lg w-48 focus:ring-2 focus:ring-black/5 transition-all outline-none text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Area (e.g. London)"
                    className="pl-11 pr-4 py-2.5 bg-white border-none rounded-lg w-48 focus:ring-2 focus:ring-black/5 transition-all outline-none text-sm"
                    value={areaTerm}
                    onChange={(e) => setAreaTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              </div>
              <button 
                onClick={() => handleSearch()}
                disabled={loading}
                className="bg-black text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-black/80 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find Leads'}
              </button>
            </div>
          )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {view === 'search' && (
          <>
            {/* Intro */}
            <div className="mb-12">
              <h2 className="text-4xl font-light mb-4 tracking-tight">Discover businesses <span className="italic font-serif">without AI chatbots.</span></h2>
              <p className="text-black/50 max-w-2xl">
                We use real-time Google Search analysis to identify high-potential leads with valid email addresses that haven't yet adopted AI automation.
              </p>
            </div>

            {/* Sectors Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {SECTORS.map((sector) => (
                <button
                  key={sector.id}
                  onClick={() => {
                    setSelectedSector(sector.id);
                    handleSearch(sector.name);
                  }}
                  className={`p-6 rounded-2xl border transition-all text-left group ${
                    selectedSector === sector.id 
                      ? 'bg-black border-black text-white shadow-xl' 
                      : 'bg-white border-black/5 hover:border-black/20 text-black'
                  }`}
                >
                  <sector.icon className={`w-8 h-8 mb-4 ${selectedSector === sector.id ? 'text-white' : sector.color}`} />
                  <div className="font-medium text-sm mb-1">{sector.name}</div>
                  <div className={`text-xs flex items-center gap-1 ${selectedSector === sector.id ? 'text-white/60' : 'text-black/40'}`}>
                    Explore <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>

            {/* Test Lead Button */}
            <div className="flex justify-center gap-4 mb-16">
              <button
                onClick={() => saveLead({
                  companyName: "Aquify",
                  website: "https://aquify.co.za",
                  email: "paulh2110@gmail.com",
                  sector: "Water Treatment",
                  description: "Aquify is a South African water treatment and purification solutions provider serving residential and commercial clients.",
                  hasChatbot: false,
                  reasoning: "The website uses a standard contact form and phone number for enquiries — no AI chatbot, live chat, or automated customer support tools are present."
                })}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-black/10 text-black/60 hover:text-black hover:border-black/30 hover:bg-black/5 transition-all text-sm font-medium"
              >
                <Beaker className="w-4 h-4" />
                Add Test Lead (Aquify)
              </button>

              <button
                onClick={handleSendTestEmail}
                disabled={isSendingTestEmail}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-black/10 text-black/60 hover:text-black hover:border-black/30 hover:bg-black/5 transition-all text-sm font-medium disabled:opacity-50"
              >
                {isSendingTestEmail ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isSendingTestEmail ? 'Sending...' : 'Send Test Email'}
              </button>
            </div>

            {/* Results Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-black/40">
                  {loading ? 'Analyzing web data...' : `Results (${leads.length})`}
                </h3>
              </div>

              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-3xl border border-black/5 p-20 flex flex-col items-center justify-center text-center"
                  >
                    <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mb-6">
                      <Loader2 className="w-8 h-8 animate-spin text-black" />
                    </div>
                    <h4 className="text-xl font-medium mb-2">Scanning the web</h4>
                    <p className="text-black/40 max-w-sm">
                      Our AI is currently visiting company websites, checking for chatbots, and finding contact emails.
                    </p>
                  </motion.div>
                ) : leads.length > 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    {leads.map((lead, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-3xl border border-black/5 p-8 hover:shadow-2xl hover:shadow-black/5 transition-all group"
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <div className="text-xs font-medium text-black/40 uppercase tracking-tighter mb-2">{lead.sector}</div>
                            <h4 className="text-2xl font-medium tracking-tight mb-1">{lead.companyName}</h4>
                            <div className="flex items-center gap-4">
                              <a 
                                href={lead.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-black/40 hover:text-black flex items-center gap-1 transition-colors"
                              >
                                {lead.website.replace(/^https?:\/\//, '')} <ExternalLink className="w-3 h-3" />
                              </a>
                              <div className="text-sm text-black/40 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {lead.email}
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => saveLead(lead)}
                            className="w-12 h-12 bg-[#F5F5F5] rounded-2xl flex items-center justify-center hover:bg-black hover:text-white transition-colors group/btn"
                          >
                            <Zap className="w-6 h-6 group-hover/btn:fill-current" />
                          </button>
                        </div>
                        
                        <p className="text-sm text-black/60 leading-relaxed mb-8 line-clamp-2">
                          {lead.description}
                        </p>

                        <div className="pt-6 border-t border-black/5 flex items-center justify-between">
                          <div className="text-sm italic font-serif text-black/80">
                            "{lead.reasoning}"
                          </div>
                          <button 
                            onClick={() => saveLead(lead)}
                            className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:text-emerald-600 transition-colors"
                          >
                            Add to Funnel <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : !searchTerm && !selectedSector ? (
                  <div className="bg-white rounded-3xl border border-black/5 p-20 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mb-6">
                      <Filter className="w-8 h-8 text-black/20" />
                    </div>
                    <h4 className="text-xl font-medium mb-2">Start your search</h4>
                    <p className="text-black/40 max-w-sm">
                      Select a sector above to find businesses with valid emails that need your chatbot services.
                    </p>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 text-red-600 rounded-3xl p-12 text-center border border-red-100">
                    {error}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-black/5 p-20 flex flex-col items-center justify-center text-center">
                    <h4 className="text-xl font-medium mb-2">No leads found</h4>
                    <p className="text-black/40 max-w-sm">
                      We couldn't find any companies matching your criteria that don't have chatbots and have valid emails.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}

        {view === 'funnel' && (
          <div className="space-y-8">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Sales Funnel</h2>
                  <p className="text-black/40">Track your leads from discovery to installation.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-black/5 text-sm font-medium">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    Total Leads: {trackedLeads.length}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['all', 'new', 'demo_sent', 'demo_viewed', 'paid', 'installed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${
                      statusFilter === status
                        ? 'bg-black border-black text-white shadow-lg'
                        : 'bg-white border-black/5 text-black/40 hover:border-black/20 hover:text-black'
                    }`}
                  >
                    {status.replace('_', ' ')}
                    <span className="ml-2 opacity-50">
                      ({status === 'all' ? trackedLeads.length : trackedLeads.filter(l => l.status === status).length})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <div key={lead.id} className={`bg-white rounded-2xl border border-black/5 border-l-4 ${STATUS_BORDER_COLORS[lead.status]} p-6 flex items-center justify-between group hover:shadow-lg transition-all`}>
                    <div className="flex items-center gap-6 flex-1">
                      <div className="w-12 h-12 bg-[#F5F5F5] rounded-xl flex items-center justify-center shrink-0">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-bold text-lg">{lead.companyName}</h4>
                          <button 
                            onClick={() => {
                              setEditingNoteId(lead.id);
                              setNoteText(lead.note || '');
                            }}
                            className="p-1 hover:bg-black/5 rounded transition-colors text-black/20 hover:text-black"
                            title="Add/Edit Note"
                          >
                            <StickyNote className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-black/40 mb-2">
                          <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {lead.website}</span>
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {lead.email}</span>
                        </div>
                        
                        {editingNoteId === lead.id ? (
                          <div className="mt-2 flex flex-col gap-2">
                            <textarea
                              autoFocus
                              className="w-full p-2 text-xs bg-[#F5F5F5] border border-black/5 rounded-lg focus:ring-1 focus:ring-black/10 outline-none resize-none"
                              rows={2}
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="Add a note..."
                            />
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => updateLeadNote(lead.id, noteText)}
                                className="px-3 py-1 bg-black text-white text-[10px] font-bold uppercase rounded-md"
                              >
                                Save
                              </button>
                              <button 
                                onClick={() => setEditingNoteId(null)}
                                className="px-3 py-1 bg-black/5 text-black text-[10px] font-bold uppercase rounded-md"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : lead.note ? (
                          <div className="text-xs text-black/60 bg-amber-50 p-2 rounded-lg border border-amber-100/50 flex items-start gap-2">
                            <MessageSquare className="w-3 h-3 mt-0.5 shrink-0 text-amber-500" />
                            <span className="line-clamp-1 italic">{lead.note}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="flex flex-col items-end">
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-1 ${STATUS_COLORS[lead.status]}`}>
                          {lead.status.replace('_', ' ')}
                        </div>
                        <div className="text-[10px] text-black/30 flex items-center gap-1 uppercase tracking-widest">
                          <Clock className="w-2.5 h-2.5" />
                          Updated {lead.lastUpdated?.toDate().toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => copyDemoLink(lead.id)}
                          className="p-2 hover:bg-[#F5F5F5] rounded-xl transition-all text-black/40 hover:text-black relative"
                          title="Copy Demo Link"
                        >
                          {copyingId === lead.id ? (
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[10px] rounded animate-in fade-in slide-in-from-bottom-1">Copied!</span>
                          ) : null}
                          <Copy className="w-4 h-4" />
                        </button>
                        {lead.status === 'new' && (
                          <button 
                            onClick={() => sendDemoEmail(lead.id, lead)}
                            disabled={sendingEmailId === lead.id}
                            className="px-4 py-2 bg-black text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-black/80 transition-all disabled:opacity-50"
                          >
                            {sendingEmailId === lead.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                            Send Demo Email
                          </button>
                        )}
                        {lead.status === 'demo_sent' && (
                          <div className="px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-xs font-bold flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            Waiting for View
                          </div>
                        )}
                        {lead.status === 'demo_viewed' && (
                          <div className="px-4 py-2 bg-yellow-50 text-yellow-600 rounded-xl text-xs font-bold flex items-center gap-2">
                            <Zap className="w-3 h-3" />
                            Prospect is Interested
                          </div>
                        )}
                        {lead.status === 'paid' && (
                          <button 
                            onClick={() => updateLeadStatus(lead.id, 'installed')}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all"
                          >
                            <Download className="w-3 h-3" />
                            Mark as Installed
                          </button>
                        )}
                        {lead.status === 'installed' && (
                          <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3" />
                            Fully Deployed
                          </div>
                        )}
                        <button className="p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors">
                          <ChevronRight className="w-4 h-4 text-black/20" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-3xl border border-black/5 p-20 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mb-6">
                    <BarChart3 className="w-8 h-8 text-black/20" />
                  </div>
                  <h4 className="text-xl font-medium mb-2">Your funnel is empty</h4>
                  <p className="text-black/40 max-w-sm">
                    Go to the Search tab to find leads and add them to your sales funnel.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'campaign' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Email Campaign</h2>
                <p className="text-black/40">Automate your outreach with personalized cold emails.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <div className="text-xs font-bold uppercase tracking-widest text-black/40 mb-1">Daily Quota</div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-black/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-black transition-all duration-500" 
                        style={{ width: `${(emailQuota.sent / 50) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold">{emailQuota.sent}/50</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {trackedLeads.filter(l => ['new', 'demo_viewed'].includes(l.status)).length > 0 ? (
                trackedLeads.filter(l => ['new', 'demo_viewed'].includes(l.status)).map((lead) => (
                  <div key={lead.id} className="bg-white rounded-2xl border border-black/5 p-6 flex items-center justify-between group hover:shadow-lg transition-all">
                    <div className="flex items-center gap-6 flex-1">
                      <div className="w-12 h-12 bg-[#F5F5F5] rounded-xl flex items-center justify-center shrink-0">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{lead.companyName}</h4>
                        <div className="flex items-center gap-3 text-sm text-black/40">
                          <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {lead.website}</span>
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {lead.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => copyDemoLink(lead.id)}
                        className="p-2 hover:bg-[#F5F5F5] rounded-xl transition-all text-black/40 hover:text-black relative"
                        title="Copy Demo Link"
                      >
                        {copyingId === lead.id ? (
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-[10px] rounded animate-in fade-in slide-in-from-bottom-1">Copied!</span>
                        ) : null}
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={async () => {
                          const demoUrl = `${window.location.origin}/demo/${lead.id}`;
                          const content = await generateOutreachEmail(lead, demoUrl);
                          setPreviewEmail({ leadId: lead.id, content });
                        }}
                        onMouseEnter={async () => {
                          const demoUrl = `${window.location.origin}/demo/${lead.id}`;
                          const content = await generateOutreachEmail(lead, demoUrl);
                          setHoveredEmailLead({ ...lead, preview: content });
                        }}
                        onMouseLeave={() => setHoveredEmailLead(null)}
                        className="px-4 py-2 bg-white border border-black/5 text-black rounded-xl text-xs font-bold hover:bg-[#F5F5F5] transition-all relative"
                      >
                        Preview Email
                        {hoveredEmailLead?.id === lead.id && (
                          <div className="absolute bottom-full right-0 mb-4 w-80 bg-white rounded-2xl shadow-2xl border border-black/5 p-6 z-50 text-left pointer-events-none animate-in fade-in zoom-in-95">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1">From</div>
                            <div className="text-[10px] font-bold mb-3">{SENDER_NAME} &lt;{SENDER_EMAIL}&gt;</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1">Subject</div>
                            <div className="text-xs font-bold mb-4">{hoveredEmailLead.preview.subject}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-2">Content Preview</div>
                            <div className="text-[11px] text-black/60 line-clamp-6 whitespace-pre-wrap">
                              {hoveredEmailLead.preview.body}
                            </div>
                            <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Pricing: $30/mo</span>
                              <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Demo Link Included</span>
                            </div>
                          </div>
                        )}
                      </button>
                      <button 
                        onClick={() => handleSendCampaignEmail(lead)}
                        onMouseEnter={async () => {
                          const demoUrl = `${window.location.origin}/demo/${lead.id}`;
                          const content = await generateOutreachEmail(lead, demoUrl);
                          setHoveredEmailLead({ ...lead, preview: content });
                        }}
                        onMouseLeave={() => setHoveredEmailLead(null)}
                        disabled={sendingEmailId === lead.id || emailQuota.remaining <= 0}
                        className="px-4 py-2 bg-black text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-black/80 transition-all disabled:opacity-50 relative"
                      >
                        {sendingEmailId === lead.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        Send Campaign Email
                        {hoveredEmailLead?.id === lead.id && (
                          <div className="absolute bottom-full right-0 mb-4 w-80 bg-white rounded-2xl shadow-2xl border border-black/5 p-6 z-50 text-left pointer-events-none animate-in fade-in zoom-in-95">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1">From</div>
                            <div className="text-[10px] font-bold mb-3">{SENDER_NAME} &lt;{SENDER_EMAIL}&gt;</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1">Subject</div>
                            <div className="text-xs font-bold mb-4">{hoveredEmailLead.preview.subject}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-2">Content Preview</div>
                            <div className="text-[11px] text-black/60 line-clamp-6 whitespace-pre-wrap">
                              {hoveredEmailLead.preview.body}
                            </div>
                            <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between">
                              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Pricing: $30/mo</span>
                              <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Demo Link Included</span>
                            </div>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-2xl border border-black/5 p-12 text-center">
                  <div className="w-16 h-16 bg-[#F5F5F5] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MailSearch className="w-8 h-8 text-black/20" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">No leads ready for campaign</h3>
                  <p className="text-black/40">Search for new leads or wait for prospects to view your demo.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'analytics' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
                <p className="text-black/40">Real-time performance metrics for your sales machine.</p>
              </div>
              <button className="px-4 py-2 bg-white border border-black/5 text-black rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#F5F5F5] transition-all">
                <Download className="w-3 h-3" />
                Export Report
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-black/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest text-black/40">Total Leads</div>
                </div>
                <div className="text-3xl font-bold">{analytics.totalLeads}</div>
                <div className="text-[10px] text-emerald-500 font-bold mt-1 flex items-center gap-1 uppercase tracking-widest">
                  <TrendingUp className="w-3 h-3" /> +12% this week
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-black/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                    <MousePointer2 className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest text-black/40">Demo CTR</div>
                </div>
                <div className="text-3xl font-bold">{analytics.ctr}%</div>
                <div className="text-[10px] text-black/30 font-bold mt-1 uppercase tracking-widest">
                  {analytics.demoViewed} views / {analytics.demoSent} sent
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-black/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest text-black/40">Conversion</div>
                </div>
                <div className="text-3xl font-bold">{analytics.conversion}%</div>
                <div className="text-[10px] text-black/30 font-bold mt-1 uppercase tracking-widest">
                  {analytics.paid} sales / {analytics.demoViewed} views
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-black/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest text-black/40">Est. MRR</div>
                </div>
                <div className="text-3xl font-bold">${analytics.mrr}</div>
                <div className="text-[10px] text-black/30 font-bold mt-1 uppercase tracking-widest">
                  Based on $30/mo plan
                </div>
              </div>
            </div>

            {/* Funnel Visualization */}
            <div className="bg-white p-8 rounded-2xl border border-black/5">
              <h3 className="text-lg font-bold mb-8">Sales Funnel Visualization</h3>
              <div className="space-y-6">
                {[
                  { label: 'Leads Found', count: analytics.totalLeads, color: 'bg-blue-500' },
                  { label: 'Demos Sent', count: analytics.demoSent, color: 'bg-purple-500' },
                  { label: 'Demos Viewed', count: analytics.demoViewed, color: 'bg-yellow-500' },
                  { label: 'Sales Closed', count: analytics.paid, color: 'bg-emerald-500' }
                ].map((stage, i) => (
                  <div key={stage.label} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-black/40">{stage.label}</span>
                      <span className="text-sm font-bold">{stage.count}</span>
                    </div>
                    <div className="h-12 bg-[#F5F5F5] rounded-xl overflow-hidden relative">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${analytics.totalLeads > 0 ? (stage.count / analytics.totalLeads) * 100 : 0}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className={`h-full ${stage.color} opacity-80`}
                      />
                      <div className="absolute inset-0 flex items-center px-4 text-[10px] font-bold text-white uppercase tracking-widest pointer-events-none">
                        {analytics.totalLeads > 0 ? ((stage.count / analytics.totalLeads) * 100).toFixed(0) : 0}% of total
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Email Preview Modal */}
      <AnimatePresence>
        {previewEmail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewEmail(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-black/5 flex items-center justify-between bg-[#F5F5F5]">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-black/40" />
                  <h3 className="font-bold">Email Preview</h3>
                </div>
                <button 
                  onClick={() => setPreviewEmail(null)}
                  className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                >
                  <BotOff className="w-5 h-5 text-black/40" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 font-serif text-lg leading-relaxed text-black/80">
                <div className="mb-6 pb-6 border-b border-black/5">
                  <div className="text-sm font-sans font-bold uppercase tracking-widest text-black/40 mb-2">From</div>
                  <div className="text-sm font-sans font-bold text-black/80">{SENDER_NAME} &lt;{SENDER_EMAIL}&gt;</div>
                </div>
                <div className="mb-8 pb-8 border-b border-black/5">
                  <div className="text-sm font-sans font-bold uppercase tracking-widest text-black/40 mb-2">Subject</div>
                  <div className="text-xl font-sans font-bold">{previewEmail.content.subject}</div>
                </div>
                <div className="whitespace-pre-wrap">
                  {previewEmail.content.body}
                </div>
              </div>

              <div className="p-6 bg-[#F5F5F5] border-t border-black/5 flex items-center justify-end gap-4">
                <button 
                  onClick={() => setPreviewEmail(null)}
                  className="px-6 py-2.5 text-sm font-bold text-black/40 hover:text-black transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    const lead = trackedLeads.find(l => l.id === previewEmail.leadId);
                    if (lead) handleSendCampaignEmail(lead);
                  }}
                  disabled={sendingEmailId === previewEmail.leadId}
                  className="px-8 py-2.5 bg-black text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-black/80 transition-all shadow-lg"
                >
                  {sendingEmailId === previewEmail.leadId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send Email Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Login Modal */}
      <AnimatePresence>
        {showAdminModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdminModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8"
            >
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-4">
                  <Lock className="text-white w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold">Admin Access</h3>
                <p className="text-black/40 text-sm mt-1">Please enter the administrator password to view analytics.</p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <input 
                  type="password"
                  autoFocus
                  placeholder="Enter Password"
                  className="w-full px-4 py-3 bg-[#F5F5F5] border-none rounded-xl outline-none focus:ring-2 focus:ring-black/5 transition-all"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
                <button 
                  type="submit"
                  className="w-full py-3 bg-black text-white rounded-xl font-bold hover:bg-black/80 transition-all"
                >
                  Login as Admin
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
