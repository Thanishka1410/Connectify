import React from 'react';
import { MessageSquare, Users, Sparkles, ShieldCheck } from 'lucide-react';

const EmptyState = ({ onNewChat, onNewGroup }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/70 select-none">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-brand-accent flex items-center justify-center shadow-xl shadow-brand-500/20 text-white transform -rotate-3 hover:rotate-0 transition-transform duration-300">
          <MessageSquare className="w-12 h-12" />
        </div>
        <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Real-Time
        </div>
      </div>

      <h2 className="text-2xl font-bold text-slate-800 mb-2">
        Welcome to Connectify
      </h2>
      <p className="text-slate-500 max-w-md mb-8 text-sm sm:text-base leading-relaxed">
        "Every conversation brings us closer." Select an existing discussion or start a new connection to exchange messages, files, and moments in real time.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
        <button
          onClick={onNewChat}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm shadow-md shadow-brand-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <MessageSquare className="w-4 h-4" />
          Direct Message
        </button>
        <button
          onClick={onNewGroup}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-medium text-sm border border-slate-200 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Users className="w-4 h-4 text-brand-600" />
          Create Group
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg text-left">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-semibold text-slate-800">Instant Messaging</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Sub-second real-time delivery powered by WebSockets.</p>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center mb-2">
            <Users className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-semibold text-slate-800">Dynamic Groups</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Admin controls, membership management & system logs.</p>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-semibold text-slate-800">Secure & Reliable</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">JWT authentication, bcrypt hashing & MongoDB persistence.</p>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
