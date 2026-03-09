import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Upload, FileText, BarChart3, TrendingUp, Target, Calendar, Download, Settings, Plus, Trash2, Loader2, ChevronRight, ChevronDown, FileUp, ShieldCheck, Zap } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface StructuredQuestion {
  question_text: string;
  options: string[];
  correct_option: string;
  year: number;
  subject: string;
  detected_chapter: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface ExamAnalysis {
  chapterImportance: { chapter: string; score: number }[];
  predictedTopics: { chapter: string; probability: number }[];
  topicFrequency: { chapter: string; total: number; percentage: number; trend: 'Increasing' | 'Stable' | 'Decreasing' }[];
  difficultyTrend: { year: number; easy: number; medium: number; hard: number }[];
  studyStrategy: {
    priorityChapters: string[];
    timeAllocation: { chapter: string; percentage: number }[];
    weeklyPlan: { week: number; chapters: string[] }[];
  };
  mostRepeatedQuestions: { chapter: string; questions: string[] }[];
  practiceQuestions: { chapter: string; question: string; options: string[]; answer: string }[];
}

interface ExamPaper {
  id: string;
  year: number;
  questionPdfName: string;
  answerKeyPdfName?: string;
  questions: StructuredQuestion[];
}

interface ParikshAIExam {
  id: string;
  name: string;
  subject: string;
  chapters: string[];
  papers: ExamPaper[];
  analysis?: ExamAnalysis;
}

interface CoachingSettings {
  instituteName: string;
  logoUrl: string;
  brandColor: string;
}

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f43f5e', '#eab308'];

export default function ParikshAI() {
  const [exams, setExams] = useState<ParikshAIExam[]>([]);
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newExam, setNewExam] = useState({ name: '', subject: '', chapters: '' });
  const [coachingSettings, setCoachingSettings] = useState<CoachingSettings>({
    instituteName: 'ParikshAI Default',
    logoUrl: '',
    brandColor: '#f97316'
  });
  const [showSettings, setShowSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  
  const [uploadYear, setUploadYear] = useState<number>(new Date().getFullYear());
  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const [answerFile, setAnswerFile] = useState<File | null>(null);

  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  const toggleSubject = (subject: string) => {
    setExpandedSubjects(prev => ({ ...prev, [subject]: !prev[subject] }));
  };

  const toggleChapter = (chapter: string) => {
    setExpandedChapters(prev => ({ ...prev, [chapter]: !prev[chapter] }));
  };

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedExams = localStorage.getItem('parikshai_exams');
    if (savedExams) setExams(JSON.parse(savedExams));
    
    const savedSettings = localStorage.getItem('parikshai_settings');
    if (savedSettings) setCoachingSettings(JSON.parse(savedSettings));
  }, []);

  const saveExams = (newExams: ParikshAIExam[]) => {
    setExams(newExams);
    localStorage.setItem('parikshai_exams', JSON.stringify(newExams));
  };

  const saveSettings = (settings: CoachingSettings) => {
    setCoachingSettings(settings);
    localStorage.setItem('parikshai_settings', JSON.stringify(settings));
  };

  const handleCreateExam = () => {
    if (!newExam.name || !newExam.subject) return;
    const exam: ParikshAIExam = {
      id: Date.now().toString(),
      name: newExam.name,
      subject: newExam.subject,
      chapters: newExam.chapters.split(',').map(c => c.trim()).filter(c => c),
      papers: []
    };
    saveExams([...exams, exam]);
    setActiveExamId(exam.id);
    setIsCreating(false);
    setNewExam({ name: '', subject: '', chapters: '' });
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const url = URL.createObjectURL(file);
    try {
      const pdf = await pdfjsLib.getDocument(url).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      return fullText;
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const handleUploadPaper = async () => {
    if (!questionFile || !activeExamId) return;
    const exam = exams.find(e => e.id === activeExamId);
    if (!exam) return;

    setIsProcessing(true);
    try {
      setProcessingStatus('Extracting text from PDF...');
      const questionText = await extractTextFromPdf(questionFile);
      let answerText = '';
      if (answerFile) {
        answerText = await extractTextFromPdf(answerFile);
      }

      setProcessingStatus('Analyzing questions with Gemini AI...');
      const apiKey = localStorage.getItem('user_gemini_api_key');
      if (!apiKey) throw new Error("Gemini API key not found. Please set it in Settings.");
      
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        You are an expert educational data extractor.
        Extract ALL individual questions from the following exam paper text.
        CRITICAL: DO NOT SKIP ANY QUESTIONS. Extract every single question, even if it is repeated or similar to another question.
        
        For each question, map to the following JSON structure exactly:
        - "question_text": The main question text ONLY. You MUST separate the options from the question text.
        - "options": An array of strings containing the available options. You MUST extract the options into this array if they exist in the text. Example: ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"]. If it is not a multiple choice question, return an empty array [].
        - "correct_option": The exact text of the correct answer. If unknown, return an empty string "".
        - "detected_chapter": The most relevant chapter from the provided list: ${exam.chapters.join(', ') || 'Infer from context'}.
        - "difficulty": "Easy", "Medium", or "Hard".
        - "subject": Infer the specific subject of the question (e.g., "Mathematics", "Science", "Reasoning", "English", etc.). DO NOT hardcode it. Look at the question content and the section headers in the text to determine the correct subject.
        - "year": ${uploadYear}
        
        CRITICAL INSTRUCTION FOR OPTIONS: If the question text contains (a), (b), (c), (d) or A), B), C), D) or 1), 2), 3), 4) or similar option indicators, you MUST remove them from "question_text" and put them into the "options" array. DO NOT leave options inside the "question_text". If you fail to extract options into the array, the UI will break.
        
        Exam Subject: ${exam.subject}
        Year: ${uploadYear}
        
        Question Paper Text:
        ${questionText.substring(0, 30000)}
        
        ${answerText ? `Answer Key Text:\n${answerText.substring(0, 10000)}` : ''}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question_text: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correct_option: { type: Type.STRING },
                year: { type: Type.INTEGER },
                subject: { type: Type.STRING },
                detected_chapter: { type: Type.STRING },
                difficulty: { type: Type.STRING, description: "Easy, Medium, or Hard" }
              },
              required: ["question_text", "options", "correct_option", "year", "subject", "detected_chapter", "difficulty"]
            }
          }
        }
      });

      const extractedQuestions: StructuredQuestion[] = JSON.parse(response.text || '[]');
      
      const sanitizedQuestions = extractedQuestions.map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : [],
        correct_option: q.correct_option || ''
      }));
      
      const newPaper: ExamPaper = {
        id: Date.now().toString(),
        year: uploadYear,
        questionPdfName: questionFile.name,
        answerKeyPdfName: answerFile?.name,
        questions: sanitizedQuestions
      };

      const updatedExams = exams.map(e => {
        if (e.id === activeExamId) {
          return { ...e, papers: [...e.papers, newPaper] };
        }
        return e;
      });
      
      saveExams(updatedExams);
      setQuestionFile(null);
      setAnswerFile(null);
      setProcessingStatus('');
    } catch (error: any) {
      console.error(error);
      alert("Error processing PDF: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateAnalysis = async () => {
    const exam = exams.find(e => e.id === activeExamId);
    if (!exam || exam.papers.length < 1) {
      alert("Minimum 1 year of papers required for trend analysis.");
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Generating AI Trend Analysis & Study Strategy...');
    
    try {
      const apiKey = localStorage.getItem('user_gemini_api_key');
      if (!apiKey) throw new Error("Gemini API key not found.");
      
      const ai = new GoogleGenAI({ apiKey });
      
      const allQuestions = exam.papers.flatMap(p => p.questions);
      
      const prompt = `
        You are an expert academic strategist and data analyst.
        Analyze the following structured question data from past ${exam.subject} exams.
        
        Generate a comprehensive trend analysis, importance ranking, predictions, and study strategy.
        
        Data:
        ${JSON.stringify(allQuestions)}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              chapterImportance: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { chapter: { type: Type.STRING }, score: { type: Type.NUMBER, description: "0-100" } }
                }
              },
              predictedTopics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { chapter: { type: Type.STRING }, probability: { type: Type.NUMBER, description: "0-100" } }
                }
              },
              topicFrequency: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { 
                    chapter: { type: Type.STRING }, 
                    total: { type: Type.INTEGER }, 
                    percentage: { type: Type.NUMBER }, 
                    trend: { type: Type.STRING, description: "Increasing, Stable, or Decreasing" } 
                  }
                }
              },
              difficultyTrend: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { year: { type: Type.INTEGER }, easy: { type: Type.INTEGER }, medium: { type: Type.INTEGER }, hard: { type: Type.INTEGER } }
                }
              },
              studyStrategy: {
                type: Type.OBJECT,
                properties: {
                  priorityChapters: { type: Type.ARRAY, items: { type: Type.STRING } },
                  timeAllocation: {
                    type: Type.ARRAY,
                    items: { type: Type.OBJECT, properties: { chapter: { type: Type.STRING }, percentage: { type: Type.NUMBER } } }
                  },
                  weeklyPlan: {
                    type: Type.ARRAY,
                    items: { type: Type.OBJECT, properties: { week: { type: Type.INTEGER }, chapters: { type: Type.ARRAY, items: { type: Type.STRING } } } }
                  }
                }
              },
              mostRepeatedQuestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { chapter: { type: Type.STRING }, questions: { type: Type.ARRAY, items: { type: Type.STRING } } }
                }
              },
              practiceQuestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: { chapter: { type: Type.STRING }, question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, answer: { type: Type.STRING } }
                }
              }
            }
          }
        }
      });

      const analysis: ExamAnalysis = JSON.parse(response.text || '{}');
      
      const updatedExams = exams.map(e => {
        if (e.id === activeExamId) {
          return { ...e, analysis };
        }
        return e;
      });
      
      saveExams(updatedExams);
    } catch (error: any) {
      console.error(error);
      alert("Error generating analysis: " + error.message);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const downloadReport = async () => {
    window.print();
  };

  const activeExam = exams.find(e => e.id === activeExamId);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden print:hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-2.5 rounded-xl">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Pariksh<span className="text-orange-500">AI</span></h1>
          </div>
          <p className="text-slate-400 font-medium max-w-xl">
            AI-powered exam trend analysis platform. Upload past papers to generate insights, trend reports, and study strategies.
          </p>
        </div>
        <div className="relative z-10 flex gap-3">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="bg-slate-800 hover:bg-slate-700 p-3 rounded-xl transition-colors"
            title="Coaching Mode Settings"
          >
            <Settings className="w-5 h-5 text-slate-300" />
          </button>
          <button 
            onClick={() => { setIsCreating(true); setActiveExamId(null); }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Exam
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl"
          >
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-500" />
              Coaching Mode (White-labeling)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Institute Name</label>
                <input 
                  type="text" 
                  value={coachingSettings.instituteName}
                  onChange={e => setCoachingSettings({...coachingSettings, instituteName: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Logo URL</label>
                <input 
                  type="text" 
                  value={coachingSettings.logoUrl}
                  onChange={e => setCoachingSettings({...coachingSettings, logoUrl: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Brand Color</label>
                <input 
                  type="color" 
                  value={coachingSettings.brandColor}
                  onChange={e => setCoachingSettings({...coachingSettings, brandColor: e.target.value})}
                  className="w-full h-10 rounded-xl cursor-pointer"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => { saveSettings(coachingSettings); setShowSettings(false); }}
                className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold"
              >
                Save Settings
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar: Exam List */}
        <div className="lg:col-span-1 space-y-4 print:hidden">
          <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest px-2">Your Exams</h3>
          {exams.length === 0 && !isCreating && (
            <div className="text-sm text-slate-500 px-2 italic">No exams created yet.</div>
          )}
          {exams.map(exam => (
            <button
              key={exam.id}
              onClick={() => { setActiveExamId(exam.id); setIsCreating(false); }}
              className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between ${
                activeExamId === exam.id 
                  ? 'bg-orange-50 border-orange-200 border shadow-sm' 
                  : 'bg-white border-slate-100 border hover:bg-slate-50'
              }`}
            >
              <div>
                <div className={`font-bold ${activeExamId === exam.id ? 'text-orange-700' : 'text-slate-800'}`}>
                  {exam.name}
                </div>
                <div className="text-xs text-slate-500">{exam.subject} • {exam.papers.length} papers</div>
              </div>
              <ChevronRight className={`w-4 h-4 ${activeExamId === exam.id ? 'text-orange-500' : 'text-slate-400'}`} />
            </button>
          ))}
        </div>

        {/* Main Panel */}
        <div className="lg:col-span-3 print:col-span-4">
          
          {isCreating && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl space-y-6"
            >
              <h2 className="text-2xl font-black text-slate-800">Create New Exam</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Exam Name</label>
                  <input 
                    type="text" 
                    value={newExam.name}
                    onChange={e => setNewExam({...newExam, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="e.g., JEE Advanced 2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Subject</label>
                  <input 
                    type="text" 
                    value={newExam.subject}
                    onChange={e => setNewExam({...newExam, subject: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="e.g., Physics"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Syllabus Chapters (Comma separated, Optional)</label>
                  <textarea 
                    value={newExam.chapters}
                    onChange={e => setNewExam({...newExam, chapters: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none min-h-[100px]"
                    placeholder="e.g., Modern Physics, Electrostatics, Optics..."
                  />
                </div>
                <button 
                  onClick={handleCreateExam}
                  disabled={!newExam.name || !newExam.subject}
                  className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  Create Exam
                </button>
              </div>
            </motion.div>
          )}

          {activeExam && !isCreating && (
            <div className="space-y-8">
              {/* Exam Header & Upload */}
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 print:hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-black text-slate-800">{activeExam.name}</h2>
                    <p className="text-slate-500 font-medium">{activeExam.subject}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-orange-500">{activeExam.papers.length}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Papers Uploaded</div>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                  <h4 className="font-bold text-slate-700 flex items-center gap-2">
                    <FileUp className="w-5 h-5 text-orange-500" />
                    Upload Past Paper
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Year</label>
                      <input 
                        type="number" 
                        value={uploadYear}
                        onChange={e => setUploadYear(parseInt(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Question Paper (PDF)</label>
                      <input 
                        type="file" 
                        accept=".pdf"
                        onChange={e => setQuestionFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Answer Key (PDF, Optional)</label>
                      <input 
                        type="file" 
                        accept=".pdf"
                        onChange={e => setAnswerFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleUploadPaper}
                    disabled={!questionFile || isProcessing || activeExam.papers.length >= 10}
                    className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing && processingStatus.includes('Extracting') ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    {isProcessing && processingStatus.includes('Extracting') ? 'Processing PDF...' : activeExam.papers.length >= 10 ? 'Max 10 Papers Reached' : 'Upload & Extract Data'}
                  </button>
                </div>

                {/* Generate Analysis Button */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-500">
                    {activeExam.papers.length < 1 
                      ? "⚠️ Minimum 1 year of papers required for trend analysis." 
                      : `✅ Ready for AI Trend Analysis (${activeExam.papers.length}/10 papers)`}
                  </p>
                  <button 
                    onClick={generateAnalysis}
                    disabled={activeExam.papers.length < 1 || isProcessing}
                    className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all"
                  >
                    {isProcessing && processingStatus.includes('Generating') ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                    Generate AI Analysis
                  </button>
                </div>
              </div>

              {/* Processing Overlay */}
              {isProcessing && (
                <div className="bg-orange-50 border border-orange-200 p-6 rounded-2xl flex items-center gap-4 text-orange-800">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                  <span className="font-bold">{processingStatus}</span>
                </div>
              )}

              {/* Analysis Dashboard */}
              {activeExam.analysis && !isProcessing && (
                <div className="space-y-8" ref={reportRef}>
                  
                  {/* Report Header (Visible mainly in PDF) */}
                  <div className="bg-slate-900 p-8 rounded-3xl text-white flex justify-between items-center" style={{ backgroundColor: coachingSettings.brandColor }}>
                    <div>
                      <h2 className="text-3xl font-black">{coachingSettings.instituteName}</h2>
                      <p className="opacity-80">ParikshAI Trend Report: {activeExam.name}</p>
                    </div>
                    {coachingSettings.logoUrl && (
                      <img src={coachingSettings.logoUrl} alt="Logo" className="h-16 bg-white p-2 rounded-xl" crossOrigin="anonymous" />
                    )}
                    <button 
                      onClick={downloadReport}
                      className="bg-white/20 hover:bg-white/30 p-3 rounded-xl backdrop-blur-sm transition-colors print:hidden"
                      title="Download PDF Report"
                    >
                      <Download className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Top Predictions & Rankings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                      <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-orange-500" />
                        AI Predicted Topics (Next Exam)
                      </h3>
                      <div className="space-y-3">
                        {activeExam.analysis.predictedTopics.slice(0, 5).map((topic, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="font-medium text-slate-700">{topic.chapter}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${topic.probability}%` }} />
                              </div>
                              <span className="text-sm font-bold text-slate-900 w-10 text-right">{topic.probability}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                      <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-500" />
                        Chapter Importance Ranking
                      </h3>
                      <div className="space-y-3">
                        {activeExam.analysis.chapterImportance.slice(0, 5).map((ch, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                              {i + 1}
                            </div>
                            <span className="font-medium text-slate-700 flex-1">{ch.chapter}</span>
                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold">
                              Score: {ch.score}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                      <h3 className="text-lg font-black text-slate-800 mb-6">Topic Frequency</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={[...activeExam.analysis.topicFrequency].sort((a, b) => b.percentage - a.percentage)} 
                            layout="vertical" 
                            margin={{ left: 80, right: 20, top: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis 
                              dataKey="chapter" 
                              type="category" 
                              axisLine={false} 
                              tickLine={false} 
                              width={80} 
                              tick={{fontSize: 11, fill: '#64748b'}} 
                            />
                            <RechartsTooltip 
                              cursor={{fill: '#f8fafc'}}
                              contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            />
                            <Bar dataKey="percentage" fill="#f97316" radius={[0, 4, 4, 0]}>
                              {activeExam.analysis.topicFrequency.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                      <h3 className="text-lg font-black text-slate-800 mb-6">Difficulty Trend</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={activeExam.analysis.difficultyTrend}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="year" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <RechartsTooltip />
                            <Legend />
                            <Line type="monotone" dataKey="easy" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="medium" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="hard" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Study Strategy */}
                  <div className="bg-orange-50 p-8 rounded-3xl border border-orange-100">
                    <h3 className="text-2xl font-black text-orange-900 mb-6 flex items-center gap-2">
                      <Calendar className="w-6 h-6" />
                      AI Study Strategy Generator
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-bold text-orange-800 mb-3 uppercase text-xs tracking-widest">Time Allocation</h4>
                        <div className="space-y-2">
                          {activeExam.analysis.studyStrategy.timeAllocation.map((ta, i) => (
                            <div key={i} className="flex items-center justify-between bg-white p-3 rounded-xl border border-orange-100">
                              <span className="font-medium text-slate-700">{ta.chapter}</span>
                              <span className="font-black text-orange-600">{ta.percentage}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-orange-800 mb-3 uppercase text-xs tracking-widest">Weekly Plan</h4>
                        <div className="space-y-3">
                          {activeExam.analysis.studyStrategy.weeklyPlan.map((wp, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-orange-100">
                              <div className="font-black text-slate-800 mb-2">Week {wp.week}</div>
                              <div className="flex flex-wrap gap-2">
                                {wp.chapters.map((ch, j) => (
                                  <span key={j} className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-xs font-bold">
                                    {ch}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Most Repeated Questions */}
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-orange-500" />
                      Most Repeated Concepts
                    </h3>
                    <div className="space-y-6">
                      {activeExam.analysis.mostRepeatedQuestions.map((mrq, i) => (
                        <div key={i}>
                          <h4 className="font-bold text-slate-900 mb-3 bg-slate-50 inline-block px-3 py-1 rounded-lg">
                            {mrq.chapter}
                          </h4>
                          <ul className="space-y-2 pl-4">
                            {mrq.questions.map((q, j) => (
                              <li key={j} className="text-slate-600 flex gap-2">
                                <span className="text-orange-500 font-bold">•</span>
                                {q}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Generated Practice Questions */}
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                      <Brain className="w-6 h-6 text-orange-500" />
                      AI Generated Practice Questions
                    </h3>
                    <div className="space-y-6">
                      {activeExam.analysis.practiceQuestions.map((pq, i) => (
                        <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                          <div className="flex items-center justify-between mb-4">
                            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-xs font-bold">
                              {pq.chapter}
                            </span>
                            <span className="text-slate-400 text-sm font-bold">Q{i + 1}</span>
                          </div>
                          <p className="font-medium text-slate-800 mb-4">{pq.question}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            {pq.options.map((opt, j) => (
                              <div key={j} className="bg-white border border-slate-200 p-3 rounded-xl text-sm text-slate-600">
                                {opt}
                              </div>
                            ))}
                          </div>
                          <div className="text-sm font-bold text-emerald-600 bg-emerald-50 inline-block px-3 py-1.5 rounded-lg">
                            Answer: {pq.answer}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chapter-wise Past Questions */}
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Target className="w-6 h-6 text-orange-500" />
                        Chapter-wise Past Questions
                      </h3>
                      <button 
                        onClick={() => window.print()}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors print:hidden"
                      >
                        <Download className="w-4 h-4" />
                        Download All
                      </button>
                    </div>
                    <div className="space-y-12">
                      {Object.entries(
                        activeExam.papers.flatMap(p => p.questions).reduce((acc, q) => {
                          const subject = q.subject || 'Uncategorized Subject';
                          const chapter = q.detected_chapter || 'Uncategorized Chapter';
                          if (!acc[subject]) acc[subject] = {};
                          if (!acc[subject][chapter]) acc[subject][chapter] = [];
                          acc[subject][chapter].push(q);
                          return acc;
                        }, {} as Record<string, Record<string, StructuredQuestion[]>>)
                      ).map(([subject, chapters], i) => (
                        <div key={i} className="space-y-4">
                          <div 
                            className="flex items-center justify-between border-b-2 border-slate-800 pb-2 cursor-pointer group"
                            onClick={() => toggleSubject(subject)}
                          >
                            <h3 className="font-black text-2xl text-slate-900 uppercase tracking-tight flex items-center gap-2">
                              {expandedSubjects[subject] ? <ChevronDown className="w-6 h-6 text-orange-500" /> : <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-orange-500" />}
                              {subject}
                            </h3>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                // Simple hack to print only this subject: hide others via CSS, print, then show
                                const style = document.createElement('style');
                                style.innerHTML = `@media print { .subject-section:not(.subject-${i}) { display: none !important; } }`;
                                document.head.appendChild(style);
                                window.print();
                                document.head.removeChild(style);
                              }}
                              className="bg-orange-50 hover:bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors print:hidden"
                            >
                              <Download className="w-3 h-3" />
                              Download Subject
                            </button>
                          </div>
                          
                          <AnimatePresence>
                            {expandedSubjects[subject] && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className={`subject-section subject-${i} space-y-4 overflow-hidden`}
                              >
                                {Object.entries(chapters).map(([chapter, questions], j) => {
                                  const chapterKey = `${subject}-${chapter}`;
                                  return (
                                    <div key={j} className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                      <div 
                                        className="flex items-center justify-between cursor-pointer group"
                                        onClick={() => toggleChapter(chapterKey)}
                                      >
                                        <h4 className="font-bold text-lg text-orange-600 bg-orange-100/50 inline-flex items-center gap-2 px-4 py-1.5 rounded-xl">
                                          {expandedChapters[chapterKey] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                          {chapter} <span className="text-sm font-normal text-orange-800/60 ml-2">({questions.length} questions)</span>
                                        </h4>
                                      </div>
                                      
                                      <AnimatePresence>
                                        {expandedChapters[chapterKey] && (
                                          <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="space-y-6 overflow-hidden pt-2"
                                          >
                                            {questions.map((q, k) => (
                                              <div key={k} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                                <div className="flex justify-between items-start mb-4">
                                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md">Q{k + 1} • {q.year} • {q.difficulty}</span>
                                                </div>
                                                <p className="text-slate-800 font-medium whitespace-pre-wrap mb-6 text-lg">{q.question_text}</p>
                                                
                                                {q.options && q.options.length > 0 && (
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                                    {q.options.map((opt, optIdx) => {
                                                      const isCorrect = q.correct_option && opt.trim().toLowerCase() === q.correct_option.trim().toLowerCase();
                                                      return (
                                                        <div 
                                                          key={optIdx} 
                                                          className={`p-3 rounded-xl text-sm font-medium border ${
                                                            isCorrect 
                                                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm' 
                                                              : 'bg-slate-50 border-slate-200 text-slate-600'
                                                          }`}
                                                        >
                                                          <span className={`inline-block w-6 h-6 rounded-full text-center leading-6 mr-2 text-xs ${isCorrect ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                                                            {String.fromCharCode(65 + optIdx)}
                                                          </span>
                                                          {opt}
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                )}
                                                
                                                {q.correct_option && (!q.options || q.options.length === 0) && (
                                                  <div className="text-sm font-bold text-emerald-700 bg-emerald-50 inline-block px-4 py-2 rounded-xl border border-emerald-100">
                                                    Answer: {q.correct_option}
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
