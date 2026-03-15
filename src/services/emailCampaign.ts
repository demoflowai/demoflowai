/// <reference types="vite/client" />
/**
 * EMAIL CAMPAIGN SERVICE - LEGAL COMPLIANCE NOTICE
 * 
 * This module is designed for Business-to-Business (B2B) outreach only.
 * 
 * Compliance Approach:
 * 1. CAN-SPAM (USA): Includes physical address, clear unsubscribe link, and non-deceptive subject lines.
 * 2. CASL (Canada): Focuses on the B2B exemption for "relevant business inquiries" to a publicly listed business email.
 * 3. GDPR (EU/UK): Operates under Article 6(1)(f) "Legitimate Interests" for B2B prospecting, 
 *    providing a clear opt-out and targeting only relevant professional entities.
 * 4. Legitimate Interest Statement: Included in the footer to explain why the recipient is being contacted.
 */

import { Lead } from './gemini';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || '';
export const SENDER_EMAIL = "sales@demoflowai.com";
export const SENDER_NAME = "DemoFlowAI";

const DAILY_LIMIT = 50;
const STORAGE_KEY = 'email_campaign_stats';

interface EmailStats {
  sent: number;
  lastReset: string;
}

const getStats = (): EmailStats => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  if (stored) {
    const stats: EmailStats = JSON.parse(stored);
    if (stats.lastReset === today) {
      return stats;
    }
  }

  const newStats = { sent: 0, lastReset: today };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
  return newStats;
};

const updateStats = (count: number) => {
  const stats = getStats();
  stats.sent += count;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
};

export const getRateLimitStatus = () => {
  const stats = getStats();
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return {
    sent: stats.sent,
    remaining: Math.max(0, DAILY_LIMIT - stats.sent),
    resetsAt: tomorrow.toISOString(),
  };
};

export const sendCampaignEmail = async (lead: Lead & { id: string }) => {
  const stats = getStats();
  if (stats.sent >= DAILY_LIMIT) {
    return { success: false, error: "Daily email limit reached (50/day)." };
  }

  const demoUrl = `${window.location.origin}/demo/${lead.id}?ref=email`;
  
  const subject = `AI Chatbot Demo for ${lead.companyName}`;
  const body = `Hello ${lead.companyName} Team,
    
I was researching businesses in the ${lead.sector} industry and noticed that your website (${lead.website}) doesn't currently utilize an AI-driven customer assistant.

To show you the potential impact, I've generated a custom AI agent specifically trained on your business data. You can interact with it and see how it handles inquiries here:

[View Your Custom Demo]
${demoUrl}

Pricing starts at just $30/month (or $275/year), making it a highly cost-effective way to capture leads 24/7.

We are contacting you because of a legitimate business interest in helping ${lead.companyName} automate customer service. If you'd prefer not to receive these updates, please use the link below.

Best regards,
The ${SENDER_NAME} Team

---
${SENDER_NAME} | 123 Tech Lane, Innovation City
This is a B2B inquiry. To opt-out of future communications, click here: ${window.location.origin}/unsubscribe?email=${encodeURIComponent(lead.email)}
`;

  const html = `<div style="font-family: sans-serif; white-space: pre-wrap;">${body}</div>`;

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
        to: [lead.email],
        subject: subject,
        html: html,
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      updateStats(1);
      
      // Update lead status to demo_sent as before
      await updateDoc(doc(db, 'leads', lead.id), {
        status: 'demo_sent',
        lastUpdated: serverTimestamp(),
        statusHistory: arrayUnion({
          status: 'demo_sent',
          timestamp: new Date().toISOString()
        })
      });

      return { success: true };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || response.statusText };
    }
  } catch (error) {
    console.error("Resend API Error:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};
