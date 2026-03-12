import React, { useState, useRef } from 'react';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { renderPDFToImages } from '../utils/pdfReader';
import { extractFromPDF, extractFromImages } from '../utils/aiExtractor';
import { saveBank, generateBankId } from '../utils/storage';
import { logAnalyticsEvent } from '../utils/firebase';
import { motion, AnimatePresence } from 'motion/react';
import ErrorDialog from './ErrorDialog';

export default function PDFUploader({ onComplete }: { onComplete: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'extracting' | 'filtering' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [extractedQuestions, setExtractedQuestions] = useState<any[]>([]);
  const [selectedLang, setSelectedLang] = useState<'both' | 'english' | 'hindi'>('both');
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setError('');
    } else {
      setError('Please select a valid PDF file.');
    }
  };

  const processPDF = async () => {
    if (!file) return;

    try {
      setStatus('processing');
      setProgress(0);

      // 1. Extract using native PDF mode first (faster, better for text)
      setStatus('extracting');
      let questions = await extractFromPDF(file);

      // 2. Fallback to image mode if no questions found (handles scanned PDFs)
      if (questions.length === 0) {
        setStatus('processing');
        const images = await renderPDFToImages(file, (p) => setProgress(p));
        setStatus('extracting');
        questions = await extractFromImages(images);
      }

      if (questions.length === 0) {
        throw new Error('No questions could be extracted from this PDF.');
      }

      setExtractedQuestions(questions);
      
      // Check if we have multiple languages
      const hasEnglish = questions.some(q => q.language === 'english');
      const hasHindi = questions.some(q => q.language === 'hindi');

      if (hasEnglish && hasHindi) {
        setStatus('filtering');
      } else {
        await finalizeExtraction(questions);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during extraction.');
      setStatus('error');
      setShowErrorDialog(true);
    }
  };

  const finalizeExtraction = async (questionsToSave: any[]) => {
    if (!file) return;
    try {
      const bank = {
        bankId: generateBankId(file.name),
        name: file.name.replace('.pdf', ''),
        questions: questionsToSave,
        createdAt: Date.now(),
        sourceFile: file.name,
      };

      await saveBank(bank);
      await logAnalyticsEvent('pdf_uploads');
      setStatus('success');
      setTimeout(() => onComplete(), 1500);
    } catch (err: any) {
      setError('Failed to save question bank.');
      setStatus('error');
      setShowErrorDialog(true);
    }
  };

  const handleFilterConfirm = () => {
    let filtered = extractedQuestions;
    if (selectedLang === 'english') {
      filtered = extractedQuestions.filter(q => q.language === 'english');
    } else if (selectedLang === 'hindi') {
      filtered = extractedQuestions.filter(q => q.language === 'hindi');
    }
    finalizeExtraction(filtered);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <ErrorDialog 
        isOpen={showErrorDialog} 
        error={error} 
        context="PDFUploader" 
        onClose={() => setShowErrorDialog(false)} 
      />
      <div
        className={`relative border-2 border-dashed rounded-3xl p-12 transition-all ${
          status === 'idle' ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer' : 'border-orange-200 bg-orange-50'
        }`}
        onClick={() => status === 'idle' && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          className="hidden"
        />

        <div className="flex flex-col items-center text-center gap-4">
          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="bg-white p-4 rounded-2xl shadow-sm">
                  <Upload className="w-8 h-8 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    {file ? file.name : 'Upload Exam PDF'}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Drag and drop or click to select your MCQ paper
                  </p>
                </div>
                {file && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      processPDF();
                    }}
                    className="mt-4 bg-orange-500 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all active:scale-95"
                  >
                    Start Extraction
                  </button>
                )}
              </motion.div>
            )}

            {(status === 'processing' || status === 'extracting') && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-6 w-full"
              >
                <div className="relative">
                  <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-orange-300" />
                  </div>
                </div>
                <div className="w-full max-w-xs">
                  <div className="flex justify-between text-xs font-medium text-slate-500 mb-2">
                    <span>{status === 'processing' ? 'Rendering PDF...' : 'AI Extracting Questions...'}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-orange-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <p className="text-sm text-slate-600 italic">
                  "Gemini is reading your exam paper. This takes a few seconds..."
                </p>
              </motion.div>
            )}

            {status === 'filtering' && (
              <motion.div
                key="filtering"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-6 w-full"
              >
                <div className="bg-orange-50 p-4 rounded-2xl text-orange-600">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-slate-800">Select Language</h3>
                  <p className="text-sm text-slate-500">
                    We detected both English and Hindi questions. Which ones would you like to keep?
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                  {(['english', 'hindi', 'both'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLang(lang)}
                      className={`py-4 px-6 rounded-2xl font-bold border-2 transition-all capitalize ${
                        selectedLang === lang 
                          ? 'border-orange-500 bg-orange-50 text-orange-900' 
                          : 'border-slate-100 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleFilterConfirm}
                  className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all active:scale-95"
                >
                  Confirm & Save Test
                </button>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="bg-emerald-100 p-4 rounded-full">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Extraction Complete!</h3>
                <p className="text-slate-500">Redirecting to dashboard...</p>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="bg-red-100 p-4 rounded-full">
                  <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Extraction Failed</h3>
                <p className="text-red-500 text-sm max-w-sm">{error}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatus('idle');
                    setFile(null);
                  }}
                  className="mt-2 text-slate-500 hover:text-slate-800 underline text-sm"
                >
                  Try another file
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
