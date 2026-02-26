import React, { useState, useRef } from 'react';
import { 
  Microscope, 
  Send, 
  Loader2, 
  Download, 
  Copy,
  ArrowLeft,
  Sparkles,
  ChevronRight,
  LogOut,
  FileUp,
  FileText,
  FileCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateResearchReview } from './services/geminiService';
import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

// Set up pdfjs worker using unpkg for reliability
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface User {
  email: string;
  name: string;
  profilePic?: string;
  bio?: string;
  address?: string;
  phone?: string;
}

interface ResearchPageProps {
  user: User;
  onBack: () => void;
  onLogout: () => void;
}

export const ResearchPage: React.FC<ResearchPageProps> = ({ user, onBack, onLogout }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAction = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await generateResearchReview(input, { 
        name: user.name, 
        institution: user.address 
      });
      setResult(res || "No review generated.");
    } catch (error) {
      console.error(error);
      setResult("An error occurred while generating the research review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      alert('LaTeX code copied to clipboard!');
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
    
    // Split text into lines to fit page width
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

  return (
    <div className="min-h-screen bg-white flex flex-col selection:bg-amber-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-28 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="h-20 flex items-center justify-center cursor-pointer" onClick={onBack}>
              <img 
                src="/logo.webp" 
                alt="Unischool" 
                className="h-full w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
              <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-xs text-white font-bold overflow-hidden">
                {user.profilePic ? (
                  <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 leading-none">{user.name}</span>
                <span className="text-[10px] text-slate-500 font-medium">Research Mode</span>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="text-slate-400 hover:text-red-500 transition-colors p-2"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-amber-50/30">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider mb-6">
              <Microscope size={14} /> Senior Scientific Researcher
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-8 leading-[1.1]">
              Formal Research <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">Review Generator.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-slate-600 mb-10 leading-relaxed">
              Paste a paper link, research topic, or upload a PDF to generate a professional LaTeX-formatted research review.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Workspace Section */}
      <section className="py-24 relative flex-1">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 mb-12">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest">
                  Paper Link, Research Text or PDF
                </label>
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
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste paper link, research topic, or upload a PDF..."
                className="w-full min-h-[200px] p-6 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 transition-all resize-none text-slate-800 placeholder:text-slate-300 text-lg"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleAction}
                disabled={loading || !input.trim()}
                className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-slate-200"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                {loading ? "Analyzing Research..." : "Generate LaTeX Review"}
              </button>
            </div>
          </div>

          {/* Results Section */}
          <AnimatePresence mode="wait">
            {(result || loading) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-24 text-slate-300 gap-6">
                    <div className="relative">
                      <Loader2 className="animate-spin text-amber-500" size={64} />
                      <Sparkles className="absolute -top-3 -right-3 text-amber-400 animate-pulse" size={24} />
                    </div>
                    <p className="font-bold text-lg animate-pulse tracking-tight">Researcher AI is analyzing...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                          <Microscope className="text-amber-600" size={20} />
                        </div>
                        Research Review (LaTeX)
                      </h2>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={handleCopy}
                          className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm"
                          title="Copy LaTeX"
                        >
                          <Copy size={18} /> Copy
                        </button>
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
                    </div>

                    <div className="bg-slate-900 rounded-[2rem] shadow-xl p-10 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-2 h-full bg-amber-500" />
                      <pre className="text-emerald-400 font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                        {result}
                      </pre>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-400 text-sm font-medium">
            © 2026 Unischool AI Research. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
