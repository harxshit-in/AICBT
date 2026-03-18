import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
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
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { saveBank } from '../utils/storage';

export default function MockTests() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTests();
  }, []);

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

  const handleStartTest = async (test: any) => {
    const bank = {
      bankId: test.id,
      name: test.title,
      questions: test.questions.map((q: any) => ({
        question: q.question,
        options: q.options,
        correct: q.options.indexOf(q.correctAnswer),
        section: q.section || 'General'
      })),
      createdAt: test.createdAt || Date.now(),
      sourceFile: 'mock_test',
      timeLimit: test.time,
      negativeMarking: test.negativeMarking
    };
    await saveBank(bank);
    navigate(`/exam/${test.id}`);
  };



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
