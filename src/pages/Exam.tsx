import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBank, QuestionBank, saveResult, ExamResult } from '../utils/storage';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Flag, 
  CheckCircle2, 
  AlertCircle,
  LayoutGrid,
  Maximize2,
  Minimize2,
  User,
  Zap,
  BarChart3,
  Save,
  MessageSquare,
  HelpCircle,
  FileText,
  List,
  Timer,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Exam() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [marked, setMarked] = useState<boolean[]>([]);
  const [timeLeft, setTimeLeft] = useState(3600);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (id) {
      getBank(id).then((data) => {
        if (data) {
          setBank(data);
          setAnswers(new Array(data.questions.length).fill(null));
          setMarked(new Array(data.questions.length).fill(false));
          setQuestionTimes(new Array(data.questions.length).fill(0));
          const limit = data.timeLimit ? data.timeLimit * 60 : data.questions.length * 60;
          setTimeLeft(limit);
        }
      });
    }
  }, [id]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          submitExam();
          return 0;
        }
        return prev - 1;
      });
      
      setQuestionTimes(prev => {
        const next = [...prev];
        next[currentIdx] += 1;
        return next;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [bank, currentIdx]);

  const submitExam = useCallback(async () => {
    if (!bank) return;
    const correctAnswers = bank.questions.map(q => q.correct);
    let correctCount = 0;
    let incorrectCount = 0;
    
    answers.forEach((ans, i) => {
      if (ans !== null) {
        if (ans === correctAnswers[i]) correctCount++;
        else incorrectCount++;
      }
    });

    const score = (correctCount * 1) - (incorrectCount * (bank.negativeMarking || 0));
    const timeTaken = (bank.timeLimit ? bank.timeLimit * 60 : bank.questions.length * 60) - timeLeft;
    const accuracy = answers.filter(a => a !== null).length > 0 
      ? (correctCount / answers.filter(a => a !== null).length) * 100 
      : 0;

    const results = {
      bankId: bank.bankId,
      bankName: bank.name,
      totalQuestions: bank.questions.length,
      answers,
      correctAnswers,
      timeTaken,
      negativeMarking: bank.negativeMarking || 0,
      timestamp: Date.now()
    };

    // Save to global results for leaderboard
    const candidateName = localStorage.getItem('candidate_name') || 'Harshit Singh';
    const examResult: ExamResult = {
      resultId: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      bankId: bank.bankId,
      candidateName,
      score,
      totalQuestions: bank.questions.length,
      correctCount,
      incorrectCount,
      timeTaken,
      timestamp: Date.now(),
      accuracy
    };

    await saveResult(examResult);
    localStorage.setItem('last_exam_results', JSON.stringify(results));
    navigate('/results');
  }, [bank, answers, timeLeft, navigate]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!bank) return <div className="flex items-center justify-center min-h-[60vh]"><Clock className="animate-spin text-orange-500" /></div>;

  const currentQuestion = bank.questions[currentIdx];
  const answeredCount = answers.filter(a => a !== null).length;
  const unattemptedCount = bank.questions.length - answeredCount;

  return (
    <div className={`flex flex-col h-screen bg-slate-50 fixed inset-0 z-[100] overflow-hidden`}>
      {/* Modern AI CBT Header */}
      <header className="bg-white border-b border-slate-100 px-4 md:px-6 py-2 md:py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 md:gap-6">
          <button 
            onClick={() => navigate(-1)} 
            className="p-1.5 md:p-2 hover:bg-slate-50 rounded-xl md:rounded-2xl text-slate-400 hover:text-slate-800 transition-all"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 md:gap-2">
              <span className="bg-orange-500 text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest px-1.5 md:px-2 py-0.5 rounded-md">Live</span>
              <h1 className="text-sm md:text-lg font-bold text-slate-900 line-clamp-1 max-w-[120px] md:max-w-none">{bank.name}</h1>
            </div>
            <div className="hidden md:flex items-center gap-3 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {bank.questions.length} Questions</span>
              <span className="w-1 h-1 bg-slate-200 rounded-full" />
              <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Neg: {bank.negativeMarking || 0}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-2xl font-bold transition-all ${isFocusMode ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            {isFocusMode ? 'Exit Focus' : 'Focus Mode'}
          </button>
          <div className={`flex items-center gap-2 md:gap-3 px-3 md:px-5 py-1.5 md:py-2 rounded-xl md:rounded-2xl font-mono font-bold text-sm md:text-lg transition-all ${timeLeft < 300 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-900 text-white shadow-lg shadow-slate-200'}`}>
            <Timer className="w-4 h-4 md:w-5 md:h-5" />
            {formatTime(timeLeft)}
          </div>
          <button 
            onClick={() => setShowConfirm(true)}
            className="bg-orange-500 text-white px-4 md:px-8 py-1.5 md:py-2 rounded-xl md:rounded-2xl text-sm md:text-base font-bold shadow-xl shadow-orange-100 hover:bg-orange-600 transition-all active:scale-95"
          >
            Submit
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Question Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Question Meta Bar */}
          <div className="bg-white/50 backdrop-blur-sm border-b border-slate-100 px-4 md:px-8 py-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 md:gap-4">
              <span className="text-xs md:text-sm font-bold text-slate-800">Q. {currentIdx + 1}</span>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-center gap-2 text-[10px] md:text-xs font-medium text-slate-500">
                <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                <span className="hidden sm:inline">Time Spent:</span> <span className="text-slate-900 font-bold">{formatTime(questionTimes[currentIdx])}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  const newMarked = [...marked];
                  newMarked[currentIdx] = !marked[currentIdx];
                  setMarked(newMarked);
                }}
                className={`flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-xl text-[10px] md:text-xs font-bold transition-all ${marked[currentIdx] ? 'bg-yellow-100 text-yellow-700 shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                <Flag className={`w-3 h-3 md:w-3.5 md:h-3.5 ${marked[currentIdx] ? 'fill-yellow-700' : ''}`} />
                <span className="hidden sm:inline">{marked[currentIdx] ? 'Marked' : 'Mark for Review'}</span>
                <span className="sm:hidden">{marked[currentIdx] ? 'Marked' : 'Review'}</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl mx-auto w-full">
            <motion.div 
              key={currentIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl shadow-slate-200/20 border border-slate-100 relative"
            >
              <div className="prose prose-slate max-w-none mb-6 md:mb-8">
                <p className="text-base md:text-xl text-slate-800 leading-relaxed font-bold">
                  {currentQuestion.question}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 md:gap-3">
                {currentQuestion.options.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const newAnswers = [...answers];
                      newAnswers[currentIdx] = i;
                      setAnswers(newAnswers);
                    }}
                    className={`flex items-center gap-3 md:gap-4 p-3 md:p-5 rounded-xl md:rounded-[1.5rem] border-2 text-left transition-all group relative overflow-hidden ${
                      answers[currentIdx] === i 
                        ? 'border-orange-500 bg-orange-50/30' 
                        : 'border-slate-50 bg-slate-50/30 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-sm md:text-base font-black transition-all shrink-0 ${
                      answers[currentIdx] === i 
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' 
                        : 'bg-white text-slate-400 border border-slate-100 group-hover:bg-slate-100'
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                    <span className={`text-sm md:text-base font-semibold leading-relaxed ${answers[currentIdx] === i ? 'text-orange-900' : 'text-slate-700'}`}>
                      {option}
                    </span>
                    {answers[currentIdx] === i && (
                      <motion.div 
                        layoutId="active-indicator"
                        className="absolute right-4 md:right-6"
                      >
                        <div className="bg-orange-500 p-1 rounded-full text-white shadow-lg shadow-orange-200">
                          <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" />
                        </div>
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Modern Footer Navigation */}
          <footer className="bg-white border-t border-slate-100 p-3 md:p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 md:gap-3">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(prev => prev - 1)}
                className="flex items-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-xs md:text-base font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </button>
              <button
                onClick={() => {
                  const newAnswers = [...answers];
                  newAnswers[currentIdx] = null;
                  setAnswers(newAnswers);
                }}
                className="px-3 md:px-6 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-[10px] md:text-base font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <span className="hidden sm:inline">Clear Response</span>
                <span className="sm:hidden">Clear</span>
              </button>
            </div>
            
            <button
              onClick={() => {
                if (currentIdx < bank.questions.length - 1) {
                  setCurrentIdx(prev => prev + 1);
                } else {
                  setShowConfirm(true);
                }
              }}
              className="flex items-center gap-2 md:gap-3 bg-slate-900 text-white px-5 md:px-10 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-xs md:text-base font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-300"
            >
              {currentIdx === bank.questions.length - 1 ? 'Finish' : 'Next'}
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </footer>
        </div>

        {/* Modern Sidebar */}
        {!isFocusMode && (
          <aside className="hidden lg:flex w-80 bg-white border-l border-slate-100 flex-col overflow-hidden shrink-0">
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* User Profile Card */}
              <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-100">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Harshit Singh</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: #AI-CBT-001</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center shadow-sm">
                    <div className="text-xl font-black text-emerald-500">{answeredCount}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Done</div>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center shadow-sm">
                    <div className="text-xl font-black text-slate-300">{unattemptedCount}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Left</div>
                  </div>
                </div>
              </div>

              {/* Question Palette */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-orange-500" />
                    Palette
                  </h4>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {bank.questions.map((_, i) => {
                    let statusClass = 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100';
                    if (currentIdx === i) statusClass = 'bg-orange-500 text-white border-orange-500 shadow-xl shadow-orange-100 scale-110 z-10';
                    else if (marked[i]) statusClass = 'bg-yellow-400 text-white border-yellow-400 shadow-sm';
                    else if (answers[i] !== null) statusClass = 'bg-emerald-500 text-white border-emerald-500 shadow-sm';

                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentIdx(i)}
                        className={`w-full aspect-square rounded-xl text-[10px] font-black transition-all border-2 ${statusClass}`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Performance Insights */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900">Insights</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-600" />
                      <span className="text-[10px] font-bold text-slate-700">Pace</span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 uppercase">Optimal</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-orange-600" />
                      <span className="text-[10px] font-bold text-slate-700">Accuracy</span>
                    </div>
                    <span className="text-[10px] font-black text-orange-600 uppercase">High</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {showMobileSidebar && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileSidebar(false)}
              className="lg:hidden fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.aside 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="lg:hidden fixed top-0 right-0 bottom-0 w-80 bg-white z-[160] shadow-2xl flex flex-col"
            >
              <div className="p-6 flex justify-between items-center border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Exam Palette</h3>
                <button onClick={() => setShowMobileSidebar(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-8 flex-1 overflow-y-auto">
                <div className="grid grid-cols-5 gap-2">
                  {bank.questions.map((_, i) => {
                    let statusClass = 'bg-slate-50 text-slate-400 border-slate-100';
                    if (currentIdx === i) statusClass = 'bg-orange-500 text-white border-orange-500';
                    else if (marked[i]) statusClass = 'bg-yellow-400 text-white border-yellow-400';
                    else if (answers[i] !== null) statusClass = 'bg-emerald-500 text-white border-emerald-500';

                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setCurrentIdx(i);
                          setShowMobileSidebar(false);
                        }}
                        className={`w-full aspect-square rounded-xl text-xs font-black transition-all border-2 ${statusClass}`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-4">
                <button className="bg-white border border-slate-200 text-slate-600 py-3 rounded-2xl text-xs font-bold">Paper</button>
                <button onClick={() => { setShowConfirm(true); setShowMobileSidebar(false); }} className="bg-orange-500 text-white py-3 rounded-2xl text-xs font-bold">Submit</button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Floating Mobile Menu */}
      <button 
        onClick={() => setShowMobileSidebar(true)}
        className="lg:hidden fixed bottom-24 right-6 z-50 bg-slate-900 text-white p-4 rounded-3xl shadow-2xl shadow-slate-400"
      >
        <LayoutGrid className="w-6 h-6" />
      </button>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl"
            >
              <div className="bg-orange-50 w-20 h-20 rounded-[2rem] flex items-center justify-center text-orange-500 mb-8">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-3">Finish Exam?</h3>
              <p className="text-slate-500 leading-relaxed mb-10">
                You've completed <span className="text-slate-900 font-bold">{answeredCount}</span> out of <span className="text-slate-900 font-bold">{bank.questions.length}</span> questions. 
                Ready to see your results?
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={submitExam}
                  className="w-full bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-orange-100 hover:bg-orange-600 transition-all active:scale-95"
                >
                  Yes, Submit Now
                </button>
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="w-full px-8 py-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Keep Practicing
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
