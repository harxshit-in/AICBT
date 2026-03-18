import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Target, 
  Users, 
  Calendar, 
  ChevronRight, 
  Play, 
  CheckCircle2, 
  Clock, 
  BarChart3, 
  Plus, 
  Video, 
  FileText,
  Brain,
  Sparkles,
  ArrowRight,
  Search,
  Youtube,
  GraduationCap,
  Loader2,
  ArrowLeft,
  ExternalLink,
  User
} from 'lucide-react';
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
import Markdown from 'react-markdown';
import { getAI } from '../utils/aiClient';

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

const EXAM_SUBJECTS: { [key: string]: string[] } = {
  'SSC CGL': ['Mathematics', 'Reasoning', 'English', 'General Awareness'],
  'Railway RRB': ['Mathematics', 'Reasoning', 'General Science', 'General Awareness'],
  'Banking IBPS': ['Quantitative Aptitude', 'Reasoning', 'English', 'General Awareness'],
  'UPSC CSE': ['History', 'Geography', 'Polity', 'Economy', 'Science & Tech', 'Environment'],
  'State PSC': ['History', 'Geography', 'Polity', 'Economy', 'State GK'],
  'Other': ['Mathematics', 'Reasoning', 'English', 'General Awareness']
};

export default function AICoaching() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [step, setStep] = useState(1);
  const [setupData, setSetupData] = useState({
    examType: '',
    targetDate: '',
    teachers: {} as Record<string, string>
  });
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
          setStep(4); // Go to dashboard
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

  const handleStartSetup = async () => {
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

      setStep(4);
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
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="max-w-4xl mx-auto py-12 px-4"
          >
            <div className="text-center space-y-4 mb-12">
              <motion.div 
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                className="inline-flex p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 mb-4 shadow-[0_0_50px_rgba(16,185,129,0.1)]"
              >
                <Brain className="w-12 h-12 text-emerald-500" />
              </motion.div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
                AI Coaching 2.0
              </h1>
              <p className="text-zinc-400 text-xl max-w-xl mx-auto">
                Your personalized path to success. Select your target exam to begin.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'SSC CGL', desc: 'Staff Selection Commission' },
                { name: 'Railway RRB', desc: 'Railway Recruitment Board' },
                { name: 'Banking IBPS', desc: 'Institute of Banking Personnel' },
                { name: 'UPSC CSE', desc: 'Civil Services Examination' },
                { name: 'State PSC', desc: 'Public Service Commission' },
                { name: 'Other', desc: 'Custom Exam Path' }
              ].map((exam) => (
                <button
                  key={exam.name}
                  onClick={() => {
                    setSetupData({ ...setupData, examType: exam.name });
                    setStep(2);
                  }}
                  className="p-8 rounded-[2.5rem] bg-zinc-900/40 border border-zinc-800/50 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left group relative overflow-hidden backdrop-blur-sm"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-500/10 transition-colors" />
                  <div className="relative z-10 space-y-2">
                    <div className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors">{exam.name}</div>
                    <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{exam.desc}</div>
                  </div>
                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                    <ArrowRight className="w-6 h-6 text-emerald-500" />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="max-w-3xl mx-auto py-12 px-4"
          >
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-[3rem] p-8 md:p-12 backdrop-blur-xl shadow-2xl space-y-12">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <User className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h2 className="text-4xl font-black tracking-tight">Your Mentors</h2>
                </div>
                <p className="text-zinc-400 text-lg">Who are your favorite teachers? We'll use their teaching style and videos to guide your syllabus.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(EXAM_SUBJECTS[setupData.examType] || EXAM_SUBJECTS['Other']).map((subject) => (
                  <div key={subject} className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">{subject}</label>
                    <div className="relative group">
                      <input
                        type="text"
                        placeholder="Teacher Name..."
                        className="w-full p-5 rounded-2xl bg-zinc-950/50 border border-zinc-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-white placeholder:text-zinc-700 font-medium"
                        onChange={(e) => setSetupData({
                          ...setupData,
                          teachers: { ...setupData.teachers, [subject]: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(3)}
                className="w-full p-6 rounded-[2rem] bg-emerald-500 text-black font-black text-lg hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(16,185,129,0.2)] active:scale-[0.98]"
              >
                Continue to Schedule <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="max-w-xl mx-auto py-12 px-4"
          >
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-[3rem] p-8 md:p-12 backdrop-blur-xl shadow-2xl space-y-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mx-auto mb-6">
                  <Calendar className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-4xl font-black tracking-tight">Set Your Goal</h2>
                <p className="text-zinc-400">When is your target exam date? We'll pace your syllabus accordingly.</p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Target Exam Date</label>
                <input
                  type="date"
                  className="w-full p-6 rounded-2xl bg-zinc-950/50 border border-zinc-800 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-white font-medium [color-scheme:dark] text-center"
                  onChange={(e) => setSetupData({ ...setupData, targetDate: e.target.value })}
                />
              </div>

              <button
                onClick={handleStartSetup}
                disabled={generating || !setupData.targetDate}
                className="w-full p-6 rounded-[2rem] bg-emerald-500 text-black font-black text-lg hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(16,185,129,0.2)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Generating Syllabus...
                  </>
                ) : (
                  <>
                    Generate My Syllabus <Sparkles className="w-6 h-6 fill-current" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && profile && (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-6xl mx-auto space-y-8"
          >
            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <GraduationCap className="text-emerald-500" />
                  {profile.examType} Coaching
                </h1>
                <p className="text-zinc-400 flex items-center gap-2">
                  <Target className="w-4 h-4" /> Target: {new Date(profile.targetDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-4">
                <div className="bg-zinc-800/50 px-4 py-2 rounded-xl border border-zinc-700">
                  <div className="text-xs text-zinc-500 uppercase">Progress</div>
                  <div className="text-xl font-bold text-emerald-500">
                    {Math.round((topics.filter(t => t.status === 'completed').length / topics.length) * 100 || 0)}%
                  </div>
                </div>
                <div className="bg-zinc-800/50 px-4 py-2 rounded-xl border border-zinc-700">
                  <div className="text-xs text-zinc-500 uppercase">Topics</div>
                  <div className="text-xl font-bold">{topics.filter(t => t.status === 'completed').length}/{topics.length}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Syllabus List (Sidebar-like) */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2rem] p-6 backdrop-blur-xl">
                  <h2 className="text-xl font-black flex items-center gap-2 mb-6">
                    <BookOpen className="w-6 h-6 text-emerald-500" />
                    Syllabus Guide
                  </h2>
                  
                  <div className="space-y-8 max-h-[calc(100vh-350px)] overflow-y-auto pr-2 custom-scrollbar">
                    {Object.keys(profile.teachers).map((subject) => (
                      <div key={subject} className="space-y-3">
                        <div className="flex items-center justify-between px-2">
                          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                            {subject}
                          </h3>
                          <span className="text-[10px] font-bold text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">
                            {topics.filter(t => t.subject === subject).length} Topics
                          </span>
                        </div>
                        <div className="space-y-2">
                          {topics.filter(t => t.subject === subject).map((topic) => (
                            <button
                              key={topic.id}
                              onClick={() => {
                                setSelectedTopic(topic);
                                setTakingTest(false);
                                setTestSubmitted(false);
                                setGeneratedTest(null);
                              }}
                              className={`w-full group flex items-center justify-between p-4 rounded-2xl transition-all border ${
                                selectedTopic?.id === topic.id
                                  ? 'bg-emerald-500/10 border-emerald-500/50 text-white shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                                  : 'bg-zinc-800/30 border-zinc-800/50 text-zinc-400 hover:bg-zinc-800/50 hover:border-zinc-700'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                  topic.status === 'completed' 
                                    ? 'bg-emerald-500 text-black' 
                                    : selectedTopic?.id === topic.id ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-800 text-zinc-500'
                                }`}>
                                  {topic.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                </div>
                                <div className="text-left">
                                  <div className="text-sm font-bold truncate max-w-[150px]">{topic.topicName}</div>
                                  {topic.testResult && (
                                    <div className="text-[10px] text-emerald-500 font-black">
                                      SCORE: {topic.testResult.score}%
                                    </div>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className={`w-4 h-4 transition-transform ${selectedTopic?.id === topic.id ? 'rotate-90 text-emerald-500' : 'text-zinc-600 group-hover:translate-x-1'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Topic Detail / Action Area (Main Content) */}
              <div className={`lg:col-span-8 space-y-6 ${showSyllabus ? 'hidden lg:block' : 'block'}`}>
                <AnimatePresence mode="wait">
                  {selectedTopic ? (
                    <motion.div
                      key={selectedTopic.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -30 }}
                      className="bg-zinc-900/40 border border-zinc-800/50 rounded-[3rem] p-8 md:p-12 backdrop-blur-xl shadow-2xl sticky top-8 space-y-10 overflow-hidden"
                    >
                      {/* Mobile Back Button */}
                      <button 
                        onClick={() => setShowSyllabus(true)}
                        className="lg:hidden flex items-center gap-2 text-zinc-500 hover:text-white mb-6 transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back to Syllabus
                      </button>

                      <div className="relative">
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px]"></div>
                        <div className="space-y-3 relative z-10">
                          <div className="flex items-center gap-3">
                            <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em]">
                              {selectedTopic.subject}
                            </span>
                            {selectedTopic.status === 'completed' && (
                              <span className="px-4 py-1.5 rounded-full bg-emerald-500 text-black text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3" /> Completed
                              </span>
                            )}
                          </div>
                          <h3 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">{selectedTopic.topicName}</h3>
                        </div>
                      </div>

                      {/* Video Section */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-zinc-800/50 pb-4">
                          <h4 className="text-lg font-black flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center">
                              <Video className="w-4 h-4 text-zinc-400" />
                            </div>
                            Study Material
                          </h4>
                          {selectedTopic.videoUrl && (
                            <a 
                              href={selectedTopic.videoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-4 py-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2"
                            >
                              Open in YouTube <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        {!selectedTopic.videoUrl ? (
                          <div className="bg-zinc-950/50 border border-zinc-800 rounded-3xl p-8 text-center space-y-6">
                            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mx-auto border border-zinc-800">
                              <Youtube className="w-8 h-8 text-zinc-700" />
                            </div>
                            <div className="space-y-2">
                              <p className="text-zinc-400">
                                {selectedTopic.videoSearchQuery ? (
                                  <>
                                    AI suggested search: <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedTopic.videoSearchQuery)}`} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">{selectedTopic.videoSearchQuery}</a>
                                  </>
                                ) : (
                                  "Paste the YouTube video link for this topic from your teacher."
                                )}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="https://youtube.com/watch?v=..."
                                className="flex-1 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 focus:border-emerald-500 outline-none transition-all text-sm"
                                value={videoUrlInput}
                                onChange={(e) => setVideoUrlInput(e.target.value)}
                              />
                              <button
                                onClick={() => handleAddVideo()}
                                className="px-6 rounded-2xl bg-white text-black font-black text-sm hover:bg-zinc-200 transition-all active:scale-95"
                              >
                                Attach
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-video rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl group relative">
                            <iframe
                              src={selectedTopic.videoUrl.replace('watch?v=', 'embed/')}
                              className="w-full h-full"
                              allowFullScreen
                            ></iframe>
                            <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-3xl"></div>
                          </div>
                        )}
                      </div>

                      {/* AI Test Section */}
                      <div className="space-y-4 pt-4 border-t border-zinc-800">
                        <h4 className="font-bold flex items-center gap-2">
                          <Brain className="w-4 h-4 text-emerald-500" /> AI Practice Test
                        </h4>

                        {!takingTest ? (
                          <button
                            onClick={generateTestFromVideo}
                            disabled={!selectedTopic.videoUrl || generating}
                            className="w-full py-3 rounded-xl bg-zinc-800 border border-zinc-700 hover:border-emerald-500/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {generating ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-emerald-500"></div>
                            ) : (
                              <Sparkles className="w-4 h-4 text-emerald-500" />
                            )}
                            Generate Test from Video
                          </button>
                        ) : (
                          <div className="space-y-6">
                            {testSubmitted ? (
                              <div className="text-center space-y-4 py-4">
                                <div className="text-4xl font-bold text-emerald-500">
                                  {Math.round((Object.keys(testAnswers).filter(idx => parseInt(testAnswers[parseInt(idx)]) === generatedTest.questions[parseInt(idx)].correctIndex).length / generatedTest.questions.length) * 100)}%
                                </div>
                                <p className="text-zinc-400">Great job! This topic is now marked as {selectedTopic.status === 'completed' ? 'completed' : 'reviewed'}.</p>
                                <button 
                                  onClick={() => setTakingTest(false)}
                                  className="text-emerald-500 font-bold hover:underline"
                                >
                                  Back to Topic
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                {generatedTest.questions.map((q: any, qIdx: number) => (
                                  <div key={qIdx} className="space-y-3">
                                    <div className="text-sm font-medium flex gap-2">
                                      <span>{qIdx + 1}.</span>
                                      <div className="prose prose-sm prose-invert max-w-none">
                                        <Markdown>{q.text}</Markdown>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                      {q.options.map((opt: string, oIdx: number) => (
                                        <button
                                          key={oIdx}
                                          onClick={() => setTestAnswers({ ...testAnswers, [qIdx]: oIdx.toString() })}
                                          className={`p-3 rounded-xl text-xs text-left transition-all ${
                                            testAnswers[qIdx] === oIdx.toString()
                                              ? 'bg-emerald-500 text-black font-bold'
                                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                                          }`}
                                        >
                                          <Markdown>{opt}</Markdown>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                                <button
                                  onClick={submitTest}
                                  className="w-full py-3 rounded-xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-all"
                                >
                                  Submit Test
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl p-12 text-center space-y-4">
                      <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                        <BookOpen className="w-8 h-8 text-zinc-600" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-zinc-400">Select a Topic</h3>
                        <p className="text-sm text-zinc-500">Choose a topic from your syllabus to start learning and take AI tests.</p>
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
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
