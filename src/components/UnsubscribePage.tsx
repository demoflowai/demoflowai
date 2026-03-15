import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, CheckCircle2, BotOff } from 'lucide-react';

export const UnsubscribePage: React.FC = () => {
  const [unsubscribed, setUnsubscribed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-xl p-12 text-center"
      >
        {!unsubscribed ? (
          <>
            <div className="w-16 h-16 bg-black/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-black/40" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Unsubscribe from our list?</h2>
            <p className="text-black/40 mb-8">
              We're sorry to see you go. If you unsubscribe, you will no longer receive automated outreach from our sales team.
            </p>
            <button 
              onClick={() => setUnsubscribed(true)}
              className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-black/80 transition-all"
            >
              Confirm Unsubscribe
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold mb-4">You've been unsubscribed</h2>
            <p className="text-black/40 mb-8">
              Your email has been removed from our automated outreach list. You can close this window now.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-black/20">
              <BotOff className="w-4 h-4" />
              DemoFlowAI
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};
