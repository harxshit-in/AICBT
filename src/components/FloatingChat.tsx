import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAI, withRetry } from '../utils/aiClient';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
    { role: 'ai', content: "Hi! I'm your AI Study Mentor. Ask me anything about your SSC or Railway preparation!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const { ai, systemInstruction } = await getAI();
      const prompt = `
        You are a helpful AI Study Mentor for students preparing for SSC (Staff Selection Commission) and Railway exams in India.
        Provide concise, accurate, and encouraging answers. Use bullet points for clarity.
        If the user asks about a specific subject like History, Polity, or Math, give them a quick summary or a tip.
        
        User Question: ${userMsg}
      `;

      const response = await withRetry(() => ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [{ parts: [{ text: prompt }] }],
        config: { systemInstruction }
      }));

      setMessages(prev => [...prev, { role: 'ai', content: response.text || "I'm sorry, I couldn't process that." }]);
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, { role: 'ai', content: "I'm having trouble connecting. Please check your API key in settings." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`w-[350px] sm:w-[400px] bg-white border border-slate-200 shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col pointer-events-auto mb-4 ${isMinimized ? 'h-16' : 'h-[500px]'}`}
          >
            {/* Header */}
            <div className="bg-slate-900 p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500 p-2 rounded-xl">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-black text-sm">AI Study Mentor</div>
                  <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Always Online</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium ${
                        msg.role === 'user' 
                          ? 'bg-orange-500 text-white rounded-tr-none' 
                          : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-sm'
                      }`}>
                        <div className="prose prose-sm prose-slate max-w-none dark:prose-invert">
                          <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</Markdown>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thinking...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-slate-100">
                  <div className="relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Ask a doubt..."
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-4 pr-12 text-sm font-medium focus:outline-none focus:border-orange-500 transition-all"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(true)}
        className={`pointer-events-auto p-4 bg-slate-900 text-white rounded-full shadow-2xl shadow-slate-400 hover:scale-110 active:scale-95 transition-all group relative ${isOpen ? 'hidden' : 'flex'}`}
      >
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white animate-pulse" />
        <MessageSquare className="w-6 h-6" />
        <span className="absolute right-full mr-4 bg-white text-slate-900 px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-slate-100 shadow-xl">
          Ask AI Mentor
        </span>
      </button>
    </div>
  );
}
