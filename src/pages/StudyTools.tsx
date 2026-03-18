import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  FileText, 
  Mic, 
  Clock, 
  Calendar, 
  AlertCircle, 
  ChevronRight, 
  Play, 
  Pause, 
  RotateCcw,
  Volume2,
  Sparkles,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { getAI, withRetry } from '../utils/aiClient';
import { auth, db } from '../utils/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export default function StudyTools() {
  const [activeTab, setActiveTab] = useState<'countdown' | 'pomodoro' | 'ai-tools'>('countdown');
  const [exams, setExams] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pomodoro State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionType, setSessionType] = useState<'focus' | 'break'>('focus');

  // AI Tools State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [toolType, setToolType] = useState<'cheat-sheet' | 'predictor' | 'eli5'>('cheat-sheet');
  const [topic, setTopic] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const fetchData = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const examsQuery = query(collection(db, "exams"), where("userId", "==", auth.currentUser.uid), orderBy("date", "asc"));
      const examsSnap = await getDocs(examsQuery);
      setExams(examsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const sessionsQuery = query(collection(db, "study_sessions"), where("userId", "==", auth.currentUser.uid), orderBy("createdAt", "desc"), limit(10));
      const sessionsSnap = await getDocs(sessionsQuery);
      setSessions(sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching study data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionComplete = async () => {
    setIsActive(false);
    if (!auth.currentUser) return;
    
    const duration = sessionType === 'focus' ? 25 : 5;
    try {
      await addDoc(collection(db, "study_sessions"), {
        userId: auth.currentUser.uid,
        duration,
        type: sessionType,
        createdAt: Date.now()
      });
      
      // Toggle session type
      if (sessionType === 'focus') {
        setSessionType('break');
        setTimeLeft(5 * 60);
      } else {
        setSessionType('focus');
        setTimeLeft(25 * 60);
      }
      fetchData();
    } catch (err) {
      console.error("Error saving session:", err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const runAITool = async () => {
    if (!topic.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const ai = await getAI();
      let prompt = "";
      if (toolType === 'cheat-sheet') {
        prompt = `Generate a comprehensive one-page "Cheat Sheet" for the topic: ${topic}. Include key formulas, definitions, and critical facts for competitive exams like SSC/Banking. Use Markdown formatting.`;
      } else if (toolType === 'predictor') {
        prompt = `Analyze the topic: ${topic} and predict high-probability questions or sub-topics that are most likely to appear in upcoming competitive exams. Provide reasoning for each prediction. Use Markdown.`;
      } else if (toolType === 'eli5') {
        prompt = `Explain the topic: ${topic} like I'm 5 years old. Use simple analogies and zero jargon. Use Markdown.`;
      }

      const response = await withRetry(() => ai.generateContent({
        contents: [{ parts: [{ text: prompt }] }],
        feature: 'STUDY_TOOLS'
      }));
      setAiResult(response.text);
    } catch (err) {
      console.error("AI Tool Error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const speakResult = () => {
    if (!aiResult) return;
    const utterance = new SpeechSynthesisUtterance(aiResult.replace(/[#*`]/g, ''));
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Zap className="text-amber-500 fill-amber-500" />
            Study Power Tools
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Advanced AI-powered tools to supercharge your exam preparation.</p>
          
          <div className="flex gap-4 mt-8 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: 'countdown', label: 'Exam Countdown', icon: Calendar },
              { id: 'pomodoro', label: 'Focus Timer', icon: Clock },
              { id: 'ai-tools', label: 'AI Study Lab', icon: Sparkles },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'countdown' && (
            <motion.div
              key="countdown"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                    <TrendingUp size={120} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-6">Burnout Tracker</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Weekly Focus Score</span>
                      <span className="text-3xl font-black text-blue-600">84%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '84%' }}
                        className="h-full bg-blue-600 rounded-full"
                      />
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      You've studied for 12 hours this week. Your focus is high, but remember to take breaks to avoid mental fatigue.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                  <h3 className="text-xl font-black text-slate-900 mb-6">Upcoming Exams</h3>
                  {exams.length > 0 ? (
                    <div className="space-y-4">
                      {exams.map((exam) => {
                        const daysLeft = Math.ceil((exam.date - Date.now()) / (1000 * 60 * 60 * 24));
                        return (
                          <div key={exam.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                              <p className="font-black text-slate-900">{exam.name}</p>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{new Date(exam.date).toLocaleDateString()}</p>
                            </div>
                            <div className={`px-4 py-2 rounded-xl font-black text-sm ${daysLeft < 7 ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                              {daysLeft} Days Left
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                        <Calendar size={32} />
                      </div>
                      <p className="text-slate-400 font-bold text-sm">No exams added yet.</p>
                      <button className="mt-4 text-blue-600 font-black text-xs uppercase tracking-widest">Add Exam</button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'pomodoro' && (
            <motion.div
              key="pomodoro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <div className="bg-white p-12 rounded-[4rem] shadow-xl shadow-blue-100/50 border border-slate-100 text-center max-w-md w-full relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-2 ${sessionType === 'focus' ? 'bg-blue-600' : 'bg-emerald-500'}`} />
                
                <span className={`text-xs font-black uppercase tracking-[0.3em] mb-4 block ${sessionType === 'focus' ? 'text-blue-600' : 'text-emerald-600'}`}>
                  {sessionType === 'focus' ? 'Focus Session' : 'Short Break'}
                </span>
                
                <h2 className="text-8xl font-black text-slate-900 tracking-tighter mb-12">
                  {formatTime(timeLeft)}
                </h2>

                <div className="flex items-center justify-center gap-6">
                  <button 
                    onClick={() => setIsActive(!isActive)}
                    className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all active:scale-90 shadow-lg ${
                      isActive 
                        ? 'bg-slate-100 text-slate-600' 
                        : 'bg-blue-600 text-white shadow-blue-200'
                    }`}
                  >
                    {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                  </button>
                  <button 
                    onClick={() => {
                      setIsActive(false);
                      setTimeLeft(sessionType === 'focus' ? 25 * 60 : 5 * 60);
                    }}
                    className="w-20 h-20 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center hover:text-slate-600 transition-all"
                  >
                    <RotateCcw size={32} />
                  </button>
                </div>

                <div className="mt-12 pt-12 border-t border-slate-100">
                  <div className="flex items-center justify-center gap-2 text-amber-500">
                    <AlertCircle size={16} />
                    <p className="text-xs font-bold uppercase tracking-widest">Focus Mode Active</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ai-tools' && (
            <motion.div
              key="ai-tools"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex flex-wrap gap-4 mb-8">
                  {[
                    { id: 'cheat-sheet', label: 'Cheat Sheet', icon: FileText },
                    { id: 'predictor', label: 'Question Predictor', icon: TrendingUp },
                    { id: 'eli5', label: 'ELI5 Tutor', icon: BookOpen },
                  ].map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => setToolType(tool.id as any)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
                        toolType === tool.id 
                          ? 'bg-slate-900 text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <tool.icon size={18} />
                      {tool.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-4">
                  <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter topic (e.g., Trigonometry, Indian History...)"
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-blue-200 focus:bg-white transition-all font-bold text-slate-700"
                  />
                  <button 
                    onClick={runAITool}
                    disabled={aiLoading || !topic.trim()}
                    className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                  >
                    {aiLoading ? 'Analyzing...' : 'Generate'}
                  </button>
                </div>
              </div>

              {aiResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 relative"
                >
                  <div className="absolute top-8 right-8 flex gap-2">
                    <button 
                      onClick={speakResult}
                      className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                      title="AI Voice Tutor"
                    >
                      <Volume2 size={20} />
                    </button>
                  </div>
                  <div className="prose prose-slate max-w-none">
                    <div className="whitespace-pre-wrap font-medium text-slate-700 leading-relaxed">
                      {aiResult}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
