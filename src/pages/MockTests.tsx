import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Play, 
  AlertCircle,
  Brain,
  ArrowLeft,
  ArrowRight,
  Send,
  BarChart3
} from 'lucide-react';
import { db, auth } from '../utils/firebase';
import { collection, query, where, getDocs, addDoc, orderBy, limit } from 'firebase/firestore';
import { getAI, withRetry } from '../utils/aiClient';

export default function MockTests() {
  const [tests, setTests] = useState<any[]>([]);
  const [activeTest, setActiveTest] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTestActive, setIsTestActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTests();
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isTestActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTestActive) {
      handleFinishTest();
    }
    return () => clearInterval(interval);
  }, [isTestActive, timeLeft]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "mock_tests"), limit(50));
      const snap = await getDocs(q);
      const testsData = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, 10);
      setTests(testsData);
    } catch (err) {
      console.error("Error fetching tests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = (test: any) => {
    setActiveTest(test);
    setAnswers({});
    setCurrentQuestion(0);
    setTimeLeft(test.questions.length * 60); // 1 min per question
    setIsTestActive(true);
    setResult(null);
  };

  const handleFinishTest = async () => {
    if (!activeTest || !auth.currentUser) return;
    setIsSubmitting(true);
    setIsTestActive(false);

    let score = 0;
    activeTest.questions.forEach((q: any, idx: number) => {
      if (answers[idx] === q.correctAnswer) score++;
    });

    const finalScore = (score / activeTest.questions.length) * 100;

    try {
      const ai = await getAI();
      const prompt = `Analyze the student's performance in a mock test on ${activeTest.subject}. 
      Score: ${score}/${activeTest.questions.length} (${finalScore}%). 
      Questions: ${JSON.stringify(activeTest.questions)}. 
      Student Answers: ${JSON.stringify(answers)}. 
      Provide a detailed feedback on weaknesses and what topics to revisit. Use Markdown.`;

      const response = await withRetry(() => ai.generateContent({
        contents: [{ parts: [{ text: prompt }] }],
        feature: 'MOCK_TEST_FEEDBACK'
      }));

      const resultData = {
        testId: activeTest.id,
        userId: auth.currentUser.uid,
        score: finalScore,
        feedback: response.text,
        answers: Object.values(answers),
        createdAt: Date.now()
      };

      await addDoc(collection(db, "test_results"), resultData);
      setResult(resultData);
    } catch (err) {
      console.error("Error submitting test:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (activeTest && isTestActive) {
    const q = activeTest.questions[currentQuestion];
    return (
      <div className="min-h-screen bg-white p-6 md:p-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black">
                {currentQuestion + 1}
              </div>
              <div>
                <h2 className="font-black text-slate-900 text-xl">{activeTest.title}</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Question {currentQuestion + 1} of {activeTest.questions.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 font-black text-lg">
              <Clock size={20} />
              {formatTime(timeLeft)}
            </div>
          </div>

          <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 mb-12">
            <h3 className="text-2xl font-bold text-slate-800 leading-relaxed mb-8">
              {q.question}
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {q.options.map((option: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setAnswers({ ...answers, [currentQuestion]: option })}
                  className={`p-6 rounded-3xl text-left font-bold transition-all border-2 ${
                    answers[currentQuestion] === option 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-100' 
                      : 'bg-white text-slate-600 border-white hover:border-blue-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${
                      answers[currentQuestion] === option ? 'bg-white/20' : 'bg-slate-100'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {option}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button 
              disabled={currentQuestion === 0}
              onClick={() => setCurrentQuestion(prev => prev - 1)}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all"
            >
              <ArrowLeft size={16} /> Previous
            </button>
            
            {currentQuestion === activeTest.questions.length - 1 ? (
              <button 
                onClick={handleFinishTest}
                className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2"
              >
                Submit Test <Send size={16} />
              </button>
            ) : (
              <button 
                onClick={() => setCurrentQuestion(prev => prev + 1)}
                className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
              >
                Next Question <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-[#f8fafc] py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-12 rounded-[4rem] shadow-xl shadow-blue-100/50 border border-slate-100 text-center mb-12">
            <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center text-blue-600 mx-auto mb-8">
              <Trophy size={48} />
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-2">Test Complete!</h2>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-sm">Your Final Score</p>
            <div className="text-8xl font-black text-blue-600 tracking-tighter my-8">
              {Math.round(result.score)}%
            </div>
            <button 
              onClick={() => setResult(null)}
              className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all active:scale-95"
            >
              Back to Tests
            </button>
          </div>

          <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100">
            <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <Brain className="text-blue-600" />
              AI Performance Analysis
            </h3>
            <div className="prose prose-slate max-w-none">
              <div className="whitespace-pre-wrap font-medium text-slate-700 leading-relaxed">
                {result.feedback}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <div className="bg-white border-b border-slate-200 px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
            <BarChart3 className="text-blue-600" />
            Mock Test Simulator
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-lg">Practice with timed exams and get instant AI feedback on your weak areas.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {tests.map((test) => (
              <motion.div
                key={test.id}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <BookOpen size={32} />
                  </div>
                  <div className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {test.questions.length} Questions
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">{test.title}</h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">{test.subject}</p>
                
                <button 
                  onClick={() => handleStartTest(test)}
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  Start Simulator <Play size={16} fill="currentColor" />
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-300">
            <AlertCircle size={48} className="text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 font-bold text-lg">No mock tests available yet.</p>
            <p className="text-slate-400 text-sm">Admins will add tests soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BookOpen({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
}
