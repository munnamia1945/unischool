import React from 'react';
import { motion } from 'motion/react';
import { GraduationCap, ArrowRight, Sparkles, BookOpen, HelpCircle, FileText, CheckCircle2, Twitter, Linkedin, Instagram, Shield } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onAdmin: () => void;
  siteConfig: {
    heroTitle: string;
    heroSubtitle: string;
    heroDescription: string;
    showFeatures: boolean;
  };
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onAdmin, siteConfig }) => {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden font-sans">
      {/* Hero Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2071" 
          alt="Background" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a237e]/90 via-[#1a237e]/70 to-white" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
        <div className="flex items-center">
          <div className="h-16 flex items-center justify-center cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <img 
              src="/logo.webp" 
              alt="Unischool" 
              className="h-full w-auto object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = "https://via.placeholder.com/200x80?text=Unischool";
              }}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={onLogin}
            className="text-white font-bold hover:text-emerald-400 transition-colors text-sm"
          >
            Login
          </button>
          <button 
            onClick={onGetStarted}
            className="bg-white text-[#1a237e] px-6 py-2.5 rounded-xl text-sm font-black hover:bg-emerald-50 transition-all shadow-xl"
          >
            Sign Up Free
          </button>
        </div>
      </nav>

      {/* Hero Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-8">
              <Sparkles size={14} /> The Future of Learning is Here
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-white leading-[1.1] mb-8 tracking-tight">
              {siteConfig.heroTitle} <br />
              <span className="text-emerald-400">{siteConfig.heroSubtitle}</span>
            </h1>
            <p className="text-xl text-white/80 leading-relaxed mb-10 max-w-xl font-medium">
              {siteConfig.heroDescription}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={onGetStarted}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-5 rounded-[2rem] font-black text-xl shadow-2xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-3 group"
              >
                Get Started Now
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center gap-4 px-6">
                <div className="flex -space-x-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                    </div>
                  ))}
                </div>
                <div className="text-white/60 text-sm font-bold">
                  Joined by <span className="text-white">2,000+</span> students
                </div>
              </div>
            </div>
          </motion.div>

          {/* Floating Feature Cards */}
          {siteConfig.showFeatures && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6 pt-12">
                  <FeatureCard 
                    icon={<HelpCircle className="text-blue-500" />}
                    title="AI Explanation"
                    desc="যেকোনো জটিল বিষয় সহজ ভাষায় বুঝে নিন।"
                    delay={0.4}
                  />
                  <FeatureCard 
                    icon={<BookOpen className="text-emerald-500" />}
                    title="MCQ Generator"
                    desc="নিমিষেই তৈরি করুন প্র্যাকটিস কুইজ।"
                    delay={0.6}
                  />
                </div>
                <div className="space-y-6">
                  <FeatureCard 
                    icon={<FileText className="text-purple-500" />}
                    title="Smart Notes"
                    desc="পরীক্ষার প্রস্তুতির জন্য সেরা শর্ট নোটস।"
                    delay={0.5}
                  />
                  <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-[2.5rem] shadow-2xl">
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                      <CheckCircle2 className="text-white" size={24} />
                    </div>
                    <h3 className="text-white text-xl font-bold mb-2">Success Rate</h3>
                    <div className="text-4xl font-black text-white">98.5%</div>
                    <p className="text-white/50 text-sm mt-2 font-medium">Student satisfaction score</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 bg-white border-t border-slate-100 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Unischool AI</h3>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-[10px] font-black text-white uppercase tracking-widest">Platform</span>
                </div>
                <div className="w-12 h-1 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full" />
              </div>
              <p className="text-slate-500 max-w-sm leading-relaxed text-lg font-medium">
                The future of education is here. We provide AI-powered tools to help students master any subject with ease.
              </p>
            </div>
            <div>
              <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-6">Platform</h4>
              <ul className="space-y-4 text-sm text-slate-500 font-semibold">
                <li><button onClick={onLogin} className="hover:text-emerald-600">Features</button></li>
                <li><button onClick={onLogin} className="hover:text-emerald-600">Workspace</button></li>
                <li><button onClick={onLogin} className="hover:text-emerald-600">About Us</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-6">Legal</h4>
              <ul className="space-y-4 text-sm text-slate-500 font-semibold">
                <li><a href="#" className="hover:text-emerald-600">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-emerald-600">Terms of Service</a></li>
                <li><button onClick={onAdmin} className="flex items-center gap-2 text-slate-300 hover:text-emerald-600 transition-colors">
                  <Shield size={14} /> Admin Panel
                </button></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm font-medium">
              © 2026 Unischool AI. All rights reserved.
            </p>
            <div className="flex gap-6 text-slate-400">
              <a href="#" className="hover:text-emerald-600 transition-colors" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="#" className="hover:text-emerald-600 transition-colors" aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
              <a href="#" className="hover:text-emerald-600 transition-colors" aria-label="Instagram">
                <Instagram size={20} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, delay }: { icon: React.ReactNode, title: string, desc: string, delay: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-white/50 hover:translate-y-[-5px] transition-all cursor-default"
  >
    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
      {icon}
    </div>
    <h3 className="text-slate-900 text-xl font-black mb-2">{title}</h3>
    <p className="text-slate-500 font-medium leading-relaxed">{desc}</p>
  </motion.div>
);
