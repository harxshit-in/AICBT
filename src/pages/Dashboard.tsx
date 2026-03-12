import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Sparkles, FileText, HelpCircle, ArrowRight, BrainCircuit, AlignLeft, GraduationCap, X, Flame, Trophy, Target, ChevronRight, Newspaper, Loader2, BookOpen, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getUserStats, UserStats, saveBank, generateBankId, QuestionBank, getAllBanks } from '../utils/storage';
import { getAI, withRetry } from '../utils/aiClient';

export default function Dashboard() {
  const navigate = useNavigate();
  const [showOptions, setShowOptions] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isGeneratingChallenge, setIsGeneratingChallenge] = useState(false);
  const [banks, setBanks] = useState<QuestionBank[]>([]);

  useEffect(() => {
    getUserStats().then(setStats);
    getAllBanks().then(setBanks);
  }, []);

  const recentTests = banks.filter(b => b.category !== 'Daily Challenge').slice(0, 3);
  const scannedPDFs = banks.filter(b => b.sourceFile !== 'AI Generated').slice(0, 3);

  const handleDailyChallenge = async () => {
    if (!stats || isGeneratingChallenge) return;
    
    setIsGeneratingChallenge(true);
    try {
      const weakestSubject = Object.entries(stats.subjectMastery)
        .sort(([, a], [, b]) => (a.correct / a.total) - (b.correct / b.total))[0];
      
      const subject = weakestSubject ? weakestSubject[0] : 'General Knowledge';
      
      const { ai, systemInstruction } = await getAI();
      const prompt = `
        Generate 10 high-quality multiple-choice questions for the subject: ${subject}.
        These are for SSC and Railway exams.
        
        Return ONLY a JSON array of objects with this structure:
        [
          {
            "question": "...",
            "options": ["...", "...", "...", "..."],
            "correct": 0,
            "section": "${subject}"
          }
        ]
      `;

      const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json', systemInstruction }
      }));

      const questions = JSON.parse(response.text || '[]');
      const bank: QuestionBank = {
        bankId: generateBankId(`Daily_Challenge_${Date.now()}`),
        name: `Daily Challenge: ${subject}`,
        questions,
        createdAt: Date.now(),
        sourceFile: 'AI Generated',
        timeLimit: 10,
        category: 'Daily Challenge',
        tags: ['Adaptive', 'Challenge', subject]
      };

      const id = await saveBank(bank);
      navigate(`/exam-overview/${id}`);
    } catch (error) {
      console.error('Challenge Generation Error:', error);
    } finally {
      setIsGeneratingChallenge(false);
    }
  };

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

      {/* User Stats Bar */}
      {stats && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm flex items-center gap-4">
            <div className="bg-orange-50 p-2.5 rounded-2xl">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{stats.streak}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Day Streak</div>
            </div>
          </div>
          <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm flex items-center gap-4">
            <div className="bg-blue-50 p-2.5 rounded-2xl">
              <Trophy className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{stats.totalXP}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total XP</div>
            </div>
          </div>
          <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm flex items-center gap-4">
            <div className="bg-emerald-50 p-2.5 rounded-2xl">
              <Target className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{stats.totalQuestionsSolved}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Solved</div>
            </div>
          </div>
          <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm flex items-center gap-4">
            <div className="bg-purple-50 p-2.5 rounded-2xl">
              <Sparkles className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">
                {Object.keys(stats.subjectMastery).length}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subjects</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Subject Mastery Dashboard */}
      {stats && Object.keys(stats.subjectMastery).length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full mt-12 space-y-8"
        >
          {/* Recommended Study Path */}
          {(() => {
            const weakestSubject = Object.entries(stats.subjectMastery)
              .sort(([, a], [, b]) => (a.correct / a.total) - (b.correct / b.total))[0];
            
            if (!weakestSubject) return null;
            const [subject, data] = weakestSubject;
            const percentage = Math.round((data.correct / data.total) * 100);

            return (
              <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-200">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] -mr-32 -mt-32" />
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-3 text-orange-400 font-black text-xs uppercase tracking-[0.2em]">
                    <Sparkles className="w-4 h-4" />
                    Recommended Next Step
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black">Focus on <span className="text-orange-500">{subject}</span></h3>
                    <p className="text-slate-400 font-medium max-w-xl">
                      Your current mastery is <span className="text-white font-bold">{percentage}%</span>. 
                      We recommend practicing 15-20 more questions in this area to strengthen your foundation.
                    </p>
                  </div>
                  <button 
                    onClick={() => navigate('/upload')}
                    className="inline-flex items-center gap-2 bg-orange-500 text-white px-8 py-4 rounded-2xl font-black hover:bg-orange-600 transition-all active:scale-95 shadow-xl shadow-orange-500/20"
                  >
                    Start Practice Session
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })()}

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-500" />
              Subject Mastery
            </h2>
            <button className="text-xs font-bold text-orange-500 flex items-center gap-1 hover:underline">
              View Detailed Report <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(stats.subjectMastery).map(([subject, data]) => {
              const percentage = Math.round((data.correct / data.total) * 100) || 0;
              return (
                <div key={subject} className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">{subject}</span>
                    <span className="text-xs font-black text-slate-400">{percentage}% Mastered</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className={`h-full ${percentage > 70 ? 'bg-emerald-500' : percentage > 40 ? 'bg-orange-500' : 'bg-rose-500'}`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>{data.correct} Correct</span>
                    <span>{data.total} Total</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

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

        {/* Daily Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
          <button 
            onClick={handleDailyChallenge}
            disabled={isGeneratingChallenge}
            className="flex flex-col gap-4 p-6 bg-slate-900 text-white rounded-[2.5rem] hover:bg-slate-800 transition-all text-left group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center">
              {isGeneratingChallenge ? <Loader2 className="w-6 h-6 animate-spin text-orange-500" /> : <Target className="w-6 h-6 text-orange-500" />}
            </div>
            <div>
              <h3 className="text-xl font-black">Daily Challenge</h3>
              <p className="text-slate-400 text-sm font-medium">Adaptive 10-min test based on your weak areas.</p>
            </div>
          </button>

          <button 
            onClick={() => navigate('/daily-news')}
            className="flex flex-col gap-4 p-6 bg-white border border-slate-200 rounded-[2.5rem] hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/5 transition-all text-left group"
          >
            <div className="bg-orange-50 w-12 h-12 rounded-2xl flex items-center justify-center group-hover:bg-orange-500 transition-colors">
              <Newspaper className="w-6 h-6 text-orange-500 group-hover:text-white transition-colors" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Current Affairs</h3>
              <p className="text-slate-500 text-sm font-medium">Daily news summary & quick quiz for SSC/Railways.</p>
            </div>
          </button>
        </div>

        {/* Features Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mt-8"
        >
          {[
            { name: 'ParikshAI', icon: BrainCircuit, path: '/parikshai', color: 'text-blue-500', bg: 'bg-blue-50' },
            { name: 'AI Summary', icon: AlignLeft, path: '/ai-summary', color: 'text-purple-500', bg: 'bg-purple-50' },
            { name: 'AI Vidyalay', icon: GraduationCap, path: '/ai-vidyalay', color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { name: 'How it works', icon: HelpCircle, path: '/about', color: 'text-slate-500', bg: 'bg-slate-50' },
          ].map((feature, i) => (
            <motion.button
              key={feature.name}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(feature.path)}
              className="flex flex-col items-center gap-3 p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all group"
            >
              <div className={`p-4 rounded-2xl ${feature.bg} group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-8 h-8 ${feature.color}`} />
              </div>
              <span className="font-bold text-slate-800 text-sm">{feature.name}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Recent Tests & Scanned PDFs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl mt-12"
        >
          {/* Recent Tests */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-orange-500" />
              Recent Tests
            </h3>
            <div className="space-y-3">
              {recentTests.map((bank, i) => (
                <motion.button 
                  key={bank.bankId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => navigate(`/exam-overview/${bank.bankId}`)}
                  className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-orange-300 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-50 p-2 rounded-xl text-slate-600 group-hover:text-orange-500">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-800 text-sm">{bank.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </motion.button>
              ))}
              {recentTests.length === 0 && <p className="text-sm text-slate-400 font-medium italic">No recent tests found.</p>}
            </div>
          </div>

          {/* Scanned PDFs */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Scanned PDFs
            </h3>
            <div className="space-y-3">
              {scannedPDFs.map((bank, i) => (
                <motion.button 
                  key={bank.bankId}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => navigate(`/exam-overview/${bank.bankId}`)}
                  className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-50 p-2 rounded-xl text-slate-600 group-hover:text-blue-500">
                      <Clock className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-800 text-sm">{bank.sourceFile}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </motion.button>
              ))}
              {scannedPDFs.length === 0 && <p className="text-sm text-slate-400 font-medium italic">No scanned PDFs found.</p>}
            </div>
          </div>
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
