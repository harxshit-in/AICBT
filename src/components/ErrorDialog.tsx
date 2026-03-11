import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Send, X, CheckCircle2 } from 'lucide-react';
import { reportError } from '../utils/firebase';

interface ErrorDialogProps {
  isOpen: boolean;
  error: string;
  context?: string;
  onClose: () => void;
}

export default function ErrorDialog({ isOpen, error, context, onClose }: ErrorDialogProps) {
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleReport = async () => {
    setIsSending(true);
    try {
      await reportError({
        message: error,
        context: context || 'Unknown Context',
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
      setIsSent(true);
      setTimeout(() => {
        setIsSent(false);
        onClose();
      }, 2000);
    } catch (e) {
      console.error("Failed to send report", e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 mb-2">An Error Occurred</h3>
            <p className="text-slate-600 font-medium mb-4">
              We encountered an issue while processing your request.
            </p>
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 max-h-32 overflow-y-auto">
              <p className="text-sm font-mono text-red-600 break-words">
                {error}
              </p>
            </div>

            {isSent ? (
              <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold p-3 bg-emerald-50 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
                Error reported successfully!
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleReport}
                  disabled={isSending}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-200 disabled:opacity-70"
                >
                  {isSending ? (
                    <span className="animate-pulse">Sending...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Report to Fix
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
