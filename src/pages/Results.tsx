import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCcw, 
  Home,
  ChevronDown,
  ChevronUp,
  Medal,
  Users,
  Target,
  Zap,
  Sparkles,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getBank, QuestionBank, getResultsForBank, ExamResult } from '../utils/storage';
import { getAI, withRetry } from '../utils/aiClient';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface ExamResults {
  bankId: string;
  bankName: string;
  totalQuestions: number;
  answers: (number | null)[];
  correctAnswers: number[];
  timeTaken: number;
  negativeMarking: number;
  timestamp: number;
}

export default function Results() {
  const navigate = useNavigate();
  const [results, setResults] = useState<ExamResults | null>(null);
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [leaderboard, setLeaderboard] = useState<ExamResult[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [explanations, setExplanations] = useState<Record<number, string>>({});
  const [loadingExplanations, setLoadingExplanations] = useState<Record<number, boolean>>({});

  const handleExplain = async (qIdx: number, question: string, options: string[], correctIdx: number, studentAnsIdx: number | null) => {
    if (loadingExplanations[qIdx]) return;
    
    setLoadingExplanations(prev => ({ ...prev, [qIdx]: true }));
    try {
      const ai = await getAI();
      const studentAnsText = studentAnsIdx !== null ? options[studentAnsIdx] : 'Skipped';
      const correctAnsText = options[correctIdx];
      
      const prompt = `
        As a personal exam mentor, explain why the student's answer is wrong or why they might have skipped it.
        
        Question: ${question}
        Options: ${options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join(', ')}
        Student's Answer: ${studentAnsText}
        Correct Answer: ${correctAnsText}
        
        Provide a concise, encouraging, and clear explanation of the concept and why the correct answer is right. 
        Use bullet points if needed. Keep it under 100 words.
      `;

      const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [{ parts: [{ text: prompt }] }]
      }));

      setExplanations(prev => ({ ...prev, [qIdx]: response.text || 'No explanation available.' }));
    } catch (error) {
      console.error('Error getting explanation:', error);
      setExplanations(prev => ({ ...prev, [qIdx]: 'Failed to get AI explanation. Please check your API key and try again.' }));
    } finally {
      setLoadingExplanations(prev => ({ ...prev, [qIdx]: false }));
    }
  };

  useEffect(() => {
    const data = localStorage.getItem('last_exam_results');
    if (data) {
      const parsed = JSON.parse(data);
      setResults(parsed);
      getBank(parsed.bankId).then(setBank);
      
      // Load Leaderboard
      getResultsForBank(parsed.bankId).then(allResults => {
        // Sort by score desc, then timeTaken asc
        const sorted = allResults.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.timeTaken - b.timeTaken;
        });
        setLeaderboard(sorted);
        
        // Find user's rank (based on current attempt timestamp)
        const rank = sorted.findIndex(r => r.timestamp === parsed.timestamp) + 1;
        setUserRank(rank > 0 ? rank : null);
      });
    } else {
      navigate('/');
    }
  }, [navigate]);

  if (!results) return null;

  const correctCount = results.answers.reduce((acc, ans, i) => 
    ans === results.correctAnswers[i] ? acc + 1 : acc, 0);
  
  const unattemptedCount = results.answers.filter(a => a === null).length;
  const incorrectCount = results.totalQuestions - correctCount - unattemptedCount;
  
  const rawScore = correctCount - (incorrectCount * results.negativeMarking);
  const finalScore = Math.max(0, parseFloat(rawScore.toFixed(2)));
  const percentage = Math.round((finalScore / results.totalQuestions) * 100);
  const isPass = percentage >= 60;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[3rem] p-12 shadow-xl shadow-slate-200/50 border border-slate-100 text-center relative overflow-hidden"
      >
        {/* Background Decoration */}
        <div className={`absolute top-0 left-0 right-0 h-2 ${isPass ? 'bg-emerald-500' : 'bg-orange-500'}`} />
        
        <div className={`w-24 h-24 mx-auto rounded-3xl flex items-center justify-center mb-8 ${isPass ? 'bg-emerald-50 bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-orange-50 bg-orange-500 text-white shadow-lg shadow-orange-100'}`}>
          <Trophy className="w-12 h-12" />
        </div>

        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          {isPass ? 'Congratulations!' : 'Keep Practicing!'}
        </h1>
        <p className="text-slate-500 text-lg mb-12">
          You scored <span className={`font-bold ${isPass ? 'text-emerald-600' : 'text-orange-600'}`}>{finalScore} / {results.totalQuestions}</span> ({percentage}%) in {results.bankName}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <div className="text-emerald-500 font-bold text-3xl mb-1">{correctCount}</div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Correct</div>
          </div>
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <div className="text-red-500 font-bold text-3xl mb-1">{incorrectCount}</div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Incorrect</div>
          </div>
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <div className="text-slate-500 font-bold text-3xl mb-1">{unattemptedCount}</div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Skipped</div>
          </div>
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <div className="text-slate-700 font-bold text-3xl mb-1 flex items-center justify-center gap-1">
              <Clock className="w-5 h-5" />
              {formatTime(results.timeTaken)}
            </div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Time Taken</div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate(`/exam/${results.bankId}`)}
            className="flex items-center justify-center gap-2 bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-900 transition-all active:scale-95"
          >
            <RotateCcw className="w-5 h-5" />
            Retake Exam
          </button>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 bg-white border-2 border-slate-100 text-slate-700 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </button>
        </div>
      </motion.div>

      {/* Leaderboard Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-orange-500 p-3 rounded-2xl text-white shadow-lg shadow-orange-100">
              <Medal className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Leaderboard</h2>
              <p className="text-slate-500 text-sm">Top performers for this exam</p>
            </div>
          </div>
          {userRank && (
            <div className="bg-slate-900 text-white px-6 py-2 rounded-2xl font-black text-sm">
              Your Rank: #{userRank}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {leaderboard.slice(0, 5).map((entry, idx) => (
            <div 
              key={entry.resultId}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                entry.timestamp === results.timestamp 
                  ? 'bg-orange-50 border-orange-200 shadow-md scale-[1.02] z-10' 
                  : 'bg-slate-50 border-slate-100'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${
                  idx === 0 ? 'bg-yellow-400 text-white' :
                  idx === 1 ? 'bg-slate-300 text-white' :
                  idx === 2 ? 'bg-orange-400 text-white' : 'bg-white text-slate-400 border border-slate-100'
                }`}>
                  {idx + 1}
                </div>
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    {entry.candidateName}
                    {entry.timestamp === results.timestamp && (
                      <span className="bg-orange-500 text-white text-[8px] px-1.5 py-0.5 rounded-md uppercase font-black">You</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {entry.accuracy.toFixed(1)}% Acc</span>
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {formatTime(entry.timeTaken)}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-slate-900">{entry.score.toFixed(1)}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Points</div>
              </div>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <div className="text-center py-10 text-slate-400 font-medium">
              No entries yet. Be the first to top the charts!
            </div>
          )}
        </div>
      </motion.div>

      {/* Review Section */}
      <div className="space-y-4">
        <button 
          onClick={() => setShowReview(!showReview)}
          className="w-full flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 font-bold text-slate-800 hover:bg-slate-50 transition-all"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            Review Questions & Answers
          </div>
          {showReview ? <ChevronUp /> : <ChevronDown />}
        </button>

        <AnimatePresence>
          {showReview && bank && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              {bank.questions.map((q, i) => {
                const studentAns = results.answers[i];
                const isCorrect = studentAns === q.correct;
                
                return (
                  <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 space-y-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <span className="bg-slate-100 text-slate-500 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                          {i + 1}
                        </span>
                        <h3 className="text-lg font-semibold text-slate-800 leading-relaxed">
                          {q.question}
                        </h3>
                      </div>
                      {studentAns === null ? (
                        <span className="text-xs font-bold text-slate-400 uppercase bg-slate-50 px-3 py-1 rounded-full">Skipped</span>
                      ) : isCorrect ? (
                        <CheckCircle2 className="text-emerald-500 w-6 h-6 shrink-0" />
                      ) : (
                        <XCircle className="text-red-500 w-6 h-6 shrink-0" />
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt, optIdx) => {
                        let borderClass = 'border-slate-100';
                        let bgClass = '';
                        let textClass = 'text-slate-600';

                        if (optIdx === q.correct) {
                          borderClass = 'border-emerald-500';
                          bgClass = 'bg-emerald-50';
                          textClass = 'text-emerald-900 font-bold';
                        } else if (optIdx === studentAns && !isCorrect) {
                          borderClass = 'border-red-500';
                          bgClass = 'bg-red-50';
                          textClass = 'text-red-900 font-bold';
                        }

                        return (
                          <div key={optIdx} className={`p-4 rounded-2xl border-2 flex items-center gap-3 ${borderClass} ${bgClass}`}>
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                              optIdx === q.correct ? 'bg-emerald-500 text-white' : 
                              optIdx === studentAns ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {String.fromCharCode(65 + optIdx)}
                            </div>
                            <span className={textClass}>{opt}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* AI Explanation Button */}
                    {!isCorrect && (
                      <div className="pt-4 border-t border-slate-50">
                        {explanations[i] ? (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-orange-50 p-6 rounded-2xl border border-orange-100"
                          >
                            <div className="flex items-center gap-2 mb-3 text-orange-600 font-black text-xs uppercase tracking-widest">
                              <Sparkles className="w-4 h-4" />
                              AI Mentor Explanation
                            </div>
                            <div className="prose prose-slate prose-sm max-w-none text-slate-700 font-medium leading-relaxed">
                              <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{explanations[i]}</Markdown>
                            </div>
                          </motion.div>
                        ) : (
                          <button
                            onClick={() => handleExplain(i, q.question, q.options, q.correct, studentAns)}
                            disabled={loadingExplanations[i]}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                          >
                            {loadingExplanations[i] ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Analyzing Mistake...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 text-orange-400" />
                                Why I'm Wrong?
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
