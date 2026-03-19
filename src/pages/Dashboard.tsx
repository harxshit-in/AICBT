import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, FileText, ArrowRight, BrainCircuit, AlignLeft, GraduationCap, Flame, Trophy, Target, ChevronRight, BookOpen, Clock, Download, Search, CheckCircle2, ScanLine, LayoutGrid, Medal, Users, Brain } from 'lucide-react';
import { motion } from 'motion/react';
import { getUserStats, UserStats, QuestionBank, getAllBanks, ExamResult, getAllResults } from '../utils/storage';
import { auth, getUserProfile, getAppConfig } from '../utils/firebase';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [recentTests, setRecentTests] = useState<ExamResult[]>([]);
  const [pdfTests, setPdfTests] = useState<QuestionBank[]>([]);
  const [motivation, setMotivation] = useState('');
  const [appConfig, setAppConfig] = useState<any>(null);

  useEffect(() => {
    getUserStats().then(setStats);
    getAllBanks().then(banksData => {
      setBanks(banksData);
      const pdfs = banksData.filter(b => b.sourceFile && b.sourceFile.toLowerCase().endsWith('.pdf'));
      setPdfTests(pdfs.sort((a, b) => b.createdAt - a.createdAt).slice(0, 3));
    });
    getAllResults().then(results => {
      setRecentTests(results.sort((a, b) => b.timestamp - a.timestamp).slice(0, 3));
    });
    getAppConfig().then(setAppConfig);

    const motivations = [
      "Success is the sum of small efforts, repeated day in and day out.",
      "The secret of getting ahead is getting started.",
      "Don't watch the clock; do what it does. Keep going.",
      "Believe you can and you're halfway there.",
      "Your limitation—it's only your imagination.",
      "Push yourself, because no one else is going to do it for you.",
      "Great things never come from comfort zones.",
      "Dream it. Wish it. Do it."
    ];
    setMotivation(motivations[Math.floor(Math.random() * motivations.length)]);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      }
    };
    fetchProfile();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchProfile();
    });
    return unsubscribe;
  }, []);

  const totalCorrect = stats ? Object.values(stats.subjectMastery).reduce((acc, curr) => acc + curr.correct, 0) : 0;
  const accuracy = stats && stats.totalQuestionsSolved > 0 
    ? Math.round((totalCorrect / stats.totalQuestionsSolved) * 100) 
    : 0;

  const daysOfWeek = ['S', 'M', 'T', 'W', 'Th', 'F', 'S'];
  const currentDay = new Date().getDay();

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-32 lg:pb-8 max-w-[1400px] mx-auto">
      
      {/* Main Content Area (Left) */}
      <div className="flex-1 space-y-8">
        
        {appConfig?.dashboardUpdate && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3"
          >
            <div className="mt-0.5">
              <Sparkles className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-indigo-900">Admin Update</h3>
              <p className="text-sm text-indigo-700 mt-1 whitespace-pre-wrap">{appConfig.dashboardUpdate}</p>
            </div>
          </motion.div>
        )}

        {/* AI School Banner */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          onClick={() => navigate('/ai-school')}
          className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 text-white relative overflow-hidden cursor-pointer group shadow-xl shadow-emerald-900/20"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-white/20 transition-all duration-500" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl -ml-16 -mb-16" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-widest uppercase">
                <Sparkles className="w-3 h-3" /> New Feature
              </div>
              <h2 className="text-4xl font-bold tracking-tight">AI School</h2>
              <p className="text-emerald-50 max-w-md text-lg opacity-90">
                Personalized syllabus, teacher-guided videos, and AI-powered roadmap. Target your exam date with precision.
              </p>
              <div className="flex flex-wrap gap-4 pt-2 justify-center md:justify-start">
                <div className="flex items-center gap-2 text-sm font-medium bg-black/20 px-4 py-2 rounded-xl backdrop-blur-sm">
                  <Target className="w-4 h-4" /> Exam Focused
                </div>
                <div className="flex items-center gap-2 text-sm font-medium bg-black/20 px-4 py-2 rounded-xl backdrop-blur-sm">
                  <Brain className="w-4 h-4" /> AI Syllabus
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="w-32 h-32 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform duration-500">
                <GraduationCap className="w-16 h-16 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <ArrowRight className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Hero Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-2xl p-8 relative overflow-hidden shadow-sm"
        >
          <div className="relative z-10">
            <h1 className="text-3xl font-medium text-slate-900 mb-2 tracking-tight">
              Hi, {userProfile?.name?.split(' ')[0] || 'Student'}
            </h1>
            <p className="text-slate-500 text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              {motivation}
            </p>
          </div>
        </motion.div>

        {/* Previous Year Questions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div>
            <h2 className="text-xl font-bold text-slate-800">Featured Exams</h2>
            <p className="text-sm text-slate-500 mt-1">Practice PYQs to master exam patterns</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/explore?category=Railway')}
              className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:border-orange-300 hover:shadow-md transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                <img src="https://i.ibb.co/KjjhR10j/image.png" alt="Railway Logo" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Railway</h3>
                <p className="text-xs text-slate-500">All GS PYQs from 2011-2025</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>

            <button 
              onClick={() => navigate('/explore?category=SSC')}
              className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:border-teal-300 hover:shadow-md transition-all text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                <img src="https://i.ibb.co/0jkVHZmx/image.png" alt="SSC Logo" className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">SSC</h3>
                <p className="text-xs text-slate-500">All model answers from 2011-2024</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </motion.div>

        {/* View AI CBT Community Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden cursor-pointer hover:shadow-md transition-all"
          onClick={() => navigate('/explore')}
        >
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-l from-orange-100/50 to-transparent pointer-events-none" />
          <div className="flex items-center gap-6 z-10">
            <div className="w-20 h-20 bg-white rounded-xl p-2 shadow-sm border border-orange-100 flex items-center justify-center">
              <Users className="w-10 h-10 text-orange-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-orange-900 mb-1">View AI CBT Community</h3>
              <p className="text-orange-700 text-sm">see whats others are doing</p>
            </div>
          </div>
          <div className="z-10 shrink-0">
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2">
              Explore Now <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Core Features */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div>
            <h2 className="text-xl font-bold text-slate-800">Core Features</h2>
            <p className="text-sm text-slate-500 mt-1">Enhance your preparation with our AI-powered tools</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={() => navigate('/upload')}
              className="flex items-center justify-between p-6 bg-white border-2 border-orange-200 rounded-3xl hover:bg-orange-50 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-200/50 transition-all group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border border-orange-100 flex items-center justify-center bg-orange-50 shrink-0">
                  <FileText className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-base">PDF to CBT</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Generate tests from any PDF</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-800 transition-colors shrink-0" />
            </button>

            <button 
              onClick={() => navigate('/parikshai')}
              className="flex items-center justify-between p-6 bg-white border-2 border-teal-200 rounded-3xl hover:bg-teal-50 hover:border-teal-500 hover:shadow-2xl hover:shadow-teal-200/50 transition-all group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border border-teal-100 flex items-center justify-center bg-teal-50 shrink-0">
                  <BrainCircuit className="w-6 h-6 text-teal-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-base">ParikshAI</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Advanced AI paper analysis</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-800 transition-colors shrink-0" />
            </button>
          </div>
        </motion.div>

        {/* PDF to CBT Tests */}
        {pdfTests.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Your PDF to CBT Tests</h2>
                <p className="text-sm text-slate-500 mt-1">Tests generated from your uploaded PDFs</p>
              </div>
              <button 
                onClick={() => navigate('/all-pdf-to-cbt')}
                className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1"
              >
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pdfTests.map(test => (
                <div 
                  key={test.bankId}
                  onClick={() => navigate(`/exam-overview/${test.bankId}`)}
                  className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer flex flex-col h-full"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-orange-500" />
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                      {test.questions.length} Qs
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1 line-clamp-2 flex-1">{test.name}</h3>
                  <p className="text-xs text-slate-500 mt-auto pt-4 border-t border-slate-100">
                    {new Date(test.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recently Attempted Tests */}
        {recentTests.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div>
              <h2 className="text-xl font-bold text-slate-800">Recently Attempted</h2>
              <p className="text-sm text-slate-500 mt-1">Review your recent test performances</p>
            </div>
            
            <div className="space-y-3">
              {recentTests.map(result => {
                const bank = banks.find(b => b.bankId === result.bankId);
                return (
                  <div 
                    key={result.resultId}
                    onClick={() => navigate(`/exam-overview/${result.bankId}`)}
                    className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{bank?.name || 'Unknown Test'}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(result.timestamp).toLocaleDateString()} • {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">{result.score} <span className="text-xs text-slate-500 font-normal">/ {result.totalQuestions}</span></div>
                      <div className="text-xs font-medium text-emerald-600">{result.accuracy}% Acc.</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

      </div>

      {/* Right Sidebar */}
      <div className="w-full lg:w-[320px] space-y-6 shrink-0">
        
        {/* Today's Activity */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800">Today's Activity</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-[#f8f9fa] rounded-xl p-4 text-center flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-1">
                <LayoutGrid className="w-4 h-4 text-orange-500" />
                <span className="text-xl font-bold text-slate-800">{stats?.totalQuestionsSolved || 0}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">MCQ Practiced</div>
            </div>
            
            <div className="bg-[#f8f9fa] rounded-xl p-4 text-center flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-blue-500" />
                <span className="text-xl font-bold text-slate-800">{accuracy > 0 ? `${accuracy}%` : '—'}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">Accuracy</div>
            </div>
            
            <div className="bg-[#f8f9fa] rounded-xl p-4 text-center flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-emerald-500" />
                <span className="text-xl font-bold text-slate-800">{stats ? Object.keys(stats.subjectMastery).length : 0}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">Mains Answers</div>
            </div>
            
            <div className="bg-[#f8f9fa] rounded-xl p-4 text-center flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-1">
                <Medal className="w-4 h-4 text-amber-500" />
                <span className="text-xl font-bold text-slate-800">{stats?.totalXP > 0 ? stats.totalXP : '—'}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">Your Rank</div>
            </div>
          </div>

          <button 
            onClick={() => navigate('/leaderboard')}
            className="w-full py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
          >
            View Leaderboard <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Streak */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-1">
              {stats?.streak || 0}-day streak
            </h3>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xs text-slate-500 mb-5">Learn or practice to mark today's streak</p>
          
          <div className="flex justify-between items-center">
            {daysOfWeek.map((day, index) => {
              const isToday = index === currentDay;
              const isPast = index < currentDay;
              const hasStreak = isPast || (isToday && (stats?.streak || 0) > 0);
              
              return (
                <div key={index} className="flex flex-col items-center gap-2">
                  <span className={`text-[11px] font-medium ${isToday ? 'text-orange-500' : 'text-slate-400'}`}>
                    {day}
                  </span>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    hasStreak ? 'bg-orange-50' : 'bg-slate-50'
                  }`}>
                    {hasStreak ? (
                      <Flame className="w-4 h-4 text-orange-400" fill="currentColor" />
                    ) : (
                      <Flame className="w-4 h-4 text-slate-200" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
