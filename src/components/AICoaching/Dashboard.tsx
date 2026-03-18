import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Target, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Video, 
  Brain,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  GraduationCap
} from 'lucide-react';
import Markdown from 'react-markdown';

export default function Dashboard({
  profile,
  topics,
  selectedTopic,
  showSyllabus,
  videoUrlInput,
  takingTest,
  generatedTest,
  testAnswers,
  testSubmitted,
  generating,
  handleAddVideo,
  generateTestFromVideo,
  submitTest,
  setTestAnswers,
  setTakingTest,
  setTestSubmitted,
  setGeneratedTest,
  setSelectedTopic,
  setShowSyllabus,
  setVideoUrlInput
}: any) {
  return (
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
              {Math.round((topics.filter((t: any) => t.status === 'completed').length / topics.length) * 100 || 0)}%
            </div>
          </div>
          <div className="bg-zinc-800/50 px-4 py-2 rounded-xl border border-zinc-700">
            <div className="text-xs text-zinc-500 uppercase">Topics</div>
            <div className="text-xl font-bold">{topics.filter((t: any) => t.status === 'completed').length}/{topics.length}</div>
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
              {Object.keys(profile.teachers).map((subject: string) => (
                <div key={subject} className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                      {subject}
                    </h3>
                    <span className="text-[10px] font-bold text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">
                      {topics.filter((t: any) => t.subject === subject).length} Topics
                    </span>
                  </div>
                  <div className="space-y-2">
                    {topics.filter((t: any) => t.subject === subject).map((topic: any) => (
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
                        <Video className="w-8 h-8 text-zinc-700" />
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
  );
}
