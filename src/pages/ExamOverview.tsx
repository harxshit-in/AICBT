import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBank, saveBank, QuestionBank } from '../utils/storage';
import { shareBank } from '../utils/firebase';
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
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
    if (!bank) return;
    setSharing(true);
    try {
      const updatedBank = {
        ...bank,
        timeLimit,
        negativeMarking,
        createdBy
      };
      const shareId = await shareBank(updatedBank);
      const url = `${window.location.origin}/shared/${shareId}`;
      setShareUrl(url);
    } catch (err) {
      console.error(err);
      alert("Failed to share test. Check your Firebase configuration.");
    } finally {
      setSharing(false);
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
                disabled={sharing}
                onClick={handleShare}
                className="flex items-center gap-2 bg-purple-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-purple-100 hover:bg-purple-600 transition-all active:scale-95 disabled:opacity-50"
              >
                {sharing ? <Clock className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
                Share Test
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
    </div>
  );
}
