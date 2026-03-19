import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../utils/firebase';
import { getAI } from '../../utils/aiClient';

const EXAMS = ['SSC', 'Railway', 'Banking', 'UPSC', 'Other'];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [exam, setExam] = useState('');
  const [customExam, setCustomExam] = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleExamSelect = async (selectedExam: string) => {
    const finalExam = selectedExam === 'Other' ? customExam : selectedExam;
    setExam(finalExam);
    
    // Update user profile
    if (auth.currentUser) {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        exam: finalExam,
        onboardingCompleted: false
      });
    }

    // Generate subjects based on exam
    const generatedSubjects = getSubjectsForExam(finalExam);
    setSubjects(generatedSubjects.map(s => ({ subject: s, teacher: '' })));
    setStep(2);
  };

  const handleTeacherChange = (index: number, teacher: string) => {
    const newSubjects = [...subjects];
    newSubjects[index].teacher = teacher;
    setSubjects(newSubjects);
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const ai = await getAI();
      
      const prompt = `You are an expert exam preparation coach. Generate a structured study roadmap for a user preparing for ${exam}.
The user has specified the following subjects and preferred teachers:
${subjects.map(s => `- ${s.subject}: ${s.teacher}`).join('\n')}

Please break the syllabus into topics, divide it into a weekly plan, include difficulty progression, and add recommended YouTube video queries using the teacher's name.

Return the output as a JSON array in the following format:
[
  {
    "subject": "Maths",
    "topics": [
      {
        "topic": "Algebra",
        "week": 1,
        "videos": [
          "Teacher Name Algebra Basics",
          "Exam Algebra Practice"
        ]
      }
    ]
  }
]
Return ONLY the JSON.`;

      const response = await ai.generateContent({
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const syllabus = JSON.parse(response.text);

      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          userSubjects: subjects,
          userSyllabus: syllabus,
          onboardingCompleted: true
        });
        onComplete();
      }
    } catch (error) {
      console.error("Error generating syllabus:", error);
      alert("Failed to generate syllabus. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Select Your Exam</h2>
          <div className="grid grid-cols-2 gap-4">
            {EXAMS.map(e => (
              <button key={e} onClick={() => handleExamSelect(e)} className="p-4 border rounded-lg hover:bg-blue-50">
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Subject & Teacher Mapping</h2>
          {subjects.map((s, i) => (
            <div key={s.subject} className="mb-4">
              <label className="block text-sm font-medium">{s.subject}</label>
              <input 
                type="text" 
                placeholder="Enter preferred teacher name"
                className="w-full p-2 border rounded"
                onChange={(e) => handleTeacherChange(i, e.target.value)}
              />
            </div>
          ))}
          <button 
            onClick={handleFinish} 
            disabled={loading}
            className="w-full p-3 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
          >
            {loading ? 'Generating Syllabus...' : 'Finish Onboarding'}
          </button>
        </div>
      )}
    </div>
  );
}

function getSubjectsForExam(exam: string) {
  if (exam === 'SSC') return ['Maths', 'Reasoning', 'English', 'GK/GS'];
  if (exam === 'Railway') return ['Maths', 'Reasoning', 'General Science', 'Current Affairs'];
  return ['Maths', 'Reasoning', 'General Knowledge'];
}
