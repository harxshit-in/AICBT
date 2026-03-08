import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Play, Calendar, FileText, ChevronRight, Search, Share2, Globe, ShieldAlert, Loader2, X } from 'lucide-react';
import { getAllBanks, deleteBank, QuestionBank, saveBank } from '../utils/storage';
import { categorizeBank } from '../utils/aiExtractor';
import { shareBank } from '../utils/firebase';
import { motion, AnimatePresence } from 'motion/react';
import Filter from 'bad-words';
import { isContentSafe } from '../utils/profanityFilter';

export default function Dashboard() {
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sharingBank, setSharingBank] = useState<QuestionBank | null>(null);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [authorImage, setAuthorImage] = useState('');
  const [hasConsent, setHasConsent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadBanks();
  }, []);

  const loadBanks = async () => {
    setLoading(true);
    const data = await getAllBanks();
    setBanks(data.sort((a, b) => b.createdAt - a.createdAt));
    setLoading(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this question bank?')) {
      await deleteBank(id);
      loadBanks();
    }
  };

  const handleShare = async (bank: QuestionBank, e: React.MouseEvent) => {
    e.stopPropagation();
    setSharingBank(bank);
  };

  const confirmShare = async () => {
    if (!sharingBank || !authorName.trim() || !hasConsent) return;
    
    if (!isContentSafe(sharingBank, authorName)) {
      alert("Inappropriate content detected in name, test title, or questions. Please use appropriate language.");
      return;
    }

    setIsCategorizing(true);
    try {
      // Only categorize if not already categorized
      let category = sharingBank.category;
      let tags = sharingBank.tags;
      
      if (!category) {
        try {
          const result = await categorizeBank(sharingBank.name, sharingBank.questions);
          category = result.category;
          tags = result.tags;
        } catch (catErr) {
          console.warn("Categorization failed, using defaults", catErr);
          category = 'General';
          tags = [];
        }
      }

      const updatedBank: QuestionBank = {
        ...sharingBank,
        isPublic: true,
        category: category || 'General',
        tags: tags || [],
        author: authorName,
        authorImage: authorImage.trim() || undefined,
        attempts: 0,
        rating: 5.0
      };
      
      // Parallelize local save and cloud share
      await Promise.all([
        saveBank(updatedBank),
        shareBank(updatedBank)
      ]);
      
      setSharingBank(null);
      setAuthorName('');
      setAuthorImage('');
      setHasConsent(false);
      loadBanks();
      alert(`Test shared successfully! Categorized as: ${category}`);
    } catch (error) {
      console.error(error);
      alert('Failed to share test. Please check your Gemini API key.');
    } finally {
      setIsCategorizing(false);
    }
  };

  const filteredBanks = banks.filter((b) =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Your Question Banks</h1>
          <p className="text-slate-500 mt-1">Manage and start your interactive exam sessions</p>
        </div>
        <Link
          to="/upload"
          className="flex items-center justify-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          New Exam Paper
        </Link>
      </header>

      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search your question banks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
        />
      </div>

      <AnimatePresence mode="popLayout">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-slate-50 animate-pulse rounded-3xl border border-slate-100" />
            ))}
          </div>
        ) : filteredBanks.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredBanks.map((bank) => (
              <motion.div
                key={bank.bankId}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer"
                onClick={() => navigate(`/exam-overview/${bank.bankId}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-2">
                    <div className="bg-orange-50 p-3 rounded-2xl text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                      <FileText className="w-6 h-6" />
                    </div>
                    {bank.isPublic && (
                      <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
                        <Globe className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {!bank.isPublic && (
                      <button
                        onClick={(e) => handleShare(bank, e)}
                        className="p-2 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                        title="Share Publicly"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(bank.bankId, e)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-800 line-clamp-1 mb-2 group-hover:text-orange-600 transition-colors">
                  {bank.name}
                </h3>

                <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(bank.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5" />
                    {bank.questions.length} Questions
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-orange-500 transition-colors">
                    Start Exam
                  </span>
                  <div className="bg-slate-50 p-2 rounded-full group-hover:bg-orange-500 group-hover:text-white transition-all transform group-hover:translate-x-1">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="bg-slate-50 p-8 rounded-full mb-6">
              <FileText className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">No question banks found</h3>
            <p className="text-slate-500 mt-2 max-w-xs">
              Upload your first exam PDF to get started with interactive CBT practice.
            </p>
            <Link
              to="/upload"
              className="mt-8 text-orange-500 font-bold hover:underline underline-offset-4"
            >
              Upload your first PDF →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Confirmation Modal */}
      <AnimatePresence>
        {sharingBank && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <button 
                onClick={() => setSharingBank(null)}
                className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-4 mb-8">
                <div className="bg-orange-50 w-20 h-20 rounded-[2rem] flex items-center justify-center text-orange-500 mx-auto mb-6">
                  <ShieldAlert className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Public Sharing</h2>
                <p className="text-slate-500 text-sm">
                  This test will be available on the **Explore** page for everyone to attempt. 
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Author / Institution Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Harshit Academy"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Profile Photo URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={authorImage}
                    onChange={(e) => setAuthorImage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-bold"
                  />
                </div>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center mt-1">
                    <input
                      type="checkbox"
                      checked={hasConsent}
                      onChange={(e) => setHasConsent(e.target.checked)}
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-200 transition-all checked:bg-orange-500 checked:border-orange-500"
                    />
                    <svg
                      className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span className="text-xs text-slate-500 font-medium leading-relaxed group-hover:text-slate-700 transition-colors">
                    I agree to share this test publicly and accept the <Link to="/about" className="text-orange-500 font-bold hover:underline">Terms of Service</Link>.
                  </span>
                </label>

                <div className="space-y-3 pt-2">
                  <button
                    disabled={isCategorizing || !authorName.trim() || !hasConsent}
                    onClick={confirmShare}
                    className="w-full bg-orange-500 text-white px-6 py-4 rounded-2xl font-bold shadow-xl shadow-orange-100 hover:bg-orange-600 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isCategorizing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        AI Categorizing...
                      </>
                    ) : (
                      <>
                        <Globe className="w-5 h-5" />
                        Confirm & Share
                      </>
                    )}
                  </button>
                  <button
                    disabled={isCategorizing}
                    onClick={() => setSharingBank(null)}
                    className="w-full px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
