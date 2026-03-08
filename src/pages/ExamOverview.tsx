import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBank, saveBank, QuestionBank } from '../utils/storage';
import { shareBank } from '../utils/firebase';
import { categorizeBank } from '../utils/aiExtractor';
import { 
  ChevronLeft, 
  Clock, 
  Play, 
  Download, 
  Share2, 
  User, 
  AlertTriangle,
  FileText,
  Copy,
  Check,
  Globe,
  ShieldAlert,
  Loader2,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Filter from 'bad-words';
import { isContentSafe } from '../utils/profanityFilter';

export default function ExamOverview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [timeLimit, setTimeLimit] = useState(60);
  const [negativeMarking, setNegativeMarking] = useState(0.25);
  const [createdBy, setCreatedBy] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [copying, setCopying] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [authorImage, setAuthorImage] = useState('');
  const [hasConsent, setHasConsent] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);

  useEffect(() => {
    if (id) {
      getBank(id).then((data) => {
        if (data) {
          setBank(data);
          setTimeLimit(data.timeLimit || data.questions.length);
          setNegativeMarking(data.negativeMarking || 0.25);
          setCreatedBy(data.createdBy || '');
        }
      });
    }
  }, [id]);

  const handleStart = async () => {
    if (!bank) return;
    const updatedBank = {
      ...bank,
      timeLimit,
      negativeMarking,
      createdBy
    };
    await saveBank(updatedBank);
    navigate(`/exam/${bank.bankId}`);
  };

  const handleDownloadJson = () => {
    if (!bank) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bank, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${bank.name}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleShare = async () => {
    if (!bank || !authorName.trim() || !hasConsent) return;
    
    if (!isContentSafe(bank, authorName)) {
      alert("Inappropriate content detected in name, test title, or questions. Please use appropriate language.");
      return;
    }

    setIsCategorizing(true);
    try {
      // Only categorize if not already categorized
      let category = bank.category;
      let tags = bank.tags;
      
      if (!category) {
        try {
          const result = await categorizeBank(bank.name, bank.questions);
          category = result.category;
          tags = result.tags;
        } catch (catErr) {
          console.warn("Categorization failed, using defaults", catErr);
          category = 'General';
          tags = [];
        }
      }

      const updatedBank: QuestionBank = {
        ...bank,
        timeLimit,
        negativeMarking,
        createdBy,
        isPublic: true,
        category: category || 'General',
        tags: tags || [],
        author: authorName,
        authorImage: authorImage.trim() || undefined,
        attempts: 0,
        rating: 5.0
      };
      
      // Parallelize local save and cloud share
      const [shareId] = await Promise.all([
        shareBank(updatedBank),
        saveBank(updatedBank)
      ]);
      
      setBank(updatedBank);
      const url = `${window.location.origin}/explore?test=${updatedBank.bankId}`;
      setShareUrl(url);
      setShowShareModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to share test. Check your Gemini API key and Firebase configuration.");
    } finally {
      setIsCategorizing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  if (!bank) return <div className="flex items-center justify-center min-h-[60vh]"><Clock className="animate-spin text-orange-500" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-orange-50 p-4 rounded-2xl text-orange-600">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{bank.name}</h1>
                <p className="text-slate-500">{bank.questions.length} Questions • {timeLimit} Minutes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Time Limit (Minutes)
                </label>
                <input
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  Negative Marking
                </label>
                <select
                  value={negativeMarking}
                  onChange={(e) => setNegativeMarking(parseFloat(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                >
                  <option value={0}>None</option>
                  <option value={0.25}>0.25 Marks</option>
                  <option value={0.33}>0.33 Marks</option>
                  <option value={0.5}>0.5 Marks</option>
                  <option value={1}>1.0 Marks</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-500" />
                  Created By
                </label>
                <input
                  type="text"
                  placeholder="Your Name or Organization"
                  value={createdBy}
                  onChange={(e) => setCreatedBy(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            <div className="pt-6 flex flex-wrap gap-4">
              <button
                onClick={handleDownloadJson}
                className="flex items-center gap-2 bg-slate-100 text-slate-700 px-6 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95"
              >
                <Download className="w-5 h-5" />
                Download JSON
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 bg-purple-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-purple-100 hover:bg-purple-600 transition-all active:scale-95 disabled:opacity-50"
              >
                <Share2 className="w-5 h-5" />
                Share Publicly
              </button>
            </div>

            {shareUrl && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-purple-50 p-4 rounded-2xl border border-purple-100 space-y-2"
              >
                <p className="text-xs font-bold text-purple-700 uppercase tracking-widest">Shareable Link</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 bg-white border border-purple-200 rounded-xl py-2 px-3 text-sm text-purple-900 focus:outline-none"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="bg-white border border-purple-200 p-2 rounded-xl hover:bg-purple-100 transition-all"
                  >
                    {copying ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-purple-600" />}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl space-y-6">
            <h3 className="text-xl font-bold">Exam Instructions</h3>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">1</div>
                Total questions: {bank.questions.length}
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">2</div>
                Time limit: {timeLimit} minutes
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">3</div>
                Negative marking: {negativeMarking > 0 ? `-${negativeMarking} per wrong answer` : 'None'}
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">4</div>
                You can mark questions for review and return to them later.
              </li>
            </ul>

            <button
              onClick={handleStart}
              className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Start Examination
            </button>
          </div>
        </div>
      </div>

      {/* Share Confirmation Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <button 
                onClick={() => setShowShareModal(false)}
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
                    onClick={handleShare}
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
                    onClick={() => setShowShareModal(false)}
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
