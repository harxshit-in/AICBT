import React, { useState, useEffect } from 'react';
import { Newspaper, Loader2, Calendar, Share2, Download, ChevronRight, ChevronLeft, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { getApprovedCurrentAffairs } from '../utils/firebase';
import { getAI } from '../utils/aiClient';
import { useNavigate } from 'react-router-dom';
import { saveBank, generateBankId, QuestionBank } from '../utils/storage';

export default function DailyNews() {
  const [news, setNews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [readDays, setReadDays] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNews();
    const lastRead = localStorage.getItem('last_read_date');
    const today = new Date().toDateString();
    if (lastRead !== today) {
      const days = parseInt(localStorage.getItem('read_days') || '0') + 1;
      localStorage.setItem('read_days', days.toString());
      localStorage.setItem('last_read_date', today);
      setReadDays(days);
    } else {
      setReadDays(parseInt(localStorage.getItem('read_days') || '0'));
    }
  }, []);

  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const data = await getApprovedCurrentAffairs();
      setNews(data);
    } catch (error) {
      console.error('News Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuiz = async () => {
    if (news.length === 0) return;
    setIsGeneratingQuiz(true);
    try {
      const { ai, systemInstruction } = await getAI();
      const prompt = `Based on these current affairs, generate 5 MCQs for an exam. Return ONLY JSON: [ { "question": "...", "options": ["...", "...", "...", "..."], "correct": 0 } ]. News: ${JSON.stringify(news.slice(0, 5))}`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json', systemInstruction }
      });
      const questions = JSON.parse(response.text || '[]');
      const bank: QuestionBank = {
        bankId: generateBankId(`Quiz_${Date.now()}`),
        name: `Current Affairs Quiz - ${new Date().toLocaleDateString()}`,
        questions,
        createdAt: Date.now(),
        sourceFile: 'AI Generated',
        timeLimit: 10,
        category: 'Current Affairs',
        tags: ['CA', 'Quiz']
      };
      const id = await saveBank(bank);
      navigate(`/exam-overview/${id}`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black text-slate-900">Current Affairs</h1>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold"><Share2 className="w-4 h-4" /> Share</button>
              <button className="flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold"><Download className="w-4 h-4" /> Download</button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="w-10 h-10 animate-spin text-orange-500" /></div>
          ) : (
            <div className="space-y-4">
              {news.map(item => (
                <div key={item.id} className="bg-white p-6 rounded-2xl border flex gap-4 items-start hover:border-blue-200 transition-colors">
                  <div className="bg-slate-100 p-4 rounded-xl"><Newspaper className="w-8 h-8 text-slate-600" /></div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-900 mb-1">{item.title}</h3>
                    <p className="text-slate-500 text-sm">{item.highlights?.[0]}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border">
            <h3 className="font-bold text-lg mb-4">Reading Streak</h3>
            <div className="w-full bg-slate-100 rounded-full h-4 mb-2">
              <div className="bg-blue-600 h-4 rounded-full" style={{ width: `${Math.min(readDays * 3.33, 100)}%` }}></div>
            </div>
            <p className="text-sm text-slate-600">{readDays} days of current affairs read</p>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <h3 className="font-bold text-lg mb-2">Test Your Knowledge</h3>
            <button onClick={generateQuiz} disabled={isGeneratingQuiz} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
              {isGeneratingQuiz ? <Loader2 className="animate-spin w-5 h-5" /> : <><BookOpen className="w-5 h-5" /> Practice Now</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
