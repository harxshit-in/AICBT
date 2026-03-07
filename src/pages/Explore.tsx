import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Globe, Users, Play, Calendar, FileText, ChevronRight, Star, TrendingUp, Loader2, Medal, Target, Zap, X, Timer, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAllBanks, QuestionBank, getResultsForBank, ExamResult } from '../utils/storage';

interface SharedTest {
  id: string;
  name: string;
  author: string;
  authorImage?: string;
  questionsCount: number;
  attempts: number;
  rating: number;
  category: string;
  createdAt: number;
  tags?: string[];
  negativeMarking?: number;
  timeLimit?: number;
}

const MOCK_SHARED_TESTS: SharedTest[] = [
  {
    id: 'shared-1',
    name: 'UPSC Civil Services Prelims 2024 - GS Paper 1',
    author: 'Admin',
    questionsCount: 100,
    attempts: 1240,
    rating: 4.8,
    category: 'Civil Services',
    createdAt: Date.now() - 86400000 * 2,
    tags: ['Polity', 'History', 'Geography'],
    negativeMarking: 0.33,
    timeLimit: 120
  },
  {
    id: 'shared-2',
    name: 'SSC CGL Tier 1 - Quantitative Aptitude',
    author: 'Harshit Singh',
    questionsCount: 25,
    attempts: 850,
    rating: 4.5,
    category: 'SSC',
    createdAt: Date.now() - 86400000 * 5,
    tags: ['Math', 'Algebra', 'Geometry'],
    negativeMarking: 0.5,
    timeLimit: 60
  }
];

export default function Explore() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showNameModal, setShowNameModal] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [publicBanks, setPublicBanks] = useState<SharedTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<ExamResult[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState<string | null>(null);
  const [isFetchingLeaderboard, setIsFetchingLeaderboard] = useState(false);
  const [showOverview, setShowOverview] = useState<SharedTest | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPublicBanks().then((banks) => {
      const params = new URLSearchParams(window.location.search);
      const testId = params.get('test');
      if (testId) {
        const test = banks.find(b => b.id === testId);
        if (test) setShowOverview(test);
      }
    });
  }, []);

  const loadPublicBanks = async () => {
    setLoading(true);
    const allBanks = await getAllBanks();
    const publicOnes = allBanks
      .filter(b => b.isPublic)
      .map(b => ({
        id: b.bankId,
        name: b.name,
        author: b.author || 'Anonymous',
        questionsCount: b.questions.length,
        attempts: b.attempts || 0,
        rating: b.rating || 5.0,
        category: b.category || 'General',
        createdAt: b.createdAt,
        tags: b.tags,
        negativeMarking: b.negativeMarking,
        timeLimit: b.timeLimit,
        authorImage: b.authorImage
      }));
    
    const all = [...MOCK_SHARED_TESTS, ...publicOnes];
    setPublicBanks(all);
    setLoading(false);
    return all;
  };

  const categories = ['All', ...new Set([...MOCK_SHARED_TESTS, ...publicBanks].map(t => t.category))];

  const filteredTests = publicBanks.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         test.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || test.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleStartTest = (testId: string) => {
    if (!userName.trim()) return;
    localStorage.setItem('candidate_name', userName);
    
    // Check if it's a real bank or mock
    const isReal = !testId.startsWith('shared-');
    if (isReal) {
      navigate(`/exam/${testId}`);
    } else {
      navigate(`/shared/${testId}`);
    }
  };

  const handleCopyLink = (testId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/explore?test=${testId}`;
    navigator.clipboard.writeText(url);
    alert('Shareable link copied to clipboard!');
  };

  const openLeaderboard = async (testId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowLeaderboard(testId);
    setIsFetchingLeaderboard(true);
    const results = await getResultsForBank(testId);
    const sorted = results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.timeTaken - b.timeTaken;
    });
    setLeaderboardData(sorted);
    setIsFetchingLeaderboard(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-12 text-white">
        <div className="relative z-10 max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="bg-orange-500 p-2 rounded-xl">
              <Globe className="w-6 h-6" />
            </div>
            <span className="text-orange-500 font-black uppercase tracking-[0.2em] text-xs">Global Community</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-black tracking-tight mb-4"
          >
            Explore <span className="text-orange-500">Shared</span> Exams
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg leading-relaxed"
          >
            Access a world of knowledge. Attempt exams shared by educators and students worldwide. No account needed—just enter your name and start.
          </motion.p>
        </div>
        
        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-500/10 to-transparent" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-orange-500/20 rounded-full blur-[100px]" />
      </header>

      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by exam name, author, or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-100 rounded-[2rem] py-4 pl-14 pr-6 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 shadow-xl shadow-slate-200/20 transition-all text-lg"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat 
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' 
                  : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
          <p className="text-slate-500 font-bold">Loading public exams...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTests.map((test, idx) => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all cursor-pointer relative overflow-hidden"
              onClick={() => setShowNameModal(test.id)}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="bg-slate-50 p-4 rounded-2xl text-slate-400 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1 bg-yellow-50 text-yellow-600 px-3 py-1 rounded-full text-xs font-black">
                    <Star className="w-3 h-3 fill-yellow-600" />
                    {test.rating}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => handleCopyLink(test.id, e)}
                      className="p-2 bg-slate-50 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                      title="Copy Share Link"
                    >
                      <Globe className="w-4 h-4" />
                    </button>
                    {!test.id.startsWith('shared-') && (
                      <button 
                        onClick={(e) => openLeaderboard(test.id, e)}
                        className="p-2 bg-slate-50 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                        title="View Leaderboard"
                      >
                        <Medal className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{test.category}</span>
                <h3 className="text-xl font-bold text-slate-900 line-clamp-2 group-hover:text-orange-600 transition-colors leading-tight">
                  {test.name}
                </h3>
                {test.tags && test.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {test.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[9px] bg-slate-50 text-slate-400 px-2 py-0.5 rounded-md font-bold">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 mb-8">
                {test.authorImage ? (
                  <img 
                    src={test.authorImage} 
                    alt={test.author}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover border border-slate-100"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                    {test.author[0]}
                  </div>
                )}
                <span className="text-sm font-medium text-slate-500">by <span className="text-slate-900 font-bold">{test.author}</span></span>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Questions</span>
                  <span className="text-sm font-black text-slate-800">{test.questionsCount}</span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOverview(test);
                  }}
                  className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-orange-500 transition-all flex items-center gap-2"
                >
                  Start Test
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-50 overflow-hidden">
                <motion.div 
                  className="h-full bg-orange-500"
                  initial={{ width: 0 }}
                  whileInView={{ width: '100%' }}
                  transition={{ duration: 1.5 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Test Overview Modal */}
      <AnimatePresence>
        {showOverview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] p-8 md:p-12 max-w-2xl w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              <button 
                onClick={() => setShowOverview(null)}
                className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-8 overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg">Exam Overview</span>
                    <span className="text-slate-400 text-xs font-bold">{showOverview.category}</span>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{showOverview.name}</h2>
                  <div className="flex items-center gap-3">
                    {showOverview.authorImage ? (
                      <img 
                        src={showOverview.authorImage} 
                        alt={showOverview.author}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-slate-100"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                        {showOverview.author[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Shared By</p>
                      <p className="text-sm font-black text-slate-900">{showOverview.author}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <FileText className="w-5 h-5 text-orange-500 mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Questions</p>
                    <p className="text-lg font-black text-slate-900">{showOverview.questionsCount}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <Timer className="w-5 h-5 text-emerald-500 mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time Limit</p>
                    <p className="text-lg font-black text-slate-900">{showOverview.timeLimit || showOverview.questionsCount}m</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <ShieldCheck className="w-5 h-5 text-red-500 mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Negative</p>
                    <p className="text-lg font-black text-slate-900">-{showOverview.negativeMarking || 0}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <Users className="w-5 h-5 text-blue-500 mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attempts</p>
                    <p className="text-lg font-black text-slate-900">{showOverview.attempts.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-orange-500" />
                    Exam Rules
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex gap-3 text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                      Each question carries 1 mark for correct answer.
                    </li>
                    <li className="flex gap-3 text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                      Negative marking of {showOverview.negativeMarking || 0} for each wrong answer.
                    </li>
                    <li className="flex gap-3 text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                      The test will automatically submit when the timer ends.
                    </li>
                    <li className="flex gap-3 text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                      Do not refresh the page during the exam.
                    </li>
                  </ul>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowOverview(null)}
                    className="flex-1 px-8 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all border border-slate-100"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      const testId = showOverview.id;
                      setShowOverview(null);
                      setShowNameModal(testId);
                    }}
                    className="flex-[2] bg-orange-500 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-orange-100 hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Proceed to Start
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Name Entry Modal */}
      <AnimatePresence>
        {showNameModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-orange-500" />
              
              <div className="text-center space-y-4 mb-8">
                <div className="bg-orange-50 w-20 h-20 rounded-[2rem] flex items-center justify-center text-orange-500 mx-auto mb-6">
                  <Users className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Ready to Start?</h2>
                <p className="text-slate-500">Please enter your name to begin the exam session. Your results will be recorded under this name.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Candidate Name</label>
                  <input
                    autoFocus
                    type="text"
                    placeholder="e.g. Harshit Singh"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStartTest(showNameModal)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-bold text-lg"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowNameModal(null)}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!userName.trim()}
                    onClick={() => handleStartTest(showNameModal)}
                    className="flex-[2] bg-orange-500 text-white px-6 py-4 rounded-2xl font-bold shadow-xl shadow-orange-100 hover:bg-orange-600 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Start Exam
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Leaderboard Modal */}
      <AnimatePresence>
        {showLeaderboard && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] p-8 md:p-10 max-w-lg w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh]"
            >
              <button 
                onClick={() => setShowLeaderboard(null)}
                className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="bg-orange-500 p-3 rounded-2xl text-white shadow-lg shadow-orange-100">
                  <Medal className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Leaderboard</h2>
                  <p className="text-slate-500 text-sm">Top performers for this exam</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {isFetchingLeaderboard ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-2" />
                    <p className="text-slate-400 text-sm font-bold">Fetching rankings...</p>
                  </div>
                ) : leaderboardData.length > 0 ? (
                  leaderboardData.slice(0, 10).map((entry, idx) => (
                    <div 
                      key={entry.resultId}
                      className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50"
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
                          <div className="font-bold text-slate-900">{entry.candidateName}</div>
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
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-400 font-medium">
                    No attempts yet. Be the first to top the charts!
                  </div>
                )}
              </div>

              <div className="mt-8">
                <button
                  onClick={() => {
                    setShowLeaderboard(null);
                    setShowNameModal(showLeaderboard);
                  }}
                  className="w-full bg-slate-900 text-white px-6 py-4 rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Attempt Now
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
