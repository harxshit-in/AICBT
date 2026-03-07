import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle, Search, FileText } from 'lucide-react';
import { scanOMR } from '../utils/aiExtractor';
import { getAllBanks, QuestionBank } from '../utils/storage';
import { motion, AnimatePresence } from 'motion/react';

export default function OMRScan() {
  const [file, setFile] = useState<File | null>(null);
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    getAllBanks().then(setBanks);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type.startsWith('image/')) {
      setFile(selected);
      setError('');
    } else {
      setError('Please select a valid image file.');
    }
  };

  const processOMR = async () => {
    if (!file || !selectedBankId) return;

    const apiKey = localStorage.getItem('user_gemini_api_key');
    if (!apiKey) {
      setError('Please set your Gemini API Key in Settings first.');
      return;
    }

    const bank = banks.find(b => b.bankId === selectedBankId);
    if (!bank) return;

    try {
      setStatus('scanning');
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const answerKey = bank.questions.map(q => q.correct);
        const data = await scanOMR(base64, answerKey);
        setResults(data);
        setStatus('success');
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to scan OMR sheet.');
      setStatus('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">OMR Scanner</h1>
        <p className="text-slate-500">Scan a photo of your OMR answer sheet to get instant results</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">1. Select Question Bank</label>
              <select
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              >
                <option value="">Choose a bank...</option>
                {banks.map((b) => (
                  <option key={b.bankId} value={b.bankId}>{b.name} ({b.questions.length} Qs)</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">2. Upload OMR Photo</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                  file ? 'border-orange-500 bg-orange-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-orange-500" />
                    <span className="text-sm font-bold text-slate-700 line-clamp-1">{file.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Camera className="w-8 h-8 text-slate-400" />
                    <span className="text-sm font-medium text-slate-500">Click to upload photo</span>
                  </div>
                )}
              </div>
            </div>

            <button
              disabled={!file || !selectedBankId || status === 'scanning'}
              onClick={processOMR}
              className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {status === 'scanning' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Scanning Bubbles...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Scan OMR Sheet
                </>
              )}
            </button>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm font-medium bg-red-50 p-4 rounded-2xl">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {status === 'success' && results ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8"
              >
                <div className="text-center">
                  <div className="text-5xl font-black text-orange-500 mb-2">{results.score}/{results.total}</div>
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Score</div>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {results.results.map((res: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold text-xs text-slate-400 border border-slate-100">
                          {res.questionNum}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Student</span>
                          <span className="font-bold text-slate-700">
                            {res.studentAnswer !== null ? String.fromCharCode(65 + res.studentAnswer) : 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Correct</span>
                          <span className="font-bold text-emerald-600">{String.fromCharCode(65 + res.correctAnswer)}</span>
                        </div>
                        {res.isCorrect ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center h-full min-h-[400px]"
              >
                <FileText className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-400">Scan Results will appear here</h3>
                <p className="text-slate-400 text-sm mt-2 max-w-[200px]">Select a bank and upload your OMR photo to see your score.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
