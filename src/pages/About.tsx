import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, ExternalLink, Mail, Globe, ShieldCheck, Zap, FileText, Lock, Eye, Scale, ChevronDown, ChevronUp, Timer, Share2, X, Brain, Headphones, ScanLine, FileUp, Sparkles } from 'lucide-react';

export default function About() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showSharePopup, setShowSharePopup] = useState(false);

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'AI CBT Platform',
      text: 'Check out this amazing AI-powered Computer Based Test platform!',
      url: window.location.origin
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      setShowSharePopup(true);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    alert('Link copied to clipboard!');
    setShowSharePopup(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="bg-orange-500 w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-orange-200 rotate-3 hover:rotate-0 transition-transform duration-500">
          <GraduationCap className="w-12 h-12" />
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tight">AI CBT <span className="text-orange-500">Platform</span></h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">
          The next generation of exam preparation, powered by Gemini AI. Crafted for excellence.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button 
            onClick={handleShare}
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors mt-4"
          >
            <Share2 className="w-5 h-5" />
            Share App
          </button>
          <button 
            onClick={() => {
              localStorage.removeItem('has_seen_intro');
              window.location.reload();
            }}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors mt-4"
          >
            <Sparkles className="w-5 h-5 text-orange-500" />
            Show Intro Again
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 relative">
            <div className="bg-orange-500 p-2 rounded-xl text-white">
              <Zap className="w-5 h-5" />
            </div>
            What is AI CBT?
          </h2>
          <p className="text-slate-600 leading-relaxed relative">
            AI CBT is an advanced Computer Based Test (CBT) platform designed to bridge the gap between static PDF exam papers and interactive digital practice. 
            Using state-of-the-art AI, it extracts questions, options, and answers from your study materials to create a real-time exam environment.
          </p>
          <div className="space-y-4 pt-4 relative">
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Key Features</h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { icon: Globe, text: "Bilingual Support (English & Hindi)", color: "text-blue-500" },
                { icon: Timer, text: "Real-time Timer & Negative Marking", color: "text-emerald-500" },
                { icon: FileText, text: "OMR Scanning for Physical Practice", color: "text-orange-500" },
                { icon: ShieldCheck, text: "Cloud Sharing & Leaderboards", color: "text-purple-500" }
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                  <span className="text-sm font-bold text-slate-700">{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl space-y-8 relative overflow-hidden"
        >
          <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-500" />
          <h2 className="text-2xl font-black flex items-center gap-3">
            <div className="bg-orange-500 p-2 rounded-xl text-white">
              <FileText className="w-5 h-5" />
            </div>
            How to Use?
          </h2>
          <div className="space-y-8">
            {[
              { step: "1", title: "Set API Key", desc: "Add your Gemini API key in Settings for AI extraction." },
              { step: "2", title: "Upload PDF", desc: "Upload MCQ PDFs. AI extracts questions automatically." },
              { step: "3", title: "Practice", desc: "Start exams, track time, and get instant results." }
            ].map((s, i) => (
              <div key={i} className="flex gap-5 group">
                <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center font-black text-lg shrink-0 group-hover:rotate-12 transition-transform">
                  {s.step}
                </div>
                <div>
                  <h4 className="font-black text-lg mb-1">{s.title}</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-20 -mt-20" />
        <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3 relative z-10">
          <div className="bg-blue-500 p-2 rounded-xl text-white">
            <Brain className="w-6 h-6" />
          </div>
          AI Models & Features
        </h2>
        <p className="text-slate-600 leading-relaxed text-lg relative z-10">
          AI CBT is powered by multiple specialized AI models designed to enhance every aspect of your exam preparation. Here is how they work:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {[
            {
              title: "ParikshAI Mode",
              icon: Brain,
              color: "text-purple-500",
              bgColor: "bg-purple-50",
              desc: "Upload past papers to get deep trend reports, chapter-wise analysis, and generate personalized study strategies instantly."
            },
            {
              title: "AI Vidyalay",
              icon: GraduationCap,
              color: "text-blue-500",
              bgColor: "bg-blue-50",
              desc: "Generate comprehensive study materials, detailed notes, and visual slides from any topic or chapter name."
            },
            {
              title: "AI Summary Podcast",
              icon: Headphones,
              color: "text-emerald-500",
              bgColor: "bg-emerald-50",
              desc: "Get a detailed, narrated audio summary of any topic. Listen and learn on the go, then take a quick test on what you heard."
            },
            {
              title: "PDF to CBT Extraction",
              icon: FileUp,
              color: "text-orange-500",
              bgColor: "bg-orange-50",
              desc: "Convert static PDF exam papers into interactive online tests automatically using advanced vision and text extraction models."
            },
            {
              title: "OMR Sheet Scanning",
              icon: ScanLine,
              color: "text-pink-500",
              bgColor: "bg-pink-50",
              desc: "Scan physical OMR sheets using your device camera to instantly grade them against digital answer keys with high accuracy."
            }
          ].map((feature, idx) => (
            <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-2xl ${feature.bgColor} flex items-center justify-center mb-4`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-slate-600 font-medium leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-orange-50 p-10 rounded-[3rem] border border-orange-100 space-y-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Lock className="w-32 h-32 text-orange-900" />
        </div>
        <h2 className="text-2xl font-black text-orange-900 flex items-center gap-3">
          <ShieldCheck className="w-6 h-6" />
          Why do I need an API Key?
        </h2>
        <p className="text-orange-800/80 leading-relaxed text-lg font-medium relative z-10">
          AI CBT uses Google's <strong>Gemini 3 Flash</strong> model to process your PDFs. Since AI processing consumes computational resources, 
          using your own API key ensures that the service remains free and private for you. Your key is stored <strong>locally</strong> on your browser 
          and is never sent to our servers.
        </p>
        <a 
          href="https://aistudio.google.com/app/apikey" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-orange-500 text-white px-8 py-4 rounded-2xl font-black hover:bg-orange-600 transition-all shadow-xl shadow-orange-200 active:scale-95"
        >
          Get your free API Key here
          <ExternalLink className="w-5 h-5" />
        </a>
      </motion.div>

      {/* Legal Sections */}
      <div className="space-y-4">
        {[
          {
            id: 'terms',
            title: 'Terms of Service',
            icon: Scale,
            content: `By using AI CBT, you agree to the following terms:
            1. Use of Service: This platform is for educational purposes only.
            2. Content Ownership: You retain rights to the PDFs you upload.
            3. AI Processing: We use Google Gemini API for processing. You are responsible for your own API key usage.
            4. No Warranty: The service is provided "as is" without any warranties.`
          },
          {
            id: 'privacy',
            title: 'Privacy Policy',
            icon: Eye,
            content: `Your privacy is our priority:
            1. Local Storage: Your API keys and exam data are stored locally in your browser's IndexedDB.
            2. No Tracking: We do not track your personal identity or exam content on our servers.
            3. Third Party: When using the AI features, your data is processed by Google Gemini API according to their privacy policy.
            4. Public Sharing: Only tests you explicitly "Share" become public on the Explore page.`
          }
        ].map((section) => (
          <div key={section.id} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden">
            <button 
              onClick={() => toggleSection(section.id)}
              className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 p-3 rounded-xl text-slate-600">
                  <section.icon className="w-5 h-5" />
                </div>
                <span className="text-lg font-black text-slate-900">{section.title}</span>
              </div>
              {expandedSection === section.id ? <ChevronUp /> : <ChevronDown />}
            </button>
            <AnimatePresence>
              {expandedSection === section.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 pb-6"
                >
                  <div className="pt-4 border-t border-slate-50 text-slate-600 whitespace-pre-line leading-relaxed font-medium">
                    {section.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-slate-900 p-12 rounded-[3.5rem] border border-slate-800 shadow-2xl shadow-slate-900/50 text-center space-y-8 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500" />
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
        
        <div className="space-y-3 relative z-10">
          <div className="bg-orange-500/10 text-orange-500 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest inline-block mb-4 border border-orange-500/20">
            Featured Developer
          </div>
          <h2 className="text-4xl font-black text-white">Harshit Singh</h2>
          <p className="text-slate-400 font-medium text-lg max-w-xl mx-auto">
            Crafting the future of digital education. Dedicated to building tools that empower students and educators worldwide.
          </p>
        </div>
        
        <div className="flex flex-col items-center gap-6 relative z-10">
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="https://harxshit.in" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-2xl font-black hover:bg-slate-100 transition-all shadow-xl shadow-white/5 active:scale-95"
            >
              <Globe className="w-5 h-5 text-orange-500" />
              Visit Portfolio
            </a>
            <a 
              href="mailto:support@harxshit.in" 
              className="flex items-center gap-3 bg-slate-800 border border-slate-700 px-8 py-4 rounded-2xl font-black text-white hover:bg-slate-700 transition-all active:scale-95"
            >
              <Mail className="w-5 h-5 text-orange-500" />
              Get in Touch
            </a>
          </div>
        </div>
      </motion.div>

      {/* Share Popup Fallback */}
      <AnimatePresence>
        {showSharePopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative text-center"
            >
              <button 
                onClick={() => setShowSharePopup(false)}
                className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Share2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Share AI CBT</h3>
              <p className="text-slate-500 font-medium mb-8">
                Share this amazing platform with your friends and help them prepare better for their exams!
              </p>
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600 truncate mr-4">
                  {window.location.origin}
                </span>
                <button 
                  onClick={copyLink}
                  className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  Copy Link
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
