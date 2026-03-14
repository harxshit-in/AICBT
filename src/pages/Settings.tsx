import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, ShieldCheck, Loader2, Download, GraduationCap, Save, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePWA } from '../context/PWAContext';
import { auth, getUserProfile, saveUserProfile } from '../utils/firebase';

export default function Settings() {
  const [credits, setCredits] = useState<number | null>(null);
  const [selectedExam, setSelectedExam] = useState('');
  const [isSavingExam, setIsSavingExam] = useState(false);
  const { isInstallable, installApp } = usePWA();

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const response = await fetch('/api/user-credits');
        const data = await response.json();
        setCredits(data.credits);
      } catch (error) {
        console.error('Failed to fetch credits:', error);
      }
    };

    const fetchProfile = async () => {
      if (auth.currentUser) {
        const profile = await getUserProfile(auth.currentUser.uid);
        if (profile?.exam) {
          setSelectedExam(profile.exam);
        }
      }
    };

    fetchCredits();
    fetchProfile();
  }, []);

  const saveExam = async () => {
    if (!auth.currentUser || !selectedExam) return;
    setIsSavingExam(true);
    try {
      await saveUserProfile(auth.currentUser.uid, { exam: selectedExam });
      alert('Exam preference updated!');
    } catch (e) {
      console.error(e);
      alert('Failed to save exam preference.');
    } finally {
      setIsSavingExam(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500">Manage your application preferences and view credits</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Credits Section */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 text-slate-800 font-bold mb-2">
              <Coins className="w-5 h-5 text-orange-500" />
              Daily AI Credits
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center space-y-4">
              <div className="text-4xl font-black text-slate-900">
                {credits !== null ? credits : '--'} <span className="text-lg text-slate-400 font-bold">/ 5</span>
              </div>
              <p className="text-sm text-slate-500 font-medium">
                Credits reset every 24 hours. Each AI feature usage costs 1 credit.
              </p>
              
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${((credits || 0) / 5) * 100}%` }}
                  className="h-full bg-orange-500"
                />
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex gap-4">
              <Info className="w-6 h-6 text-blue-500 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs text-blue-700 font-bold">
                  About Credits
                </p>
                <p className="text-[10px] text-blue-600 leading-relaxed">
                  To ensure fair usage and protect our server resources, we provide 5 free AI credits daily to every user. 
                </p>
              </div>
            </div>
          </div>

          {/* Exam Preference Section */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 text-slate-800 font-bold mb-2">
              <GraduationCap className="w-5 h-5 text-blue-500" />
              Target Exam
            </div>
            <div className="space-y-4">
              <select 
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              >
                <option value="">Select Exam</option>
                <option value="SSC CGL">SSC CGL</option>
                <option value="SSC CHSL">SSC CHSL</option>
                <option value="SSC CPO">SSC CPO</option>
                <option value="RRB NTPC">RRB NTPC</option>
                <option value="RRB Group D">RRB Group D</option>
                <option value="RRB ALP Technical">RRB ALP Technical</option>
              </select>
              <button
                onClick={saveExam}
                disabled={isSavingExam || !selectedExam}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isSavingExam ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Exam Preference
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 text-slate-800 font-bold mb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              Security & Privacy
            </div>
            <div className="space-y-4 text-sm text-slate-500 leading-relaxed">
              <p>
                We have moved to a server-side AI management system to protect your privacy and ensure better reliability. 
              </p>
              <p>
                You no longer need to provide your own API keys. Our system automatically handles key rotation and rate limiting for you.
              </p>
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
