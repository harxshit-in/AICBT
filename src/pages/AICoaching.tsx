import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { auth, db, logFeatureUsage } from '../utils/firebase';
import ErrorDialog from '../components/ErrorDialog';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot,
  orderBy,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { Type } from "@google/genai";
import { getAI } from '../utils/aiClient';
import Onboarding from '../components/AICoaching/Onboarding';
import Dashboard from '../components/AICoaching/Dashboard';

interface Topic {
  id: string;
  subject: string;
  topicName: string;
  videoSearchQuery?: string;
  status: 'pending' | 'completed';
  videoUrl?: string;
  testResult?: any;
  order: number;
}

interface Profile {
  examType: string;
  targetDate: number;
  teachers: Record<string, string>;
}

export default function AICoaching() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [generating, setGenerating] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [takingTest, setTakingTest] = useState(false);
  const [generatedTest, setGeneratedTest] = useState<any>(null);
  const [testAnswers, setTestAnswers] = useState<Record<number, string>>({});
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [showSyllabus, setShowSyllabus] = useState(true);

  const user = auth.currentUser;

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const profileRef = doc(db, 'ai_coaching_profiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          setProfile(profileSnap.data() as Profile);
        }
      } catch (err: any) {
        if (err.code === 'permission-denied' || err.message?.includes('permission')) {
          console.log("Profile not found (permission denied)");
        } else {
          console.error("Error fetching profile:", err);
          setError("Failed to load profile. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    const topicsQuery = query(
      collection(db, 'ai_coaching_topics'),
      where('userId', '==', user.uid),
      orderBy('order', 'asc')
    );

    const unsubscribe = onSnapshot(topicsQuery, (snapshot) => {
      const topicsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Topic));
      setTopics(topicsData);
    }, (err) => {
      console.error("Error fetching topics:", err);
    });

    return () => unsubscribe();
  }, [user]);

  const handleStartSetup = async (setupData: any) => {
    if (!user) return;
    setGenerating(true);

    try {
      // 1. Save Profile
      const profileData = {
        userId: user.uid,
        examType: setupData.examType,
        targetDate: new Date(setupData.targetDate).getTime(),
        teachers: setupData.teachers,
        createdAt: Date.now()
      };
      await setDoc(doc(db, 'ai_coaching_profiles', user.uid), profileData);
      setProfile(profileData);

      // 2. Generate Syllabus using Gemini
      const { generateContent } = await getAI();
      const model = "gemini-3-flash-preview";
      const prompt = `Generate a detailed subject-wise syllabus for the ${setupData.examType} exam. 
      The subjects and their teachers are: ${JSON.stringify(setupData.teachers)}.
      For each subject, list 5-8 key topics in a logical learning order.
      For each topic, provide a YouTube search query that includes the teacher's name for that subject to find a relevant video.
      Return the response as a JSON array of objects with 'subject', 'topicName', and 'videoSearchQuery' fields.`;

      const result = await generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                subject: { type: Type.STRING },
                topicName: { type: Type.STRING },
                videoSearchQuery: { type: Type.STRING }
              },
              required: ["subject", "topicName", "videoSearchQuery"]
            }
          }
        }
      });

      const syllabus = JSON.parse(result.text);

      // 3. Save Topics to Firestore
      for (let i = 0; i < syllabus.length; i++) {
        await addDoc(collection(db, 'ai_coaching_topics'), {
          userId: user.uid,
          subject: syllabus[i].subject,
          topicName: syllabus[i].topicName,
          videoSearchQuery: syllabus[i].videoSearchQuery,
          status: 'pending',
          order: i,
          createdAt: Date.now()
        });
      }

      await logFeatureUsage('ai_coaching', 'gemini-3-flash-preview', true);
    } catch (error) {
      console.error("Setup error:", error);
      alert("Failed to generate syllabus. Please try again.");
      await logFeatureUsage('ai_coaching', 'gemini-3-flash-preview', false);
    } finally {
      setGenerating(false);
    }
  };

  const handleAddVideo = async () => {
    if (!selectedTopic || !videoUrlInput) return;
    
    try {
      await updateDoc(doc(db, 'ai_coaching_topics', selectedTopic.id), {
        videoUrl: videoUrlInput
      });
      setVideoUrlInput('');
      setSelectedTopic(prev => prev ? { ...prev, videoUrl: videoUrlInput } : null);
    } catch (error) {
      console.error("Error adding video:", error);
    }
  };

  const generateTestFromVideo = async () => {
    if (!selectedTopic?.videoUrl) return;
    setGenerating(true);

    try {
      const { generateContent } = await getAI();
      const model = "gemini-3-flash-preview";
      const prompt = `I am studying for the ${profile?.examType} exam. 
      The topic is ${selectedTopic.topicName} in ${selectedTopic.subject}.
      Here is a video link for this topic: ${selectedTopic.videoUrl}.
      Please generate a 5-question multiple choice test based on the concepts typically covered in such a video for this exam.
      Return the response as a JSON object with a 'questions' array. Each question should have 'text', 'options' (array of 4), and 'correctIndex' (number).`;

      const result = await generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctIndex: { type: Type.INTEGER }
                  },
                  required: ["text", "options", "correctIndex"]
                }
              }
            },
            required: ["questions"]
          }
        }
      });

      const testData = JSON.parse(result.text);
      setGeneratedTest(testData);
      setTakingTest(true);
      await logFeatureUsage('ai_coaching', 'gemini-3-flash-preview', true);
    } catch (error) {
      console.error("Error generating test:", error);
      setError("Failed to generate test. Please try again.");
      await logFeatureUsage('ai_coaching', 'gemini-3-flash-preview', false);
    } finally {
      setGenerating(false);
    }
  };

  const submitTest = async () => {
    if (!generatedTest || !selectedTopic) return;

    let score = 0;
    generatedTest.questions.forEach((q: any, idx: number) => {
      if (parseInt(testAnswers[idx]) === q.correctIndex) {
        score++;
      }
    });

    const finalScore = (score / generatedTest.questions.length) * 100;

    try {
      await updateDoc(doc(db, 'ai_coaching_topics', selectedTopic.id), {
        status: finalScore >= 60 ? 'completed' : 'pending',
        testResult: {
          score: finalScore,
          total: generatedTest.questions.length,
          correct: score,
          timestamp: Date.now()
        }
      });
      setTestSubmitted(true);
    } catch (error) {
      console.error("Error submitting test:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8">
      <AnimatePresence mode="wait">
        {!profile ? (
          <Onboarding onComplete={handleStartSetup} generating={generating} />
        ) : (
          <Dashboard
            profile={profile}
            topics={topics}
            selectedTopic={selectedTopic}
            showSyllabus={showSyllabus}
            videoUrlInput={videoUrlInput}
            takingTest={takingTest}
            generatedTest={generatedTest}
            testAnswers={testAnswers}
            testSubmitted={testSubmitted}
            generating={generating}
            handleAddVideo={handleAddVideo}
            generateTestFromVideo={generateTestFromVideo}
            submitTest={submitTest}
            setTestAnswers={setTestAnswers}
            setTakingTest={setTakingTest}
            setTestSubmitted={setTestSubmitted}
            setGeneratedTest={setGeneratedTest}
            setSelectedTopic={setSelectedTopic}
            setShowSyllabus={setShowSyllabus}
            setVideoUrlInput={setVideoUrlInput}
          />
        )}
      </AnimatePresence>
      <ErrorDialog 
        isOpen={!!error} 
        error={error || ''} 
        context="AI Coaching"
        onClose={() => setError(null)} 
      />
    </div>
  );
}
