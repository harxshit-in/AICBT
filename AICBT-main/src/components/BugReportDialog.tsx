import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bug, Send, X, CheckCircle2 } from 'lucide-react';
import { reportBug } from '../utils/firebase';

interface BugReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BugReportDialog({ isOpen, onClose }: BugReportDialogProps) {
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSending(true);
    try {
      await reportBug({
        description,
        steps,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
      setIsSent(true);
      setTimeout(() => {
        setIsSent(false);
        setDescription('');
        setSteps('');
        onClose();
      }, 2000);
    } catch (e) {
      console.error("Failed to send bug report", e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
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
            
            <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center mb-6">
              <Bug className="w-8 h-8" />
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 mb-2">Report a Bug</h3>
            <p className="text-slate-600 font-medium mb-6">
              Found an issue? Let us know so we can fix it.
            </p>
            
            {isSent ? (
              <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                <CheckCircle2 className="w-6 h-6" />
                Bug reported successfully!
              </div>
            ) : (
              <form onSubmit={handleReport} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">What happened?</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Steps to reproduce (optional)</label>
                  <textarea
                    value={steps}
                    onChange={(e) => setSteps(e.target.value)}
                    placeholder="How can we see this bug?"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSending || !description.trim()}
                    className="flex-1 flex items-center justify-center gap-2 bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 disabled:opacity-70"
                  >
                    {isSending ? (
                      <span className="animate-pulse">Sending...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
