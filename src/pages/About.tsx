import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, ExternalLink, Mail, Globe, ShieldCheck, Zap, FileText, Lock, Eye, Scale, ChevronDown, ChevronUp, Timer } from 'lucide-react';

export default function About() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
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
        className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 text-center space-y-8"
      >
        <div className="space-y-3">
          <h2 className="text-3xl font-black text-slate-900">Developer Information</h2>
          <p className="text-slate-500 font-medium">Crafted with ❤️ for students worldwide by Harshit Singh.</p>
        </div>
        
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="https://harxshit.in" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
            >
              <Globe className="w-5 h-5 text-orange-500" />
              harxshit.in
            </a>
            <a 
              href="mailto:victus.harshit1609@gmail.com" 
              className="flex items-center gap-3 bg-white border-2 border-slate-100 px-8 py-4 rounded-2xl font-black text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
            >
              <Mail className="w-5 h-5 text-orange-500" />
              Contact Developer
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
