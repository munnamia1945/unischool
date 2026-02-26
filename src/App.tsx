/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  FileText, 
  Send, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  GraduationCap,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Twitter,
  Linkedin,
  Instagram,
  Download,
  TrendingUp,
  LogOut,
  Microscope,
  ClipboardList,
  Copy,
  FileUp,
  FileCode,
  Shield,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { explainConcept, generateMCQs, generateShortNotes, generateResearchReview } from './services/geminiService';
import { AuthPage } from './AuthPage';
import { LandingPage } from './LandingPage';
import { ProfilePage } from './ProfilePage';
import { AdminPanel } from './AdminPanel';
import { ResearchPage } from './ResearchPage';
import { supabase } from './lib/supabase';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as pdfjsLib from 'pdfjs-dist';

// Set up pdfjs worker using unpkg for reliability
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
} catch (e) {
  console.error('Failed to set up pdfjs worker:', e);
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'explain' | 'mcq' | 'notes' | 'research';

interface MCQ {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface ExamRecord {
  date: string;
  score: number;
  total: number;
  topic: string;
}

interface User {
  email: string;
  name: string;
  profilePic?: string;
  bio?: string;
  address?: string;
  phone?: string;
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

export default function App() {
  const [view, setView] = useState<'landing' | 'auth' | 'app' | 'profile' | 'admin' | 'research'>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('explain');
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [siteConfig, setSiteConfig] = useState({
    heroTitle: 'Master Your Studies',
    heroSubtitle: 'With AI Precision.',
    heroDescription: 'Unischool AI আপনার পড়াশোনাকে করে তুলবে আরও সহজ এবং কার্যকর। জটিল বিষয় ব্যাখ্যা করা থেকে শুরু করে কুইজ তৈরি—সবই হবে চোখের পলকে।',
    primaryColor: '#10b981',
    showFeatures: true,
    announcement: 'Welcome to Unischool AI - The Future of Learning!'
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [examHistory, setExamHistory] = useState<ExamRecord[]>([]);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const userData: User = {
          email: session.user.email!,
          name: profileData?.name || session.user.email!.split('@')[0],
          profilePic: profileData?.profile_pic,
          bio: profileData?.bio,
          address: profileData?.address,
          phone: profileData?.phone
        };
        setUser(userData);
        setView('app');
        
        // Fetch History
        const { data: historyData } = await supabase
          .from('exam_history')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (historyData) {
          setExamHistory(historyData.map(h => ({
            date: new Date(h.created_at).toLocaleDateString(),
            score: h.score,
            total: h.total,
            topic: h.topic
          })));
        }
      }
    };

    initAuth();

    const savedConfig = localStorage.getItem('unischool_site_config');
    if (savedConfig) {
      setSiteConfig(JSON.parse(savedConfig));
    }

    // Secret shortcut for Admin Panel: Ctrl + Shift + A
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        setView('admin');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    (window as any).triggerAdmin = () => setView('admin');
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      delete (window as any).triggerAdmin;
    };
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setView('app');
    localStorage.setItem('unischool_user', JSON.stringify(userData));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      return;
    }

    setIsExtracting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      
      setInput(fullText);
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      alert('Failed to extract text from PDF. Please try pasting the text manually.');
    } finally {
      setIsExtracting(false);
    }
  };

  const downloadAsText = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'research_review.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAsPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(result, 180);
    let y = 10;
    const pageHeight = doc.internal.pageSize.height;
    splitText.forEach((line: string) => {
      if (y > pageHeight - 10) {
        doc.addPage();
        y = 10;
      }
      doc.text(line, 10, y);
      y += 7;
    });
    doc.save('research_review.pdf');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView('landing');
    localStorage.removeItem('unischool_user');
  };

  const handleUpdateUser = async (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('unischool_user', JSON.stringify(updatedUser));
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase
        .from('profiles')
        .update({
          name: updatedUser.name,
          profile_pic: updatedUser.profilePic,
          bio: updatedUser.bio,
          address: updatedUser.address,
          phone: updatedUser.phone
        })
        .eq('id', session.user.id);
    }
  };

  const handleUpdateConfig = (config: typeof siteConfig) => {
    setSiteConfig(config);
    localStorage.setItem('unischool_site_config', JSON.stringify(config));
  };

  const saveExamResult = async (score: number, total: number, topic: string) => {
    const newRecord: ExamRecord = {
      date: new Date().toLocaleDateString(),
      score,
      total,
      topic
    };
    const updatedHistory = [newRecord, ...examHistory].slice(0, 10); // Keep last 10
    setExamHistory(updatedHistory);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase
        .from('exam_history')
        .insert([{
          user_id: session.user.id,
          score,
          total,
          topic
        }]);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('pdf-export-area');
    if (!element) {
      alert('Export area not found');
      return;
    }

    try {
      setPdfLoading(true);
      
      // Ensure all images are loaded and animations are settled
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('pdf-export-area');
          if (clonedElement) {
            // Apply the capture class for hex color overrides
            clonedElement.classList.add('no-pdf-capture');
            
            // Hide elements with .no-pdf class in the clone
            const noPdfElements = clonedElement.querySelectorAll('.no-pdf');
            noPdfElements.forEach(el => (el as HTMLElement).style.display = 'none');
            
            // Ensure the cloned element is visible and has proper width
            clonedElement.style.width = '800px'; // Standard width for PDF
            clonedElement.style.padding = '40px';
          }

          // Strip all modern color styles (oklch, oklab) from the cloned document to prevent html2canvas parsing errors
          const styleTags = clonedDoc.getElementsByTagName('style');
          for (let i = 0; i < styleTags.length; i++) {
            const style = styleTags[i];
            if (style.innerHTML.includes('oklch') || style.innerHTML.includes('oklab')) {
              // Replace modern color functions with a safe fallback color (e.g., gray)
              style.innerHTML = style.innerHTML.replace(/(oklch|oklab)\([^)]+\)/g, '#888888');
            }
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      const pageHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = pdfHeight;
      let position = 0;

      // Add the first page
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      // Add subsequent pages if necessary
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`unischool_${activeTab}_${Date.now()}.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('PDF তৈরি করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setPdfLoading(false);
    }
  };

  const scrollToWorkspace = () => {
    document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAction = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    setMcqs([]);
    setUserAnswers({});
    setShowResults(false);

    let actionType: 'explain' | 'mcq' | 'notes' | 'research' = activeTab;
    let actionResponse: any = null;
    let actionStatus: 'success' | 'error' = 'success';
    let actionError: string | undefined = undefined;

    try {
      if (activeTab === 'explain') {
        actionResponse = await explainConcept(input);
        setResult(actionResponse || "No explanation generated.");
      } else if (activeTab === 'mcq') {
        actionResponse = await generateMCQs(input);
        setMcqs(actionResponse);
      } else if (activeTab === 'notes') {
        actionResponse = await generateShortNotes(input);
        setResult(actionResponse || "No notes generated.");
      } else if (activeTab === 'research') {
        actionResponse = await generateResearchReview(input, { 
          name: user?.name, 
          institution: user?.address // Using address as institution for now or just name
        });
        setResult(actionResponse || "No review generated.");
      }
    } catch (error: any) {
      console.error(error);
      actionStatus = 'error';
      actionError = error.message || "An unknown error occurred";
      setResult("An error occurred while generating content. Please try again.");
    } finally {
      setLoading(false);
      
      // Log the action for Admin Panel
      if (user) {
        const { data: { session } } = await supabase.auth.getSession();
        const newLog: AIActionLog = {
          id: Date.now().toString(),
          userEmail: user.email,
          userName: user.name,
          type: actionType,
          question: input,
          response: actionResponse,
          timestamp: Date.now(),
          status: actionStatus,
          error: actionError
        };
        
        if (session?.user) {
          await supabase
            .from('ai_logs')
            .insert([{
              user_id: session.user.id,
              user_email: user.email,
              user_name: user.name,
              type: actionType,
              question: input,
              response: actionResponse,
              status: actionStatus,
              error: actionError
            }]);
        }

        const existingLogs = JSON.parse(localStorage.getItem('unischool_ai_logs') || '[]');
        localStorage.setItem('unischool_ai_logs', JSON.stringify([newLog, ...existingLogs].slice(0, 500))); // Keep last 500 logs
      }
    }
  };

  const handleAnswerSelect = (qIdx: number, oIdx: number) => {
    if (showResults) return;
    setUserAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
  };

  const tabs = [
    { id: 'explain', label: 'Explain', icon: HelpCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'mcq', label: 'MCQ Gen', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'notes', label: 'Short Notes', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'research', label: 'Research Review', icon: Microscope, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  if (!user) {
    return (
      <>
        {siteConfig.announcement && (
          <div className="bg-emerald-600 text-white py-2 px-4 text-center text-xs font-black uppercase tracking-widest relative z-[60]">
            {siteConfig.announcement}
          </div>
        )}
        <LandingPage 
          onGetStarted={() => setView('auth')} 
          onLogin={() => setView('auth')} 
          onAdmin={() => setView('admin')}
          siteConfig={siteConfig}
        />
        <AnimatePresence>
          {view === 'auth' && (
            <AuthPage key="auth-modal" onLoginSuccess={handleLogin} onBack={() => setView('landing')} />
          )}
        </AnimatePresence>
      </>
    );
  }

  if (view === 'profile' && user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-28 flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-20 flex items-center justify-center cursor-pointer" onClick={() => setView('app')}>
                <img 
                  src="/logo.webp" 
                  alt="Unischool" 
                  className="h-full w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-500 transition-colors p-2"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>
        <ProfilePage 
          user={user} 
          onUpdate={handleUpdateUser} 
          onBack={() => setView('app')} 
        />
      </div>
    );
  }

  if (view === 'admin') {
    return (
      <AdminPanel 
        siteConfig={siteConfig} 
        onUpdateConfig={handleUpdateConfig} 
        onBack={() => setView(user ? 'app' : 'landing')} 
      />
    );
  }

  if (view === 'research' && user) {
    return (
      <ResearchPage 
        user={user} 
        onBack={() => setView('app')} 
        onLogout={handleLogout} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col selection:bg-emerald-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-28 flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-20 flex items-center justify-center cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
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
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
            <a href="#workspace" className="hover:text-emerald-600 transition-colors">Workspace</a>
            <button 
              onClick={() => {
                setView('research');
                setActiveTab('research');
              }}
              className="hover:text-amber-600 transition-colors flex items-center gap-1"
            >
              <Microscope size={16} /> Research Mode
            </button>
            <a href="#about" className="hover:text-emerald-600 transition-colors">About</a>
            <div className="h-6 w-px bg-slate-200 mx-2" />
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setView('profile')}
                className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full hover:bg-slate-200 transition-all text-left"
              >
                <div className="w-8 h-8 bg-[#1a237e] rounded-full flex items-center justify-center text-xs text-white font-bold overflow-hidden">
                  {user.profilePic ? (
                    <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 leading-none">{user.name}</span>
                  <span className="text-[10px] text-slate-500 font-medium">{user.email}</span>
                </div>
              </button>
              <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-500 transition-colors p-2"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-50 rounded-full blur-3xl opacity-60 translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-3xl opacity-60 -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles size={14} /> Next-Gen Learning Platform
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-8 leading-[1.1]">
              Master Any Subject <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">With AI Precision.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-slate-600 mb-10 leading-relaxed">
              Unischool combines advanced artificial intelligence with intuitive design to help you explain concepts, generate practice quizzes, and create perfect study notes in seconds.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={scrollToWorkspace}
                className="w-full sm:w-auto bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-2"
              >
                Start Learning Now <ChevronRight size={20} />
              </button>
              <a href="#features" className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-lg text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                Explore Features
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything you need to excel.</h2>
            <p className="text-slate-600">Powerful tools designed for the modern student.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {tabs.map((feature, idx) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-8 rounded-3xl border border-slate-200 hover:shadow-xl transition-all group"
              >
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", feature.bg)}>
                  <feature.icon size={28} className={feature.color} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.label}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {feature.id === 'explain' && "Get crystal clear explanations for any complex topic, tailored to your learning level."}
                  {feature.id === 'mcq' && "Instantly generate high-quality practice questions to test your knowledge and track progress."}
                  {feature.id === 'notes' && "Convert large amounts of information into concise, scannable notes for efficient revision."}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workspace Section */}
      <section id="workspace" className="py-24 relative">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-slate-900 mb-4">Your AI Workspace</h2>
            <p className="text-slate-600">Select a tool and start your learning journey.</p>
          </div>

          {/* Tab Navigation */}
          <div className="grid grid-cols-4 gap-2 mb-8 p-1.5 bg-slate-100 rounded-2xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as Tab);
                  setResult(null);
                  setMcqs([]);
                  setInput('');
                }}
                className={cn(
                  "flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl transition-all duration-200 font-bold text-sm",
                  activeTab === tab.id 
                    ? "bg-white text-slate-900 shadow-md" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                )}
              >
                <tab.icon size={18} className={cn(activeTab === tab.id ? tab.color : "text-slate-400")} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Input Section */}
          <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 mb-12">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest">
                  {activeTab === 'explain' && "Input Concept"}
                  {activeTab === 'mcq' && "Input Topic/Text"}
                  {activeTab === 'notes' && "Input Topic"}
                  {activeTab === 'research' && "Paper Link, Topic or PDF"}
                </label>
                {activeTab === 'research' && (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isExtracting}
                      className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-bold text-sm transition-colors"
                    >
                      {isExtracting ? <Loader2 className="animate-spin" size={16} /> : <FileUp size={16} />}
                      {isExtracting ? "Extracting..." : "Upload PDF"}
                    </button>
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".pdf"
                      className="hidden"
                    />
                  </>
                )}
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  activeTab === 'explain' ? "e.g. Quantum Physics or সালোকসংশ্লেষণ কি?" :
                  activeTab === 'mcq' ? "Paste a paragraph or enter a topic..." :
                  activeTab === 'notes' ? "e.g. French Revolution or পাইথাগোরাস উপপাদ্য" :
                  "Paste paper link, research topic, or upload a PDF..."
                }
                className="w-full min-h-[160px] p-6 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 transition-all resize-none text-slate-800 placeholder:text-slate-300 text-lg"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleAction}
                disabled={loading || !input.trim()}
                className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-slate-200"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                {loading ? "Processing..." : "Generate Result"}
              </button>
            </div>
          </div>

          {/* Results Section */}
          <AnimatePresence mode="wait">
            {(result || mcqs.length > 0 || loading) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-24 text-slate-300 gap-6">
                    <div className="relative">
                      <Loader2 className="animate-spin text-emerald-500" size={64} />
                      <Sparkles className="absolute -top-3 -right-3 text-amber-400 animate-pulse" size={24} />
                    </div>
                    <p className="font-bold text-lg animate-pulse tracking-tight">Unischool AI is thinking...</p>
                  </div>
                ) : (
                  <div id="pdf-export-area" className="space-y-8 bg-white p-4 rounded-[2rem]">
                    {result && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between no-pdf">
                          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center",
                              activeTab === 'explain' ? "bg-blue-100" : 
                              activeTab === 'research' ? "bg-amber-100" : "bg-purple-100"
                            )}>
                              {activeTab === 'explain' ? (
                                <HelpCircle className="text-blue-600" size={20} />
                              ) : activeTab === 'research' ? (
                                <Microscope className="text-amber-600" size={20} />
                              ) : (
                                <FileText className="text-purple-600" size={20} />
                              )}
                            </div>
                            {activeTab === 'explain' ? "AI Explanation" : 
                             activeTab === 'research' ? "Research Review (LaTeX)" : "Short Notes"}
                          </h2>
                          {activeTab === 'research' && (
                            <div className="flex items-center gap-3 no-pdf">
                              <button 
                                onClick={downloadAsText}
                                className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm"
                                title="Download as Text"
                              >
                                <FileCode size={18} /> Text
                              </button>
                              <button 
                                onClick={downloadAsPDF}
                                className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-amber-700 transition-all text-sm shadow-lg shadow-amber-100"
                                title="Download as PDF"
                              >
                                <Download size={18} /> PDF
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-10 relative overflow-hidden">
                          <div className={cn(
                            "absolute top-0 left-0 w-2 h-full",
                            activeTab === 'explain' ? "bg-blue-500" : 
                            activeTab === 'research' ? "bg-amber-500" : "bg-purple-500"
                          )} />
                          {activeTab === 'research' ? (
                            <div className="relative">
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(result || '');
                                  alert('LaTeX code copied to clipboard!');
                                }}
                                className="absolute top-0 right-0 p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-all flex items-center gap-2 text-xs font-bold"
                              >
                                <Copy size={14} /> Copy LaTeX
                              </button>
                              <pre className="bg-slate-900 text-emerald-400 p-6 rounded-2xl overflow-x-auto font-mono text-sm mt-8">
                                {result}
                              </pre>
                            </div>
                          ) : (
                            <div className="markdown-body">
                              <Markdown>{result}</Markdown>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-center no-pdf">
                          <button 
                            onClick={handleDownloadPDF}
                            disabled={pdfLoading}
                            className="flex items-center gap-2 bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
                          >
                            {pdfLoading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                            {pdfLoading ? "Generating PDF..." : activeTab === 'explain' ? "Download Explanation PDF" : "Download Short Notes PDF"}
                          </button>
                        </div>
                      </div>
                    )}

                    {mcqs.length > 0 && (
                      <div className="space-y-8">
                        <div className="flex items-center justify-between no-pdf">
                          <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                              <BookOpen className="text-emerald-600" size={20} />
                            </div>
                            Knowledge Check
                          </h2>
                          {showResults && (
                            <button 
                              onClick={() => {
                                setUserAnswers({});
                                setShowResults(false);
                              }}
                              className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-200 transition-all"
                            >
                              <RefreshCw size={16} /> Retake Quiz
                            </button>
                          )}
                        </div>

                        {showResults && (
                          <div className="space-y-6">
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-emerald-600 text-white p-8 rounded-[2rem] flex flex-col items-center justify-center shadow-xl shadow-emerald-200"
                            >
                              <p className="text-xs font-black uppercase tracking-[0.3em] mb-2">Your Performance</p>
                              <div className="text-6xl font-black mb-2">
                                {Object.entries(userAnswers).filter(([qIdx, oIdx]) => mcqs[parseInt(qIdx)].correctAnswer === oIdx).length} / {mcqs.length}
                              </div>
                              <p className="font-bold opacity-80">
                                {Math.round((Object.entries(userAnswers).filter(([qIdx, oIdx]) => mcqs[parseInt(qIdx)].correctAnswer === oIdx).length / mcqs.length) * 100)}% Accuracy
                              </p>
                            </motion.div>
                            
                            <div className="flex flex-col sm:flex-row gap-4 justify-center no-pdf">
                              <button 
                                onClick={handleDownloadPDF}
                                disabled={pdfLoading}
                                className="flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
                              >
                                {pdfLoading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                                {pdfLoading ? "Generating PDF..." : "Export Quiz PDF"}
                              </button>
                            </div>
                          </div>
                        )}

                        {activeTab === 'mcq' && examHistory.length > 0 && (
                          <div className="bg-white rounded-[2rem] shadow-lg border border-slate-100 p-8 no-pdf">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                <TrendingUp className="text-blue-600" size={20} />
                              </div>
                              <h3 className="text-xl font-black text-slate-900">Progress Tracker</h3>
                            </div>
                            <div className="h-[200px] w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={examHistory}>
                                  <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis dataKey="date" hide />
                                  <YAxis domain={[0, 'dataMax']} hide />
                                  <Tooltip 
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [`${value} Correct`, 'Score']}
                                  />
                                  <Area 
                                    type="monotone" 
                                    dataKey="score" 
                                    stroke="#10b981" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorScore)" 
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                            <p className="text-center text-xs text-slate-400 mt-4 font-bold uppercase tracking-widest">Last {examHistory.length} attempts</p>
                          </div>
                        )}
                        
                        {mcqs.map((mcq, qIdx) => (
                          <div key={qIdx} className="bg-white rounded-[2rem] shadow-lg border border-slate-100 p-8">
                            <p className="text-xl font-bold text-slate-800 mb-6">
                              <span className="text-emerald-500 mr-3">Q{qIdx + 1}.</span>
                              {mcq.question}
                            </p>
                            <div className="grid gap-4">
                              {mcq.options.map((option, oIdx) => {
                                const isSelected = userAnswers[qIdx] === oIdx;
                                const isCorrect = mcq.correctAnswer === oIdx;
                                const showCorrect = showResults && isCorrect;
                                const showWrong = showResults && isSelected && !isCorrect;

                                return (
                                  <button
                                    key={oIdx}
                                    onClick={() => handleAnswerSelect(qIdx, oIdx)}
                                    disabled={showResults}
                                    className={cn(
                                      "flex items-center justify-between p-5 rounded-2xl border-2 transition-all text-left font-semibold",
                                      !showResults && isSelected ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-50 hover:border-slate-200 text-slate-600",
                                      showCorrect && "border-emerald-500 bg-emerald-50 text-emerald-700",
                                      showWrong && "border-red-500 bg-red-50 text-red-700"
                                    )}
                                  >
                                    <span>{option}</span>
                                    {showCorrect && <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />}
                                    {showWrong && <XCircle size={24} className="text-red-500 shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                            {showResults && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-6 p-6 bg-slate-50 rounded-2xl text-slate-600 border-l-4 border-emerald-500"
                              >
                                <p className="font-black text-slate-900 text-xs uppercase tracking-widest mb-2">Insight</p>
                                <p className="leading-relaxed">{mcq.explanation}</p>
                              </motion.div>
                            )}
                          </div>
                        ))}

                        {!showResults && (
                          <div className="flex justify-center pt-6 no-pdf">
                            <button
                              onClick={() => {
                                const score = Object.entries(userAnswers).filter(([qIdx, oIdx]) => mcqs[parseInt(qIdx)].correctAnswer === oIdx).length;
                                saveExamResult(score, mcqs.length, input);
                                setShowResults(true);
                              }}
                              disabled={Object.keys(userAnswers).length < mcqs.length}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-emerald-200 transition-all disabled:opacity-50 flex items-center gap-3"
                            >
                              Check Results <ChevronRight size={24} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 bg-[#0A0A0B] text-white overflow-hidden relative">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-sm font-black text-emerald-500 uppercase tracking-[0.3em] mb-6">Our Mission</h2>
                <h3 className="text-5xl md:text-6xl font-black mb-8 leading-[1.1] tracking-tight">
                  Redefining the <br />
                  <span className="text-slate-500">Future of Learning.</span>
                </h3>
                <p className="text-slate-400 text-xl mb-10 leading-relaxed max-w-xl">
                  Unischool is more than just a tool; it's a personalized learning ecosystem. We leverage cutting-edge AI to bridge the gap between complex information and student understanding.
                </p>
                
                <div className="grid sm:grid-cols-2 gap-8">
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                      <Sparkles size={20} className="text-emerald-400" />
                    </div>
                    <h4 className="font-bold text-lg mb-2">AI-First Approach</h4>
                    <p className="text-slate-500 text-sm">Built on the latest LLM architectures for unmatched accuracy.</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                      <CheckCircle2 size={20} className="text-blue-400" />
                    </div>
                    <h4 className="font-bold text-lg mb-2">Student Centric</h4>
                    <p className="text-slate-500 text-sm">Designed by educators to solve real-world study challenges.</p>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="col-span-2 bg-gradient-to-br from-emerald-500 to-emerald-700 p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[240px] shadow-2xl shadow-emerald-500/20"
              >
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center">
                    <GraduationCap size={24} className="text-white" />
                  </div>
                  <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Global Reach</span>
                </div>
                <div>
                  <p className="text-5xl font-black text-white mb-2">50k+</p>
                  <p className="text-white/80 font-medium">Students empowered worldwide every month.</p>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-md"
              >
                <p className="text-3xl font-black text-blue-400 mb-2">99.9%</p>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Uptime</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-md"
              >
                <p className="text-3xl font-black text-purple-400 mb-2">24/7</p>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Support</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-20">
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
                <li><a href="#features" className="hover:text-emerald-600">Features</a></li>
                <li><a href="#workspace" className="hover:text-emerald-600">Workspace</a></li>
                <li><a href="#about" className="hover:text-emerald-600">About Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-6">Legal</h4>
              <ul className="space-y-4 text-sm text-slate-500 font-semibold">
                <li><a href="#" className="hover:text-emerald-600">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-emerald-600">Terms of Service</a></li>
                <li><button onClick={() => setView('admin')} className="flex items-center gap-2 text-slate-300 hover:text-emerald-600 transition-colors">
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
}
