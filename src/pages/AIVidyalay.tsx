import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, Image as ImageIcon, FileText, Loader2, Search, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Download, BrainCircuit, RefreshCcw, Key, Settings } from 'lucide-react';
import { generateVidyalayText, generateVidyalaySlides, generateSlideImage, generateVidyalayTest, SlideData } from '../utils/aiVidyalay';
import { saveBank, generateBankId } from '../utils/storage';
import { logFeatureUsage } from '../utils/firebase';
import ReactMarkdown from 'react-markdown';
import ErrorDialog from '../components/ErrorDialog';

const EXAMS = [
  'UPSC CSE', 'SSC CGL', 'SSC CHSL', 'IBPS PO', 'SBI Clerk', 'RRB NTPC', 'NDA', 'CDS', 'State PSC'
];

export default function AIVidyalay() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [exam, setExam] = useState(EXAMS[0]);
  const [type, setType] = useState<'text' | 'image'>('image');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isGenerated, setIsGenerated] = useState(false);
  const [creatingTest, setCreatingTest] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  
  const [resultText, setResultText] = useState('');
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic or chapter name');
      return;
    }
    
    setError('');
    setLoading(true);
    setResultText('');
    setSlides([]);
    setCurrentSlide(0);

    try {
      if (type === 'text') {
        const text = await generateVidyalayText(topic, exam);
        setResultText(text);
        setIsGenerated(true);
      } else {
        const generatedSlides = await generateVidyalaySlides(topic, exam);
        if (generatedSlides.length === 0) {
          throw new Error("Failed to generate slides.");
        }
        
        // Initialize slides without images
        setSlides(generatedSlides);
        setIsGenerated(true);
        
        // Asynchronously generate images for each slide sequentially to avoid rate limits
        const generateImagesSequentially = async () => {
          for (let index = 0; index < generatedSlides.length; index++) {
            const slide = generatedSlides[index];
            try {
              const imageUrl = await generateSlideImage(slide.imagePrompt);
              setSlides(prev => {
                const newSlides = [...prev];
                newSlides[index] = { ...newSlides[index], imageUrl };
                return newSlides;
              });
              // Add a delay between requests to prevent 429 Too Many Requests
              await new Promise(resolve => setTimeout(resolve, 5000));
            } catch (err) {
              console.error(`Failed to generate image for slide ${index}`, err);
            }
          }
        };
        generateImagesSequentially();
      }
      await logFeatureUsage('ai_vidyalay', 'gemini-3-flash-preview', true);
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating content.');
      setShowErrorDialog(true);
      await logFeatureUsage('ai_vidyalay', 'gemini-3-flash-preview', false);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    let content = '';
    let filename = '';

    if (type === 'text') {
      content = resultText;
      filename = `${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.md`;
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // For images, create a simple HTML file with embedded base64 images
      content = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${topic} - ${exam} Notes</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f8fafc; }
            .slide { background: white; border-radius: 12px; padding: 20px; margin-bottom: 30px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
            img { max-width: 100%; border-radius: 8px; margin-bottom: 16px; }
            h2 { color: #0f172a; margin-top: 0; }
            .content { color: #334155; line-height: 1.6; }
          </style>
        </head>
        <body>
          <h1>${topic} - ${exam}</h1>
          ${slides.map(s => `
            <div class="slide">
              ${s.imageUrl ? `<img src="${s.imageUrl}" alt="${s.title}" />` : ''}
              <h2>${s.title}</h2>
              <div class="content">${s.content}</div>
            </div>
          `).join('')}
        </body>
        </html>
      `;
      filename = `${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_slides.html`;
      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleCreateTest = async () => {
    setCreatingTest(true);
    try {
      const questions = await generateVidyalayTest(topic, exam);
      if (questions.length === 0) throw new Error("Failed to generate test questions.");
      
      const bankId = generateBankId(`${topic} Test`);
      await saveBank({
        bankId,
        name: `${topic} - ${exam} Practice Test`,
        questions,
        createdAt: Date.now(),
        sourceFile: 'AI Vidyalay',
        timeLimit: questions.length * 2,
        negativeMarking: 0.25,
        category: exam,
        tags: [topic, exam, 'AI Vidyalay']
      });
      
      navigate(`/exam-overview/${bankId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create test.');
      setShowErrorDialog(true);
    } finally {
      setCreatingTest(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <ErrorDialog 
        isOpen={showErrorDialog} 
        error={error} 
        context="AIVidyalay" 
        onClose={() => setShowErrorDialog(false)} 
      />
      <header className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-blue-50 rounded-3xl mb-2">
          <GraduationCap className="w-10 h-10 text-blue-600" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">AI Vidyalay</h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
          Your personal AI tutor. Enter a topic, select your exam, and get a comprehensive study guide with the latest exam questions.
        </p>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 max-w-2xl mx-auto flex gap-3 items-start text-left">
          <BrainCircuit className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Pro Tip:</strong> AI Vidyalay uses Google Search grounding to find the latest exam data. 
            Free Gemini API keys have a daily limit for search. If you hit this limit, the app will automatically 
            fallback to its internal knowledge base so you can keep learning!
          </p>
        </div>
      </header>

      {/* Input Section */}
      {!isGenerated && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Topic or Chapter Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Thermodynamics, Indian Polity..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Target Exam</label>
              <select
                value={exam}
                onChange={(e) => setExam(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium appearance-none"
              >
                {EXAMS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-3 mb-8">
            <label className="text-sm font-bold text-slate-700">Output Format</label>
            <div className="flex gap-4">
              <button
                onClick={() => setType('image')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all ${type === 'image' ? 'bg-blue-50 text-blue-600 border-2 border-blue-200' : 'bg-slate-50 text-slate-500 border-2 border-transparent hover:bg-slate-100'}`}
              >
                <ImageIcon className="w-5 h-5" />
                Visual Slides (Images)
              </button>
              <button
                onClick={() => setType('text')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all ${type === 'text' ? 'bg-blue-50 text-blue-600 border-2 border-blue-200' : 'bg-slate-50 text-slate-500 border-2 border-transparent hover:bg-slate-100'}`}
              >
                <FileText className="w-5 h-5" />
                Detailed Text Guide
              </button>
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
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Content...
              </>
            ) : (
              <>
                <BookOpen className="w-5 h-5" />
                Start Learning
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {isGenerated && (
          <motion.div
            key="actions-bar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col sm:flex-row gap-4 mb-6"
          >
            <button
              onClick={() => setIsGenerated(false)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
            >
              <RefreshCcw className="w-5 h-5" />
              Start New Topic
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
            >
              <Download className="w-5 h-5" />
              Download Notes
            </button>
            <button
              onClick={handleCreateTest}
              disabled={creatingTest}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 sm:ml-auto disabled:opacity-50"
            >
              {creatingTest ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
              Create Test on this Topic
            </button>
          </motion.div>
        )}

        {resultText && type === 'text' && isGenerated && (
          <motion.div
            key="text-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white border border-slate-200 rounded-[2rem] p-8 md:p-12 shadow-sm"
          >
            <div className="prose prose-slate prose-lg max-w-none prose-headings:text-slate-900 prose-headings:font-black prose-h1:text-4xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-strong:text-slate-900 prose-a:text-blue-600 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-xl prose-blockquote:not-italic">
              <ReactMarkdown>{resultText}</ReactMarkdown>
            </div>
          </motion.div>
        )}

        {slides.length > 0 && type === 'image' && isGenerated && (
          <motion.div
            key="image-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm"
          >
            <div className="relative aspect-video bg-slate-100 flex items-center justify-center border-b border-slate-200">
              {slides[currentSlide].imageUrl ? (
                <img 
                  src={slides[currentSlide].imageUrl} 
                  alt={slides[currentSlide].title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <Loader2 className="w-10 h-10 animate-spin mb-4" />
                  <p className="font-medium">Generating illustration...</p>
                </div>
              )}
              
              {/* Navigation Arrows */}
              <button 
                onClick={() => setCurrentSlide(s => Math.max(0, s - 1))}
                disabled={currentSlide === 0}
                className="absolute left-4 p-3 bg-white/80 backdrop-blur-sm rounded-full text-slate-800 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <button 
                onClick={() => setCurrentSlide(s => Math.min(slides.length - 1, s + 1))}
                disabled={currentSlide === slides.length - 1}
                className="absolute right-4 p-3 bg-white/80 backdrop-blur-sm rounded-full text-slate-800 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              
              {/* Slide Counter */}
              <div className="absolute bottom-4 right-4 bg-slate-900/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-bold">
                {currentSlide + 1} / {slides.length}
              </div>
            </div>
            
            <div className="p-8">
              <h2 className="text-2xl font-black text-slate-900 mb-4">{slides[currentSlide].title}</h2>
              <div className="prose prose-slate max-w-none mb-6">
                <ReactMarkdown>{slides[currentSlide].content}</ReactMarkdown>
              </div>
              {slides[currentSlide].imageExplanation && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-800 font-medium italic">
                  {slides[currentSlide].imageExplanation}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
