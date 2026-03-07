import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSharedBank } from '../utils/firebase';
import { saveBank, QuestionBank } from '../utils/storage';
import { Clock, Download, Play, User, FileText, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function SharedTest() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      getSharedBank(id).then((data) => {
        if (data) {
          setBank(data);
        } else {
          setError('Shared test not found or has been removed.');
        }
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setError('Failed to load shared test.');
        setLoading(false);
      });
    }
  }, [id]);

  const handleImport = async () => {
    if (!bank) return;
    await saveBank(bank);
    navigate(`/exam-overview/${bank.bankId}`);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Clock className="animate-spin text-orange-500" /></div>;

  if (error) return (
    <div className="max-w-md mx-auto py-20 text-center space-y-4">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
      <h2 className="text-2xl font-bold text-slate-900">Error</h2>
      <p className="text-slate-500">{error}</p>
      <button onClick={() => navigate('/')} className="text-orange-500 font-bold">Go to Dashboard</button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8 text-center"
      >
        <div className="bg-orange-50 w-20 h-20 rounded-3xl flex items-center justify-center text-orange-600 mx-auto mb-6">
          <FileText className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">{bank?.name}</h1>
          <p className="text-slate-500">A shared test has been sent to you</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Questions</div>
            <div className="text-xl font-bold text-slate-800">{bank?.questions.length}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Time Limit</div>
            <div className="text-xl font-bold text-slate-800">{bank?.timeLimit}m</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Negative Marking</div>
            <div className="text-xl font-bold text-slate-800">-{bank?.negativeMarking}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Created By</div>
            <div className="text-xl font-bold text-slate-800 line-clamp-1">{bank?.createdBy || 'Anonymous'}</div>
          </div>
        </div>

        <div className="pt-4 space-y-4">
          <button
            onClick={handleImport}
            className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Import & Start Test
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-white border-2 border-slate-100 text-slate-500 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all"
          >
            Decline
          </button>
        </div>
      </motion.div>
    </div>
  );
}
