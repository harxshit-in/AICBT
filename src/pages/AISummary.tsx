import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Headphones, Search, Loader2, Play, Pause, RefreshCcw, Download, FileText, CheckCircle2, Key, Settings } from 'lucide-react';
import Markdown from 'react-markdown';
import { generateSummaryText, generateSummaryAudio, generateTestFromSummary } from '../utils/aiSummary';
import { saveBank, generateBankId } from '../utils/storage';
import { logFeatureUsage } from '../utils/firebase';
import ErrorDialog from '../components/ErrorDialog';

const EXAMS = [
  'UPSC CSE', 'SSC CGL', 'SSC CHSL', 'IBPS PO', 'SBI Clerk', 'RRB NTPC', 'NDA', 'CDS', 'State PSC'
];

const LANGUAGES = [
  { id: 'english', name: 'English' },
  { id: 'hindi', name: 'Hindi' },
  { id: 'hinglish', name: 'Hinglish' }
];

export default function AISummary() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [exam, setExam] = useState(EXAMS[0]);
  const [language, setLanguage] = useState(LANGUAGES[0].id);
  const [loading, setLoading] = useState(false);
  const [generatingTest, setGeneratingTest] = useState(false);
  const [error, setError] = useState('');
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  
  const [summaryText, setSummaryText] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic or chapter name');
      return;
    }
    
    setError('');
    setLoading(true);
    setSummaryText('');
    setAudioUrl('');
    setIsGenerated(false);

    try {
      // 1. Generate text summary
      const text = await generateSummaryText(topic, exam, language);
      setSummaryText(text);
      
      // 2. Generate audio narration
      const audio = await generateSummaryAudio(text, language);
      setAudioUrl(audio);
      
      setIsGenerated(true);
      await logFeatureUsage('ai_summary', 'gemini-3-flash-preview', true);
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating summary.');
      setShowErrorDialog(true);
      await logFeatureUsage('ai_summary', 'gemini-3-flash-preview', false);
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleDownloadAudio = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary.wav`;
    a.click();
  };

  const handleTakeTest = async () => {
    if (!summaryText) return;
    setGeneratingTest(true);
    setError('');
    
    try {
      const questions = await generateTestFromSummary(summaryText, topic, language);
      
      if (questions.length === 0) {
        throw new Error("Could not generate questions from this summary.");
      }

      const bankId = generateBankId(`${topic} Test`);
      await saveBank({
        bankId,
        name: `${topic} - AI Summary Test`,
        questions,
        createdAt: Date.now(),
        sourceFile: 'AI Generated Summary',
        timeLimit: questions.length * 1, // 1 minute per question
        negativeMarking: 0.25,
        category: exam,
        tags: ['AI Summary', topic]
      });

      navigate(`/exam-overview/${bankId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate test.');
      setShowErrorDialog(true);
      setGeneratingTest(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <ErrorDialog 
        isOpen={showErrorDialog} 
        error={error} 
        context="AISummary" 
        onClose={() => setShowErrorDialog(false)} 
      />
      <header className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-purple-50 rounded-3xl mb-2">
          <Headphones className="w-10 h-10 text-purple-600" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">AI Summary Podcast</h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
          Get a detailed, narrated summary of any topic or chapter for your exam. Listen and learn on the go!
        </p>
      </header>

      {/* Input Section */}
      {!isGenerated && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="space-y-2 md:col-span-3">
              <label className="text-sm font-bold text-slate-700">Topic or Chapter Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Fundamental Rights, Optics..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-1">
              <label className="text-sm font-bold text-slate-700">Target Exam</label>
              <select
                value={exam}
                onChange={(e) => setExam(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium appearance-none"
              >
                {EXAMS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700">Output Language</label>
              <div className="flex gap-3">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.id}
                    onClick={() => setLanguage(lang.id)}
                    className={`flex-1 py-3 rounded-2xl font-bold transition-all ${language === lang.id ? 'bg-purple-50 text-purple-600 border-2 border-purple-200' : 'bg-slate-50 text-slate-500 border-2 border-transparent hover:bg-slate-100'}`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6 border border-red-100">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="w-full bg-purple-600 text-white font-bold py-4 rounded-2xl hover:bg-purple-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Summary & Audio...
              </>
            ) : (
              <>
                <Headphones className="w-5 h-5" />
                Create Podcast
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {isGenerated && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setIsGenerated(false)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                <RefreshCcw className="w-5 h-5" />
                New Topic
              </button>
              
              <button
                onClick={handleTakeTest}
                disabled={generatingTest}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 sm:ml-auto"
              >
                {generatingTest ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Test...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Take Test
                  </>
                )}
              </button>

              {audioUrl && (
                <button
                  onClick={handleDownloadAudio}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download Audio
                </button>
              )}
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6 border border-red-100">
                {error}
              </div>
            )}

            {/* Audio Player Card */}
            {audioUrl && (
              <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[2rem] p-8 text-white shadow-xl shadow-purple-900/20 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20">
                  <Headphones className="w-10 h-10 text-white" />
                </div>
                
                <div>
                  <h2 className="text-2xl font-black mb-2">{topic}</h2>
                  <p className="text-purple-200 font-medium">{exam} • {LANGUAGES.find(l => l.id === language)?.name} Summary</p>
                </div>

                <button
                  onClick={togglePlay}
                  className="w-20 h-20 bg-white text-purple-600 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                >
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </button>

                <audio 
                  ref={audioRef} 
                  src={audioUrl} 
                  onEnded={handleAudioEnded}
                  onPause={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  className="hidden" 
                />
              </div>
            )}

            {/* Transcript / Summary Text */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-purple-600" />
                Summary Transcript
              </h3>
              <div className="prose prose-slate prose-lg max-w-none prose-p:text-slate-600 prose-p:leading-relaxed">
                <Markdown>{summaryText}</Markdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
