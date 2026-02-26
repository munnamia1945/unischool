import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Users, 
  Layout, 
  Save, 
  ArrowLeft, 
  Shield, 
  Eye, 
  EyeOff,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Database,
  Search,
  MessageSquare,
  BarChart3,
  Activity,
  Clock,
  ChevronRight,
  X,
  FileText,
  HelpCircle,
  BookOpen,
  Microscope
} from 'lucide-react';
import { cn } from './lib/utils';
import { supabase } from './lib/supabase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import Markdown from 'react-markdown';

interface SiteConfig {
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  primaryColor: string;
  showFeatures: boolean;
  announcement: string;
}

interface AIActionLog {
  id: string;
  userEmail: string;
  userName: string;
  type: 'explain' | 'mcq' | 'notes' | 'research';
  question: string;
  response: any;
  timestamp: number;
  status: 'success' | 'error';
  error?: string;
}

interface AdminPanelProps {
  onBack: () => void;
  siteConfig: SiteConfig;
  onUpdateConfig: (config: SiteConfig) => void;
}

type AdminTab = 'content' | 'users' | 'questions' | 'analytics' | 'api';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBack, siteConfig, onUpdateConfig }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [tempConfig, setTempConfig] = useState<SiteConfig>({ ...siteConfig });
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<AIActionLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AIActionLog | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Load AI logs from Supabase
      const { data: logsData, error: logsError } = await supabase
        .from('ai_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      
      if (logsData) {
        setLogs(logsData.map(l => ({
          id: l.id,
          userEmail: l.user_email,
          userName: l.user_name,
          type: l.type,
          question: l.question,
          response: l.response,
          timestamp: new Date(l.created_at).getTime(),
          status: l.status,
          error: l.error
        })));
      }

      // Load Users from Supabase
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesData) {
        setUsers(profilesData);
      }
    };

    fetchData();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      // 1. Sign in with Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        // 2. Check user role in profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          await supabase.auth.signOut();
          setError('আপনার প্রোফাইল তথ্য পাওয়া যায়নি। দয়া করে নিশ্চিত করুন যে আপনি এই ইমেইল দিয়ে সাইন-আপ করেছেন।');
          return;
        }

        if (profile && profile.role === 'admin') {
          setIsAuthenticated(true);
          setError('');
        } else {
          console.log('User role found:', profile?.role);
          await supabase.auth.signOut();
          setError(`আপনার রোল "${profile?.role || 'user'}"। শুধুমাত্র এডমিনরা এখানে প্রবেশ করতে পারবেন।`);
        }
      }
    } catch (err: any) {
      setError(err.message || 'ভুল ইমেইল অথবা পাসওয়ার্ড। আবার চেষ্টা করুন।');
    }
  };

  const handleSaveConfig = () => {
    onUpdateConfig(tempConfig);
    alert('কনফিগারেশন সেভ করা হয়েছে!');
  };

  const handleDeleteLog = async (id: string) => {
    if (confirm('Are you sure you want to delete this log?')) {
      const { error } = await supabase
        .from('ai_logs')
        .delete()
        .eq('id', id);
      
      if (!error) {
        const updatedLogs = logs.filter(log => log.id !== id);
        setLogs(updatedLogs);
      } else {
        alert('Error deleting log: ' + error.message);
      }
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => 
      log.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [logs, searchQuery]);

  const analytics = useMemo(() => {
    if (logs.length === 0) return null;

    const totalQuestions = logs.length;
    const avgLength = Math.round(logs.reduce((acc, log) => acc + log.question.length, 0) / totalQuestions);
    
    // Daily questions
    const dailyCounts: Record<string, number> = {};
    logs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString();
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    const dailyData = Object.entries(dailyCounts).map(([date, count]) => ({ date, count })).reverse();

    // Type distribution
    const typeCounts = { explain: 0, mcq: 0, notes: 0, research: 0 };
    logs.forEach(log => {
      if (typeCounts[log.type] !== undefined) {
        typeCounts[log.type]++;
      }
    });
    const typeData = [
      { name: 'Explain', value: typeCounts.explain, color: '#3b82f6' },
      { name: 'MCQ', value: typeCounts.mcq, color: '#10b981' },
      { name: 'Notes', value: typeCounts.notes, color: '#a855f7' },
      { name: 'Research', value: typeCounts.research, color: '#f59e0b' }
    ];

    // API Stats
    const totalCalls = logs.length;
    const errorCalls = logs.filter(l => l.status === 'error').length;
    const lastCall = logs[0]?.timestamp;

    return {
      totalQuestions,
      avgLength,
      dailyData,
      typeData,
      totalCalls,
      errorCalls,
      lastCall
    };
  }, [logs]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Shield size={40} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">Admin Access</h2>
            <p className="text-slate-500 font-medium">This area is restricted. Enter master password.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Admin Email</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 outline-none focus:border-red-500/30 focus:ring-4 focus:ring-red-500/5 transition-all font-bold"
                placeholder="admin@unischool.ai"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Master Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 outline-none focus:border-red-500/30 focus:ring-4 focus:ring-red-500/5 transition-all font-bold"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-2xl text-sm font-bold border border-red-100">
                <AlertTriangle size={18} />
                {error}
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-black text-lg shadow-xl transition-all"
            >
              Authorize Access
            </button>
            
            <button 
              type="button"
              onClick={onBack}
              className="w-full text-slate-400 font-bold hover:text-slate-600 transition-colors"
            >
              Cancel and Return
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-80 bg-slate-900 text-white p-8 flex flex-col sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
            <Shield size={20} />
          </div>
          <h1 className="text-xl font-black tracking-tight">Admin Panel</h1>
        </div>

        <nav className="space-y-2 flex-1 overflow-y-auto pr-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-4">Main Menu</p>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={cn(
              "w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all",
              activeTab === 'analytics' ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <BarChart3 size={20} /> Analytics
          </button>
          <button 
            onClick={() => setActiveTab('questions')}
            className={cn(
              "w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all",
              activeTab === 'questions' ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <MessageSquare size={20} /> Questions
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={cn(
              "w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all",
              activeTab === 'users' ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Users size={20} /> Users
          </button>
          
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-8 mb-4 ml-4">Settings</p>
          <button 
            onClick={() => setActiveTab('content')}
            className={cn(
              "w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all",
              activeTab === 'content' ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Layout size={20} /> Site Content
          </button>
          <button 
            onClick={() => setActiveTab('api')}
            className={cn(
              "w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all",
              activeTab === 'api' ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Activity size={20} /> API Monitor
          </button>
        </nav>

        <button 
          onClick={onBack}
          className="flex items-center gap-3 px-6 py-4 text-slate-400 hover:text-white transition-all font-bold mt-auto border-t border-white/5 pt-8"
        >
          <ArrowLeft size={20} /> Exit Admin
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl font-black text-slate-900">
              {activeTab === 'analytics' && "Analytics Dashboard"}
              {activeTab === 'questions' && "Question Management"}
              {activeTab === 'users' && "User Management"}
              {activeTab === 'content' && "Content Manager"}
              {activeTab === 'api' && "API Usage Monitor"}
            </h2>
            <p className="text-slate-500 font-medium mt-2">
              {activeTab === 'analytics' && "Track platform performance and usage trends."}
              {activeTab === 'questions' && "Review and manage AI interactions."}
              {activeTab === 'users' && "Manage registered student accounts."}
              {activeTab === 'content' && "Customize landing page and global settings."}
              {activeTab === 'api' && "Monitor Gemini AI API health and calls."}
            </p>
          </div>
          {activeTab === 'content' && (
            <button 
              onClick={handleSaveConfig}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-emerald-200 transition-all"
            >
              <Save size={20} /> Save Changes
            </button>
          )}
        </header>

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Total Questions</p>
                <p className="text-4xl font-black text-slate-900">{analytics.totalQuestions}</p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Avg. Question Length</p>
                <p className="text-4xl font-black text-slate-900">{analytics.avgLength} <span className="text-sm font-bold text-slate-400">chars</span></p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">API Success Rate</p>
                <p className="text-4xl font-black text-emerald-600">
                  {Math.round(((analytics.totalCalls - analytics.errorCalls) / analytics.totalCalls) * 100)}%
                </p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Active Users</p>
                <p className="text-4xl font-black text-slate-900">{users.length}</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <h3 className="text-xl font-black text-slate-900 mb-8">Daily Question Volume</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" hide />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#10b981" 
                        strokeWidth={4} 
                        dot={{ r: 6, fill: '#10b981', strokeWidth: 0 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <h3 className="text-xl font-black text-slate-900 mb-8">Request Type Distribution</h3>
                <div className="h-[300px] flex items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.typeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analytics.typeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-4 pr-10">
                    {analytics.typeData.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-bold text-slate-600">{item.name}</span>
                        <span className="text-sm font-black text-slate-900 ml-auto">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="space-y-8">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text"
                placeholder="Search questions, users, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border-none rounded-3xl py-6 pl-16 pr-8 shadow-xl shadow-slate-200/50 focus:ring-2 focus:ring-emerald-500 transition-all font-bold text-slate-800"
              />
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Question</th>
                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">User</th>
                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Type</th>
                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Time</th>
                    <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => setSelectedLog(log)}>
                      <td className="px-8 py-6 max-w-md">
                        <p className="font-bold text-slate-800 truncate">{log.question}</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm">{log.userName}</span>
                          <span className="text-xs text-slate-400 font-medium">{log.userEmail}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          log.type === 'explain' ? "bg-blue-100 text-blue-600" :
                          log.type === 'mcq' ? "bg-emerald-100 text-emerald-600" :
                          log.type === 'notes' ? "bg-purple-100 text-purple-600" :
                          "bg-amber-100 text-amber-600"
                        )}>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-bold text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLog(log.id);
                            }}
                            className="text-slate-300 hover:text-red-500 transition-colors p-2"
                          >
                            <Trash2 size={18} />
                          </button>
                          <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold">
                        No questions found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">User</th>
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Email</th>
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((user, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-600">
                          {user.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-800">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-medium text-slate-500">{user.email}</td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-xs font-bold">Active</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="text-slate-400 hover:text-red-500 transition-colors p-2">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="grid gap-8">
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50">
              <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Layout size={18} className="text-blue-600" />
                </div>
                Hero Section Configuration
              </h3>
              
              <div className="grid gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Hero Title</label>
                  <input 
                    type="text"
                    value={tempConfig.heroTitle}
                    onChange={(e) => setTempConfig({...tempConfig, heroTitle: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Hero Subtitle (Accent)</label>
                  <input 
                    type="text"
                    value={tempConfig.heroSubtitle}
                    onChange={(e) => setTempConfig({...tempConfig, heroSubtitle: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Hero Description</label>
                  <textarea 
                    value={tempConfig.heroDescription}
                    onChange={(e) => setTempConfig({...tempConfig, heroDescription: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-800 min-h-[120px] resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50">
              <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Settings size={18} className="text-purple-600" />
                </div>
                Global Settings
              </h3>
              
              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Announcement Bar</label>
                  <input 
                    type="text"
                    value={tempConfig.announcement}
                    onChange={(e) => setTempConfig({...tempConfig, announcement: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-purple-500 transition-all font-bold text-slate-800"
                    placeholder="e.g. New features coming soon!"
                  />
                </div>
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl">
                  <div>
                    <p className="font-bold text-slate-800">Show Feature Cards</p>
                    <p className="text-xs text-slate-500 font-medium">Toggle landing page feature display</p>
                  </div>
                  <button 
                    onClick={() => setTempConfig({...tempConfig, showFeatures: !tempConfig.showFeatures})}
                    className={cn(
                      "w-14 h-8 rounded-full transition-all relative",
                      tempConfig.showFeatures ? "bg-emerald-500" : "bg-slate-300"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm",
                      tempConfig.showFeatures ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* API Tab */}
        {activeTab === 'api' && analytics && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Total API Calls</p>
                <p className="text-4xl font-black text-slate-900">{analytics.totalCalls}</p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Failed Calls</p>
                <p className="text-4xl font-black text-red-500">{analytics.errorCalls}</p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Last Call</p>
                <p className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Clock size={18} className="text-slate-400" />
                  {analytics.lastCall ? new Date(analytics.lastCall).toLocaleTimeString() : 'Never'}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl">
              <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle size={18} className="text-red-600" />
                </div>
                Error Logs
              </h3>
              <div className="space-y-4">
                {logs.filter(l => l.status === 'error').length > 0 ? (
                  logs.filter(l => l.status === 'error').map((log) => (
                    <div key={log.id} className="p-6 bg-red-50 rounded-2xl border border-red-100">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-black text-red-600 uppercase tracking-widest">API Error</span>
                        <span className="text-xs text-red-400 font-bold">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-red-800 font-bold mb-1">{log.error}</p>
                      <p className="text-red-600/60 text-xs font-medium">Context: {log.question.substring(0, 100)}...</p>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400 font-bold">
                    No API errors recorded. System is healthy.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Response Viewer Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <header className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    selectedLog.type === 'explain' ? "bg-blue-100 text-blue-600" :
                    selectedLog.type === 'mcq' ? "bg-emerald-100 text-emerald-600" :
                    selectedLog.type === 'notes' ? "bg-purple-100 text-purple-600" :
                    "bg-amber-100 text-amber-600"
                  )}>
                    {selectedLog.type === 'explain' ? <HelpCircle size={24} /> : 
                     selectedLog.type === 'mcq' ? <BookOpen size={24} /> : 
                     selectedLog.type === 'notes' ? <FileText size={24} /> : <Microscope size={24} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">AI Response Viewer</h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                      {selectedLog.type} • {new Date(selectedLog.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-all shadow-sm"
                >
                  <X size={24} />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-10 space-y-10">
                <section>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">User Question</h4>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-lg font-bold text-slate-800 leading-relaxed italic">"{selectedLog.question}"</p>
                  </div>
                </section>

                <section>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">AI Response</h4>
                  {selectedLog.status === 'error' ? (
                    <div className="p-6 bg-red-50 rounded-2xl border border-red-100 text-red-600 font-bold">
                      Error: {selectedLog.error}
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                      {selectedLog.type === 'mcq' ? (
                        <div className="space-y-8">
                          {Array.isArray(selectedLog.response) && selectedLog.response.map((q: any, i: number) => (
                            <div key={i} className="space-y-4">
                              <p className="font-bold text-slate-800">Q{i+1}. {q.question}</p>
                              <div className="grid grid-cols-2 gap-3">
                                {q.options.map((opt: string, j: number) => (
                                  <div key={j} className={cn(
                                    "p-3 rounded-xl text-sm font-medium border",
                                    q.correctAnswer === j ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-100 text-slate-500"
                                  )}>
                                    {opt}
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-slate-400 font-medium bg-slate-50 p-3 rounded-lg">
                                <span className="font-black uppercase tracking-widest text-[8px] block mb-1">Explanation</span>
                                {q.explanation}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="markdown-body">
                          {selectedLog.type === 'research' ? (
                          <pre className="bg-slate-900 text-emerald-400 p-6 rounded-2xl overflow-x-auto font-mono text-sm">
                            {selectedLog.response}
                          </pre>
                        ) : (
                          <Markdown>{selectedLog.response}</Markdown>
                        )}
                        </div>
                      )}
                    </div>
                  )}
                </section>

                <section className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">User Details</h4>
                    <p className="font-bold text-slate-800">{selectedLog.userName}</p>
                    <p className="text-xs text-slate-500">{selectedLog.userEmail}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Metadata</h4>
                    <p className="font-bold text-slate-800">ID: {selectedLog.id}</p>
                    <p className="text-xs text-slate-500">Status: {selectedLog.status}</p>
                  </div>
                </section>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
