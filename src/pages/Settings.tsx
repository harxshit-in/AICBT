import React, { useState, useEffect } from 'react';
import { Key, CheckCircle2, AlertCircle, ExternalLink, Info, ShieldCheck, Loader2, Download } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { usePWA } from '../context/PWAContext';
import { withRetry } from '../utils/aiClient';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle');
  const [error, setError] = useState('');
  const { isInstallable, installApp } = usePWA();

  useEffect(() => {
    const saved = localStorage.getItem('user_gemini_api_key');
    if (saved) {
      setApiKey(saved);
      setStatus('valid');
    }
  }, []);

  const testKey = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API Key.');
      setStatus('invalid');
      return;
    }

    setStatus('testing');
    setError('');

    try {
      const genAI = new GoogleGenAI({ apiKey });
      const response = await withRetry(() => genAI.models.generateContent({
        model: 'gemini-flash-latest',
        contents: 'Hello, are you working?',
      }));
      
      if (response.text) {
        localStorage.setItem('user_gemini_api_key', apiKey);
        setStatus('valid');
      } else {
        throw new Error('Invalid response from Gemini API.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid API Key. Please check and try again.');
      setStatus('invalid');
      localStorage.removeItem('user_gemini_api_key');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500">Manage your Gemini API Key and application preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 text-slate-800 font-bold mb-2">
              <Key className="w-5 h-5 text-orange-500" />
              Gemini API Key
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setStatus('idle');
                  }}
                  className={`w-full bg-slate-50 border rounded-2xl py-4 px-5 focus:outline-none focus:ring-2 transition-all ${
                    status === 'valid' ? 'border-emerald-200 focus:ring-emerald-500/20' : 
                    status === 'invalid' ? 'border-red-200 focus:ring-red-500/20' : 'border-slate-200 focus:ring-orange-500/20'
                  }`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <AnimatePresence mode="wait">
                    {status === 'valid' && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      </motion.div>
                    )}
                    {status === 'invalid' && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <AlertCircle className="w-6 h-6 text-red-500" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <button
                disabled={status === 'testing'}
                onClick={testKey}
                className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {status === 'testing' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Save & Test Key'
                )}
              </button>

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm font-medium bg-red-50 p-4 rounded-2xl">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex gap-4">
              <ShieldCheck className="w-6 h-6 text-slate-400 shrink-0" />
              <p className="text-xs text-slate-500 leading-relaxed">
                Your API key is stored <strong>only in your browser's local storage</strong>. 
                It is never sent to our servers. We value your privacy and security.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-orange-50 p-8 rounded-[2.5rem] border border-orange-100 space-y-6">
            <div className="flex items-center gap-3 text-orange-900 font-bold">
              <Info className="w-5 h-5 text-orange-600" />
              How to get a free API Key?
            </div>

            <div className="space-y-4">
              <ol className="text-sm text-orange-800/80 space-y-4 list-decimal list-inside font-medium">
                <li>
                  Go to <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="text-orange-600 underline font-bold inline-flex items-center gap-1">AI Studio <ExternalLink className="w-3 h-3" /></a>
                </li>
                <li>Sign in with your Google Account.</li>
                <li>Click on <strong>"Get API Key"</strong> in the top left menu.</li>
                <li>Click <strong>"Create API key"</strong>.</li>
                <li>Copy the key and paste it here.</li>
              </ol>

              <div className="bg-white/50 p-4 rounded-2xl text-xs text-orange-700 italic">
                Note: The free tier allows up to 1500 requests per day, which is more than enough for personal exam preparation.
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 text-slate-800 font-bold mb-2">
              <Download className="w-5 h-5 text-orange-500" />
              Install Application
            </div>
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Install AI CBT on your device for a better, full-screen experience and offline access to your saved tests.
              </p>
              {isInstallable ? (
                <button
                  onClick={installApp}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Install App Now
                </button>
              ) : (
                <div className="bg-slate-50 p-4 rounded-2xl text-sm text-slate-500 text-center font-medium border border-slate-100">
                  App is already installed or your browser doesn't support installation.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
