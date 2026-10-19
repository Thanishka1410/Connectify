import React from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Users,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Smile,
  Image as ImageIcon,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-accent flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Connectify
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/chat"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm shadow-md shadow-brand-500/25 transition-all hover:scale-105"
              >
                Open Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-brand-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm shadow-md shadow-brand-500/20 transition-all hover:scale-105"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200/60 text-brand-700 text-xs font-semibold mb-6 shadow-2xs">
            <Sparkles className="w-4 h-4 text-brand-600" />
            Next-Generation Real-Time Messaging Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight sm:leading-none">
            Every conversation <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-accent bg-clip-text text-transparent">
              brings us closer.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Experience lightning-fast group chats, direct messages, media sharing, and live presence. Engineered with the modern MERN stack and WebSockets for seamless team collaboration.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to={isAuthenticated ? '/chat' : '/register'}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-lg shadow-brand-500/30 transition-all hover:scale-105 active:scale-95"
            >
              Start Chatting Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-sm border border-slate-200 shadow-xs transition-all hover:scale-105 active:scale-95"
            >
              Sign In to Your Account
            </Link>
          </div>

          {/* Interactive UI Mockup Preview */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 bg-white overflow-hidden text-left">
            {/* Window bar */}
            <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                <span className="text-xs font-semibold text-slate-500 ml-2">Connectify Dashboard</span>
              </div>
              <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Socket.IO Connected
              </span>
            </div>

            {/* Visual Chat Mockup */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 h-96">
              {/* Sidebar snippet */}
              <div className="p-3 bg-slate-50/50 space-y-2 hidden md:block">
                <div className="p-2.5 rounded-xl bg-brand-50 border border-brand-200 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs">
                    CT
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">Core Team Sprint</p>
                    <p className="text-[11px] text-brand-700 truncate">Alex: Sounds like a plan! 🚀</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl hover:bg-slate-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-xs">
                    DS
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">Design Systems</p>
                    <p className="text-[11px] text-slate-400 truncate">Maya: Updated color palette</p>
                  </div>
                </div>
              </div>

              {/* Chat snippet */}
              <div className="md:col-span-2 p-4 flex flex-col justify-between bg-white">
                <div className="space-y-3">
                  <div className="flex gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center text-xs font-bold">
                      A
                    </div>
                    <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-xs max-w-sm text-xs text-slate-800">
                      <p className="font-semibold text-violet-700 mb-0.5">Alex Morgan</p>
                      Hey everyone! Connectify's real-time group chat engine is live! 🎉
                      <span className="text-[10px] text-slate-400 block mt-1 text-right">10:42 AM</span>
                    </div>
                  </div>

                  <div className="flex gap-2.5 flex-row-reverse">
                    <div className="bg-gradient-to-r from-brand-600 to-indigo-600 text-white p-3 rounded-2xl rounded-tr-xs max-w-sm text-xs">
                      Just tested the typing indicators and image upload attachments — super smooth! ⚡
                      <span className="text-[10px] text-indigo-200 block mt-1 text-right">10:43 AM · Read ✓✓</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-2 flex items-center gap-2 bg-slate-50">
                  <span className="text-slate-400 text-xs flex-1">Type your message...</span>
                  <button className="px-3 py-1 rounded-lg bg-brand-600 text-white text-xs font-medium">
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-brand-600 tracking-wider uppercase">Features</h2>
            <p className="text-3xl font-extrabold text-slate-900 mt-2">
              Engineered for Modern Communication
            </p>
            <p className="text-slate-500 text-sm mt-3">
              Everything you need for seamless personal chats and team collaboration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-brand-600 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Real-Time WebSockets</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Powered by Socket.IO for sub-second messaging, dynamic typing indicators, live presence tracking, and instant delivery.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Dynamic Group Management</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Create groups, assign administrative privileges, add or remove members, track membership changes, and view shared media galleries.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Secure Authentication</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                JWT-based authentication, bcrypt password hashing, input validation, and role-based route protection on both client and server.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-base">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center text-white text-xs">
              <MessageSquare className="w-4 h-4" />
            </div>
            Connectify
          </div>
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Connectify. Full-Stack MERN Group Chat Application.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
