import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Sparkles, FileText, HelpCircle, ArrowRight, BrainCircuit, AlignLeft, GraduationCap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] items-center relative max-w-4xl mx-auto px-4 pb-32">
      
      {/* Mode Switcher */}
      <div className="mt-6 bg-slate-100 p-1 rounded-full inline-flex items-center border border-slate-200">
        <button 
          className="px-6 py-2 rounded-full text-sm font-bold bg-white text-slate-900 shadow-sm"
        >
          Normal Mode
        </button>
        <button 
          onClick={() => navigate('/parikshai')}
          className="px-6 py-2 rounded-full text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          ParikshAI Mode
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center w-full space-y-12 mt-8">
        
        {/* Hero / Greeting */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="inline-flex items-center justify-center p-4 bg-orange-50 rounded-3xl mb-2">
            <Sparkles className="w-10 h-10 text-orange-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            How can I help you <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">prepare today?</span>
          </h1>
        </motion.div>

        {/* Action Cards / Suggestions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl"
        >
          <button 
            onClick={() => navigate('/upload')}
            className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:border-orange-300 hover:shadow-md hover:shadow-orange-500/10 transition-all text-left group"
          >
            <div className="bg-slate-50 p-3 rounded-xl group-hover:bg-orange-50 transition-colors">
              <FileText className="w-6 h-6 text-slate-600 group-hover:text-orange-500 transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Generate CBT Exam</h3>
          </button>

          <button 
            onClick={() => navigate('/about')}
            className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/10 transition-all text-left group"
          >
            <div className="bg-slate-50 p-3 rounded-xl group-hover:bg-blue-50 transition-colors">
              <HelpCircle className="w-6 h-6 text-slate-600 group-hover:text-blue-500 transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">How it works</h3>
          </button>
        </motion.div>

      </div>

      {/* Bottom Floating Input Bar & Menu */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="fixed bottom-6 left-0 right-0 px-4 flex flex-col items-center pointer-events-none z-50"
      >
        <AnimatePresence>
          {showOptions && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="w-full max-w-3xl bg-white border border-slate-200 shadow-2xl rounded-3xl p-2 mb-4 pointer-events-auto overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-slate-100 mb-2">
                <span className="font-bold text-slate-800">Select Action</span>
                <button onClick={() => setShowOptions(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2">
                <button onClick={() => navigate('/upload')} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-orange-50 text-left group transition-colors">
                  <div className="bg-orange-100 p-2 rounded-xl text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">Generate CBT Exam</div>
                    <div className="text-xs text-slate-500">Create a test from PDF</div>
                  </div>
                </button>
                <button onClick={() => navigate('/parikshai')} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-blue-50 text-left group transition-colors">
                  <div className="bg-blue-100 p-2 rounded-xl text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">Add to ParikshAI</div>
                    <div className="text-xs text-slate-500">Advanced AI analysis</div>
                  </div>
                </button>
                <button onClick={() => navigate('/ai-summary')} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-purple-50 text-left group transition-colors">
                  <div className="bg-purple-100 p-2 rounded-xl text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                    <AlignLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-2">AI Summary</div>
                    <div className="text-xs text-slate-500">Summarize documents</div>
                  </div>
                </button>
                <button onClick={() => navigate('/ai-vidyalay')} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 text-left group transition-colors">
                  <div className="bg-slate-200 p-2 rounded-xl text-slate-600">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-2">AI Vidyalay</div>
                    <div className="text-xs text-slate-500">Virtual AI tutor</div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div 
          onClick={() => setShowOptions(!showOptions)}
          className="w-full max-w-3xl bg-white border border-orange-200 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-[2.5rem] p-2 pl-4 pr-2 flex items-center gap-4 cursor-pointer pointer-events-auto hover:border-orange-400 hover:shadow-[0_8px_30px_rgba(249,115,22,0.15)] transition-all group"
        >
          <div className="bg-orange-100 p-3 rounded-full transition-colors">
            <Plus className="w-6 h-6 text-orange-600" />
          </div>
          <div className="flex-1 text-slate-600 text-lg font-medium transition-colors">
            Upload your PDF to get analysis...
          </div>
          <div className="bg-orange-500 p-3 rounded-full hover:bg-orange-600 transition-colors shadow-md">
            <ArrowRight className="w-6 h-6 text-white" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
