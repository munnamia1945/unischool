import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, ArrowRight, X, Github, Chrome, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from './lib/utils';
import { supabase } from './lib/supabase';

interface User {
  email: string;
  name: string;
  profilePic?: string;
  bio?: string;
  address?: string;
  phone?: string;
}

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
  onBack: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const validateForm = () => {
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('দয়া করে একটি সঠিক ইমেইল এড্রেস দিন।');
      return false;
    }
    if (formData.password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return false;
    }
    if (!isLogin && !formData.name.trim()) {
      setError('দয়া করে আপনার নাম লিখুন।');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);
    
    try {
      if (isLogin) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (authError) throw authError;

        if (data.user) {
          // Fetch profile data
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          setSuccess(true);
          setTimeout(() => {
            onLoginSuccess({
              email: data.user!.email!,
              name: profileData?.name || data.user!.email!.split('@')[0],
              profilePic: profileData?.profile_pic,
              bio: profileData?.bio,
              address: profileData?.address,
              phone: profileData?.phone
            });
          }, 1500);
        }
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
            }
          }
        });

        if (authError) throw authError;

        if (data.user) {
          // Create profile record
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              { 
                id: data.user.id, 
                name: formData.name, 
                email: formData.email 
              }
            ]);

          if (profileError) console.error('Error creating profile:', profileError);

          setSuccess(true);
          setTimeout(() => {
            onLoginSuccess({
              email: data.user!.email!,
              name: formData.name
            });
          }, 1500);
        }
      }
    } catch (err: any) {
      setError(err.message || 'একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-hidden">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onBack}
        className="absolute inset-0 bg-[#1a237e]/40 backdrop-blur-md"
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-[450px] relative z-10"
      >
        {/* Close Button (Top Left) */}
        <button 
          onClick={onBack}
          className="absolute -top-4 -left-4 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-all z-20 hover:rotate-90"
        >
          <X size={20} />
        </button>

        {/* Logo Section */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center h-32 w-auto mb-4 p-2"
          >
            <img 
              src="/logo.webp" 
              alt="Unischool Logo" 
              className="h-full w-auto object-contain"
              onError={(e) => {
                e.currentTarget.src = "https://via.placeholder.com/200x80?text=Unischool";
              }}
            />
          </motion.div>
          <p className="text-slate-500 font-medium">আপনার স্মার্ট স্টাডি অ্যাসিস্ট্যান্ট</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden">
          {/* Tabs */}
          <div className="flex p-2 bg-slate-100/50 m-4 rounded-2xl">
            <button 
              onClick={() => setIsLogin(true)}
              className={cn(
                "flex-1 py-3 rounded-xl font-bold transition-all text-sm",
                isLogin ? "bg-white text-[#1a237e] shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Login
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={cn(
                "flex-1 py-3 rounded-xl font-bold transition-all text-sm",
                !isLogin ? "bg-white text-[#1a237e] shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Sign Up
            </button>
          </div>

          <div className="p-8 pt-4">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 text-center"
                >
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={48} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">সফলভাবে লগইন হয়েছে!</h2>
                  <p className="text-slate-500">আপনাকে ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে...</p>
                </motion.div>
              ) : (
                <motion.form 
                  key={isLogin ? 'login' : 'signup'}
                  initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  {!isLogin && (
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1a237e] transition-colors">
                          <User size={18} />
                        </div>
                        <input 
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="আপনার নাম লিখুন"
                          className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#1a237e]/30 focus:ring-4 focus:ring-[#1a237e]/5 transition-all font-medium"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1a237e] transition-colors">
                        <Mail size={18} />
                      </div>
                      <input 
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="example@gmail.com"
                        className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#1a237e]/30 focus:ring-4 focus:ring-[#1a237e]/5 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-sm font-bold text-slate-700">Password</label>
                      {isLogin && (
                        <button type="button" className="text-xs font-bold text-[#1a237e] hover:underline">
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1a237e] transition-colors">
                        <Lock size={18} />
                      </div>
                      <input 
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="••••••••"
                        className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#1a237e]/30 focus:ring-4 focus:ring-[#1a237e]/5 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-xl text-xs font-bold border border-red-100"
                    >
                      <AlertCircle size={14} />
                      {error}
                    </motion.div>
                  )}

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1a237e] hover:bg-[#121858] text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-[#1a237e]/20 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      <>
                        {isLogin ? 'Login' : 'Create Account'}
                        <ArrowRight size={20} />
                      </>
                    )}
                  </button>

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-100"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white/0 px-2 text-slate-400 font-bold">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button type="button" className="flex items-center justify-center gap-2 py-3 border-2 border-slate-100 rounded-xl hover:bg-slate-50 transition-all font-bold text-slate-600 text-sm">
                      <Chrome size={18} className="text-red-500" />
                      Google
                    </button>
                    <button type="button" className="flex items-center justify-center gap-2 py-3 border-2 border-slate-100 rounded-xl hover:bg-slate-50 transition-all font-bold text-slate-600 text-sm">
                      <Github size={18} />
                      GitHub
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center mt-8 text-slate-400 text-sm font-medium">
          © 2026 Unischool AI. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
};
