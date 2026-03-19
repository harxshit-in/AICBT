import React, { useState, useEffect } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../utils/firebase';
import { getAI } from '../../utils/aiClient';
import { motion } from 'motion/react';
import { CheckCircle, Circle, ChevronDown, ChevronUp, Zap, Flame, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
      setUser(doc.data());
    });
    return () => unsubscribe();
  }, []);

  if (!user) return <div>Loading dashboard...</div>;

  const syllabus = user.userSyllabus || [];
  const totalTopics = syllabus.reduce((acc: number, s: any) => acc + (s.topics?.length || 0), 0);
  const completedTopics = syllabus.reduce((acc: number, s: any) => 
    acc + (s.topics?.filter((t: any) => t.completed).length || 0), 0);
  const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  const toggleSubject = (subject: string) => {
    setExpandedSubjects(prev => ({ ...prev, [subject]: !prev[subject] }));
  };

  const toggleTopic = async (subject: string, topicIndex: number) => {
    if (!auth.currentUser) return;
    const newSyllabus = [...syllabus];
    const subjectIndex = newSyllabus.findIndex((s: any) => s.subject === subject);
    newSyllabus[subjectIndex].topics[topicIndex].completed = !newSyllabus[subjectIndex].topics[topicIndex].completed;
    
    const today = new Date().toISOString().split('T')[0];
    const lastStudyDate = user.lastStudyDate;
    let newStreak = user.currentStreak || 0;

    if (lastStudyDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastStudyDate === yesterday.toISOString().split('T')[0]) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    }

    await updateDoc(doc(db, 'users', auth.currentUser.uid), { 
      userSyllabus: newSyllabus,
      lastStudyDate: today,
      currentStreak: newStreak
    });
  };

  const regeneratePlan = async () => {
    setLoading(true);
    try {
      const ai = await getAI();
      const prompt = `Regenerate the study roadmap for ${user.exam}. 
      Current progress: ${JSON.stringify(syllabus)}.
      Identify weak subjects based on completion rate and generate an optimized roadmap.
      Return ONLY JSON in the same format as before.`;

      const response = await ai.generateContent({
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const newSyllabus = JSON.parse(response.text);
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { userSyllabus: newSyllabus });
    } catch (e) {
      console.error(e);
      alert("Failed to regenerate plan.");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const todaysTasks = syllabus.flatMap((s: any) => 
    s.topics.filter((t: any) => !t.completed && t.week <= 2)
  ).slice(0, 3);

  return (
    <div className="bg-zinc-900 text-zinc-100 p-6 rounded-2xl shadow-xl border border-white/10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold">{user.exam} Preparation</h2>
          <div className="flex items-center gap-2 text-zinc-400">
            <Flame className="text-orange-500" /> {user.currentStreak || 0} day streak
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={regeneratePlan} disabled={loading} className="flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-lg">
            <RefreshCw size={16} /> {loading ? 'Regenerating...' : 'Regenerate Plan'}
          </button>
          <div className="relative w-24 h-24">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path className="text-zinc-700" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-emerald-500" strokeWidth="3" strokeDasharray={`${progress}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xl font-bold">{progress}%</div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><Zap className="text-yellow-500"/> Today's Tasks</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {todaysTasks.map((t: any) => (
            <div key={t.topic} className="bg-white/5 p-4 rounded-lg border border-white/5">{t.topic}</div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {syllabus.map((s: any) => {
          const subjectCompleted = s.topics?.filter((t: any) => t.completed).length || 0;
          const subjectTotal = s.topics?.length || 0;
          const subjectProgress = subjectTotal > 0 ? Math.round((subjectCompleted / subjectTotal) * 100) : 0;

          return (
            <motion.div key={s.subject} className="bg-white/5 rounded-xl p-4 border border-white/5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSubject(s.subject)}>
                <h3 className="text-xl font-semibold">{s.subject}</h3>
                <div className="flex items-center gap-4">
                  <div className="w-32 h-2 bg-zinc-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${subjectProgress}%` }} />
                  </div>
                  {expandedSubjects[s.subject] ? <ChevronUp /> : <ChevronDown />}
                </div>
              </div>
              
              {expandedSubjects[s.subject] && (
                <div className="mt-4 space-y-2">
                  {s.topics.map((t: any, i: number) => (
                    <div key={t.topic} className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleTopic(s.subject, i)}>
                          {t.completed ? <CheckCircle className="text-emerald-500" /> : <Circle className="text-zinc-500" />}
                        </button>
                        <span>{t.topic} (Week {t.week})</span>
                      </div>
                      <div className="flex gap-2">
                        {t.videos.map((v: string, vi: number) => (
                          <a key={vi} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(v)}`} target="_blank" className="text-xs bg-blue-600 px-2 py-1 rounded">Video {vi + 1}</a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
