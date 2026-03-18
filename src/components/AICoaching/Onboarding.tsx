import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Brain, ArrowRight, User, Calendar, Sparkles, Loader2 } from 'lucide-react';

const EXAM_SUBJECTS: { [key: string]: string[] } = {
  'SSC': ['Maths', 'Reasoning', 'English', 'GK/GS'],
  'Railway': ['Maths', 'Reasoning', 'General Science', 'Current Affairs'],
  'Banking': ['Quantitative Aptitude', 'Reasoning', 'English', 'General Awareness'],
  'UPSC': ['History', 'Geography', 'Polity', 'Economy', 'Science & Tech'],
  'Other': ['Mathematics', 'Reasoning', 'English', 'General Awareness']
};

interface OnboardingProps {
  onComplete: (data: any) => void;
  generating: boolean;
}

export default function Onboarding({ onComplete, generating }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [setupData, setSetupData] = useState({
    examType: '',
    targetDate: '',
    teachers: {} as Record<string, string>
  });

  const handleComplete = () => {
    onComplete(setupData);
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      {step === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-black">Select Your Exam</h1>
            <p className="text-zinc-400">Choose your target exam to get started.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(EXAM_SUBJECTS).map((exam) => (
              <button
                key={exam}
                onClick={() => {
                  setSetupData({ ...setupData, examType: exam });
                  setStep(2);
                }}
                className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500 transition-all text-left"
              >
                <div className="text-2xl font-bold">{exam}</div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
          <h2 className="text-4xl font-black">Subject & Teacher Mapping</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(EXAM_SUBJECTS[setupData.examType] || EXAM_SUBJECTS['Other']).map((subject) => (
              <div key={subject} className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">{subject}</label>
                <input
                  type="text"
                  placeholder="Enter teacher name"
                  className="w-full p-4 rounded-xl bg-zinc-950 border border-zinc-800"
                  onChange={(e) => setSetupData({
                    ...setupData,
                    teachers: { ...setupData.teachers, [subject]: e.target.value }
                  })}
                />
              </div>
            ))}
          </div>
          <button onClick={() => setStep(3)} className="w-full p-4 rounded-xl bg-emerald-500 text-black font-bold">
            Continue
          </button>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 text-center">
          <h2 className="text-4xl font-black">Set Target Date</h2>
          <input
            type="date"
            className="w-full p-6 rounded-2xl bg-zinc-950 border border-zinc-800 text-center"
            onChange={(e) => setSetupData({ ...setupData, targetDate: e.target.value })}
          />
          <button
            onClick={handleComplete}
            disabled={generating}
            className="w-full p-6 rounded-2xl bg-emerald-500 text-black font-black text-lg flex items-center justify-center gap-3"
          >
            {generating ? <Loader2 className="animate-spin" /> : <>Generate Syllabus <Sparkles /></>}
          </button>
        </motion.div>
      )}
    </div>
  );
}
