import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveUserProfile } from '../utils/firebase';
import { auth } from '../utils/firebase';

export default function OnboardingDialog({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({ name: '', exam: '', attempt: '', level: '' });

  const handleSave = async () => {
    if (auth.currentUser) {
      await saveUserProfile(auth.currentUser.uid, profile);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900">Welcome!</h2>
            <p className="text-slate-600">Let's personalize your experience.</p>
            <input type="text" placeholder="Your Name" className="w-full p-3 bg-slate-50 border rounded-xl" onChange={e => setProfile({...profile, name: e.target.value})} />
            <button onClick={() => setStep(1)} className="w-full bg-slate-900 text-white py-3 rounded-xl">Next</button>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900">Preferred Exam</h2>
            <select className="w-full p-3 bg-slate-50 border rounded-xl" onChange={e => setProfile({...profile, exam: e.target.value})}>
              <option value="">Select Exam</option>
              <option value="SSC CGL">SSC CGL</option>
              <option value="RRB NTPC">RRB NTPC</option>
            </select>
            <button onClick={() => setStep(2)} className="w-full bg-slate-900 text-white py-3 rounded-xl">Next</button>
          </div>
        )}
        {/* ... add steps for attempt and level ... */}
        {step === 3 && (
            <div className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900">Ready to begin?</h2>
                <button onClick={handleSave} className="w-full bg-emerald-500 text-white py-3 rounded-xl">Let's Go!</button>
            </div>
        )}
      </motion.div>
    </div>
  );
}
