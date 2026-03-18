import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, getAllSharedBanks, updateSharedBank, deleteSharedBank, broadcastNotification, getAnalyticsData, getReportedBugs, getReportedErrors, getAllCurrentAffairs, updateCurrentAffairsStatus, getAnalyticsUsage, getUserProfile, createTopic, closeTopic, getTopics, getTopicMembers, approveUser, getAllMockTests, deleteMockTest, bulkCreateMockTests, getAppConfig, updateAppConfig } from '../utils/firebase';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { QuestionBank, Question } from '../utils/storage';
import { Shield, Check, X, Edit, Trash2, Send, LogOut, Plus, Minus, Save, BarChart3, Users, Share2, FileUp, Brain, Bug, AlertTriangle, Newspaper, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Admin() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');
  const [notificationAttachment, setNotificationAttachment] = useState('');
  
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<any[]>([]);
  const [reportedBugs, setReportedBugs] = useState<any[]>([]);
  const [reportedErrors, setReportedErrors] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'tests' | 'mock-tests' | 'analytics' | 'bugs' | 'news' | 'community' | 'features'>('features');
  const [news, setNews] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicImage, setNewTopicImage] = useState('');
  const [mockTests, setMockTests] = useState<any[]>([]);
  const [bulkJson, setBulkJson] = useState('');
  const [isUploadingBulk, setIsUploadingBulk] = useState(false);

  const [usageStats, setUsageStats] = useState<any[]>([]);
  const [appConfig, setAppConfig] = useState<any>({ features: {}, dashboardUpdate: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate('/');
        return;
      }
      
      setUser(currentUser);
      const profile = await getUserProfile(currentUser.uid);
      setRole(profile?.role || 'user');
      
      if (profile?.role !== 'admin') {
        navigate('/');
        return;
      }

      fetchBanks();
      fetchAnalytics();
      fetchBugsAndErrors();
      fetchNews();
      fetchUsage();
      fetchTopics();
      fetchMockTests();
      fetchAppConfig();
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchAppConfig = async () => {
    try {
      const config = await getAppConfig();
      setAppConfig(config);
    } catch (err) {
      console.error("Failed to fetch app config", err);
    }
  };

  useEffect(() => {
    if (selectedTopic) {
      getTopicMembers(selectedTopic).then(setMembers);
    }
  }, [selectedTopic]);

  const fetchTopics = async () => {
    const data = await getTopics();
    setTopics(data);
  };

  const fetchMockTests = async () => {
    const data = await getAllMockTests();
    setMockTests(data);
  };

  const handleBulkUpload = async () => {
    if (!bulkJson.trim()) return;
    setIsUploadingBulk(true);
    try {
      const tests = JSON.parse(bulkJson);
      if (!Array.isArray(tests)) throw new Error("JSON must be an array of tests");
      await bulkCreateMockTests(tests);
      setBulkJson('');
      fetchMockTests();
      alert("Bulk tests uploaded successfully!");
    } catch (err: any) {
      console.error("Bulk upload error:", err);
      alert("Failed to upload bulk tests: " + err.message);
    } finally {
      setIsUploadingBulk(false);
    }
  };

  const handleDeleteMockTest = async (id: string) => {
    if (!window.confirm("Delete this mock test?")) return;
    await deleteMockTest(id);
    fetchMockTests();
  };

  const handleCreateTopic = async () => {
    await createTopic(newTopicName, newTopicImage);
    setNewTopicName('');
    setNewTopicImage('');
    fetchTopics();
  };

  const handleCloseTopic = async (topicId: string) => {
    await closeTopic(topicId);
    fetchTopics();
  };

  const handleApproveUser = async (topicId: string, userId: string) => {
    await approveUser(topicId, userId);
    getTopicMembers(topicId).then(setMembers);
  };

  const fetchUsage = async () => {
    try {
      const data = await getAnalyticsUsage();
      setUsageStats(data);
    } catch (err) {
      console.error("Failed to fetch usage analytics", err);
    }
  };

  const fetchNews = async () => {
    try {
      const data = await getAllCurrentAffairs();
      setNews(data);
    } catch (err) {
      console.error("Failed to fetch news", err);
    }
  };

  const handleApproveNews = async (id: string, currentStatus: boolean) => {
    try {
      await updateCurrentAffairsStatus(id, !currentStatus);
      fetchNews();
    } catch (err) {
      console.error("Failed to update news status", err);
    }
  };

  const fetchBugsAndErrors = async () => {
    try {
      const bugs = await getReportedBugs();
      const errors = await getReportedErrors();
      setReportedBugs(bugs);
      setReportedErrors(errors);
    } catch (err) {
      console.error("Failed to fetch bugs and errors", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const daily = await getAnalyticsData('daily');
      const monthly = await getAnalyticsData('monthly');
      setDailyStats(daily);
      setMonthlyStats(monthly);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    }
  };

  const fetchBanks = async () => {
    try {
      const data = await getAllSharedBanks();
      setBanks(data);
    } catch (err) {
      console.error("Failed to fetch banks", err);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const handleApprove = async (id: string, currentStatus: boolean | undefined) => {
    try {
      await updateSharedBank(id, { approved: !currentStatus });
      fetchBanks();
    } catch (err) {
      console.error("Failed to update approval status", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this test?")) return;
    try {
      await deleteSharedBank(id);
      fetchBanks();
    } catch (err) {
      console.error("Failed to delete test", err);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notificationTitle || !notificationBody) return;
    try {
      await broadcastNotification(notificationTitle, notificationBody, notificationAttachment);
      alert("Notification sent successfully!");
      setNotificationTitle('');
      setNotificationBody('');
      setNotificationAttachment('');
    } catch (err) {
      console.error("Failed to send notification", err);
      alert("Failed to send notification.");
    }
  };

  const saveBankEdits = async () => {
    if (!editingBank) return;
    try {
      await updateSharedBank(editingBank.bankId, editingBank);
      setEditingBank(null);
      fetchBanks();
      alert("Test updated successfully!");
    } catch (err) {
      console.error("Failed to update test", err);
      alert("Failed to update test.");
    }
  };

  const addQuestion = () => {
    if (!editingBank) return;
    const newQuestion: Question = {
      question: "New Question",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correct: 0,
      section: "General"
    };
    setEditingBank({
      ...editingBank,
      questions: [...editingBank.questions, newQuestion]
    });
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    if (!editingBank) return;
    const updatedQuestions = [...editingBank.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setEditingBank({ ...editingBank, questions: updatedQuestions });
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    if (!editingBank) return;
    const updatedQuestions = [...editingBank.questions];
    const updatedOptions = [...updatedQuestions[qIndex].options];
    updatedOptions[optIndex] = value;
    updatedQuestions[qIndex] = { ...updatedQuestions[qIndex], options: updatedOptions };
    setEditingBank({ ...editingBank, questions: updatedQuestions });
  };

  const removeQuestion = (index: number) => {
    if (!editingBank) return;
    const updatedQuestions = editingBank.questions.filter((_, i) => i !== index);
    setEditingBank({ ...editingBank, questions: updatedQuestions });
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-500 font-medium">{user.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-bold transition-colors">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900">Dashboard</h2>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setActiveTab('tests')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'tests' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  User Tests
                </button>
                <button 
                  onClick={() => setActiveTab('mock-tests')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'mock-tests' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Mock Tests
                </button>
                <button 
                  onClick={() => setActiveTab('analytics')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'analytics' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Analytics
                </button>
                <button 
                  onClick={() => setActiveTab('bugs')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'bugs' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Bugs & Errors
                </button>
                <button 
                  onClick={() => setActiveTab('news')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'news' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Current Affairs
                </button>
                <button 
                  onClick={() => setActiveTab('community')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'community' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Community
                </button>
                <button 
                  onClick={() => setActiveTab('features')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'features' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Features & Settings
                </button>
              </div>
            </div>

            {activeTab === 'features' && (
              <div className="space-y-8">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-500" />
                    Global App Settings
                  </h3>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Dashboard Update Message</label>
                    <textarea 
                      value={appConfig.dashboardUpdate || ''}
                      onChange={e => setAppConfig({ ...appConfig, dashboardUpdate: e.target.value })}
                      placeholder="Enter a message to display on the user dashboard..."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-slate-400 text-sm font-medium h-24 resize-none"
                    />
                  </div>
                  <button 
                    onClick={async () => {
                      await updateAppConfig(appConfig);
                      alert("App settings updated!");
                    }}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold"
                  >
                    Save Settings
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Brain className="w-5 h-5 text-emerald-500" />
                    AI Feature Toggles
                  </h3>
                  <p className="text-sm text-slate-500">Lock features or restrict them to logged-in users only.</p>
                  
                  {['ai_summary', 'ai_vidyalay', 'ai_coaching', 'pdf_to_cbt', 'mock_tests', 'study_tools'].map(featureKey => {
                    const featureConfig = appConfig.features?.[featureKey] || { isLocked: false, requiresLogin: false };
                    
                    return (
                      <div key={featureKey} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900 capitalize">{featureKey.replace(/_/g, ' ')}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={featureConfig.requiresLogin}
                              onChange={async (e) => {
                                const newConfig = {
                                  ...appConfig,
                                  features: {
                                    ...appConfig.features,
                                    [featureKey]: { ...featureConfig, requiresLogin: e.target.checked }
                                  }
                                };
                                setAppConfig(newConfig);
                                await updateAppConfig(newConfig);
                              }}
                              className="w-4 h-4 text-indigo-600 rounded"
                            />
                            Requires Login
                          </label>
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={featureConfig.isLocked}
                              onChange={async (e) => {
                                const newConfig = {
                                  ...appConfig,
                                  features: {
                                    ...appConfig.features,
                                    [featureKey]: { ...featureConfig, isLocked: e.target.checked }
                                  }
                                };
                                setAppConfig(newConfig);
                                await updateAppConfig(newConfig);
                              }}
                              className="w-4 h-4 text-red-600 rounded"
                            />
                            Locked (Disabled)
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'community' && (
              <div className="space-y-8">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-500" />
                    Suggested Future Features
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white rounded-xl border border-slate-200">
                      <p className="font-bold text-sm">AI Interview Prep</p>
                      <p className="text-xs text-slate-500">Voice-based mock interviews for banking/SSC exams using Gemini Real-time API.</p>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-slate-200">
                      <p className="font-bold text-sm">Smart Flashcards</p>
                      <p className="text-xs text-slate-500">Auto-generated flashcards from user-uploaded PDFs or notes using AI analysis.</p>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-slate-200">
                      <p className="font-bold text-sm">Peer-to-Peer Mentorship</p>
                      <p className="text-xs text-slate-500">A system to connect experienced users (mentors) with beginners for guided study.</p>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-slate-200">
                      <p className="font-bold text-sm">Exam Probability Heatmap</p>
                      <p className="text-xs text-slate-500">Visual map of topics based on historical frequency in previous year papers.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                  <h3 className="text-lg font-bold">Create New Topic</h3>
                  <input type="text" placeholder="Topic Name" value={newTopicName} onChange={e => setNewTopicName(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none" />
                  <input type="text" placeholder="Image URL" value={newTopicImage} onChange={e => setNewTopicImage(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none" />
                  <button onClick={handleCreateTopic} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">Create Topic</button>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Manage Topics</h3>
                  {topics.map(topic => (
                    <div key={topic.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                      <span>{topic.name} ({topic.status})</span>
                      {topic.status === 'open' && <button onClick={() => handleCloseTopic(topic.id)} className="bg-red-500 text-white px-4 py-2 rounded-xl font-bold">Close</button>}
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Approve Users</h3>
                  <select onChange={(e) => setSelectedTopic(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                    <option value="">Select a Topic</option>
                    {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>

                  {selectedTopic && (
                    <div className="space-y-2">
                      {members.filter(m => m.status === 'pending_approval').map(member => (
                        <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div>
                            <p className="font-bold">{member.name}</p>
                            <p className="text-sm text-slate-500">{member.email}</p>
                          </div>
                          <button onClick={() => handleApproveUser(selectedTopic, member.userId)} className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold">Approve</button>
                        </div>
                      ))}
                      {members.filter(m => m.status === 'pending_approval').length === 0 && <p className="text-slate-500">No pending approvals.</p>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'mock-tests' && (
              <div className="space-y-8">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <FileUp className="w-5 h-5 text-blue-500" />
                    Bulk JSON Upload
                  </h3>
                  <p className="text-xs text-slate-500">Paste an array of test objects. Each object should have: title, subject, questions (array of objects with question, options, correctAnswer), time (in minutes, optional), and negativeMarking (optional, e.g., 0.25 for 1/4th mark penalty).</p>
                  <textarea 
                    value={bulkJson}
                    onChange={e => setBulkJson(e.target.value)}
                    placeholder='[{"title": "SSC Math", "subject": "Mathematics", "time": 60, "negativeMarking": 0.25, "questions": [...]}]'
                    className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none font-mono text-xs h-40"
                  />
                  <button 
                    onClick={handleBulkUpload}
                    disabled={isUploadingBulk || !bulkJson.trim()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold disabled:opacity-50"
                  >
                    {isUploadingBulk ? 'Uploading...' : 'Upload Bulk Tests'}
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Manage Mock Tests</h3>
                  {mockTests.map(test => (
                    <div key={test.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                      <div>
                        <p className="font-bold">{test.title}</p>
                        <p className="text-xs text-slate-500">{test.subject} • {test.questions?.length || 0} Questions</p>
                      </div>
                      <button onClick={() => handleDeleteMockTest(test.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {mockTests.length === 0 && <p className="text-slate-500 text-center py-4">No mock tests found.</p>}
                </div>
              </div>
            )}

            {activeTab === 'tests' && (
              <div className="space-y-4">
                {banks.map(bank => (
                  <div key={bank.bankId} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <h3 className="font-bold text-slate-900">{bank.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">By {bank.author || 'Unknown'} • {bank.questions.length} Questions</p>
                      <div className="mt-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${bank.approved ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                          {bank.approved ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleApprove(bank.bankId, bank.approved)}
                        className={`p-2 rounded-xl transition-colors ${bank.approved ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}
                        title={bank.approved ? "Revoke Approval" : "Approve"}
                      >
                        {bank.approved ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => setEditingBank(bank)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                        title="Edit Test"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(bank.bankId)}
                        className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                        title="Delete Test"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {banks.length === 0 && <p className="text-slate-500 text-center py-4 font-medium">No shared tests found.</p>}
              </div>
            )}
            
            {activeTab === 'analytics' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    Daily Stats (Last 30 Days)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-500 mb-2">
                        <Users className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Visits</span>
                      </div>
                      <p className="text-2xl font-black text-slate-900">
                        {dailyStats.reduce((sum, day) => sum + (day.visits || 0), 0)}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-500 mb-2">
                        <Share2 className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Shares</span>
                      </div>
                      <p className="text-2xl font-black text-slate-900">
                        {dailyStats.reduce((sum, day) => sum + (day.shares || 0), 0)}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-500 mb-2">
                        <FileUp className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Uploads</span>
                      </div>
                      <p className="text-2xl font-black text-slate-900">
                        {dailyStats.reduce((sum, day) => sum + (day.pdf_uploads || 0), 0)}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-500 mb-2">
                        <Brain className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">AI Analyses</span>
                      </div>
                      <p className="text-2xl font-black text-slate-900">
                        {dailyStats.reduce((sum, day) => sum + (day.ai_analyses || 0), 0)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-500" />
                    Top AI Features Usage
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(
                      usageStats.reduce((acc: any, stat: any) => {
                        if (!acc[stat.feature]) {
                          acc[stat.feature] = { success: 0, failure: 0, count: 0 };
                        }
                        acc[stat.feature].success += stat.success || 0;
                        acc[stat.feature].failure += stat.failure || 0;
                        acc[stat.feature].count += stat.count || 0;
                        return acc;
                      }, {})
                    )
                      .sort(([, a]: any, [, b]: any) => b.count - a.count)
                      .map(([feature, stats]: any, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="font-bold text-slate-900 capitalize">{feature.replace(/_/g, ' ')}</span>
                        <div className="flex gap-4 text-sm font-medium text-slate-600">
                          <span className="text-emerald-600">Success: {stats.success}</span>
                          <span className="text-red-500">Failure: {stats.failure}</span>
                          <span className="text-indigo-600 font-bold">Total: {stats.count}</span>
                        </div>
                      </div>
                    ))}
                    {usageStats.length === 0 && <p className="text-slate-500 text-center py-4 font-medium">No usage data available yet.</p>}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'news' && (
              <div className="space-y-4">
                {news.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <h3 className="font-bold text-slate-900">{item.title || 'Untitled News'}</h3>
                      <p className="text-xs text-slate-500 font-medium">{new Date(item.createdAt).toLocaleDateString()}</p>
                      <div className="mt-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${item.approved ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                          {item.approved ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleApproveNews(item.id, item.approved)}
                      className={`p-2 rounded-xl transition-colors ${item.approved ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}
                    >
                      {item.approved ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
                {news.length === 0 && <p className="text-slate-500 text-center py-4 font-medium">No news items found.</p>}
              </div>
            )}
            
            {activeTab === 'bugs' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Bug className="w-5 h-5 text-red-500" /> Reported Bugs
                  </h3>
                  {reportedBugs.length === 0 ? (
                    <p className="text-slate-500 text-sm">No bugs reported yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {reportedBugs.map(bug => (
                        <div key={bug.id} className="p-4 bg-red-50 rounded-2xl border border-red-100">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                              {new Date(bug.createdAt).toLocaleString()}
                            </span>
                            <span className="text-xs font-bold px-2 py-1 bg-red-100 text-red-700 rounded-md uppercase">
                              {bug.status}
                            </span>
                          </div>
                          <p className="font-medium text-slate-900 mb-2">{bug.description}</p>
                          {bug.steps && (
                            <div className="text-sm text-slate-600 bg-white/50 p-2 rounded-lg mb-2">
                              <strong>Steps:</strong> {bug.steps}
                            </div>
                          )}
                          <div className="text-xs text-slate-500 truncate">
                            URL: {bug.url}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" /> System Errors
                  </h3>
                  {reportedErrors.length === 0 ? (
                    <p className="text-slate-500 text-sm">No errors reported yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {reportedErrors.map(err => (
                        <div key={err.id} className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                              {new Date(err.createdAt).toLocaleString()}
                            </span>
                            <span className="text-xs font-bold px-2 py-1 bg-orange-100 text-orange-700 rounded-md uppercase">
                              {err.context}
                            </span>
                          </div>
                          <p className="font-mono text-sm text-red-600 mb-2 break-words bg-white/50 p-2 rounded-lg">
                            {err.message}
                          </p>
                          <div className="text-xs text-slate-500 truncate">
                            URL: {err.url}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-500" />
              Send Notification
            </h2>
            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Title</label>
                <input 
                  type="text" 
                  value={notificationTitle} 
                  onChange={e => setNotificationTitle(e.target.value)} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 text-sm font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Message</label>
                <textarea 
                  value={notificationBody} 
                  onChange={e => setNotificationBody(e.target.value)} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 text-sm font-medium h-24 resize-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Attachment URL (Optional)</label>
                <input 
                  type="url" 
                  value={notificationAttachment} 
                  onChange={e => setNotificationAttachment(e.target.value)} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 text-sm font-medium"
                  placeholder="https://example.com/image.png"
                />
              </div>
              <button type="submit" className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> Broadcast
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Bank Modal */}
      {editingBank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-4xl w-full shadow-2xl my-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-slate-900">Edit Test: {editingBank.name}</h2>
              <button onClick={() => setEditingBank(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Test Name</label>
                <input 
                  type="text" 
                  value={editingBank.name} 
                  onChange={e => setEditingBank({...editingBank, name: e.target.value})} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Category</label>
                <input 
                  type="text" 
                  value={editingBank.category || ''} 
                  onChange={e => setEditingBank({...editingBank, category: e.target.value})} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Time Limit (mins)</label>
                <input 
                  type="number" 
                  value={editingBank.timeLimit || 0} 
                  onChange={e => setEditingBank({...editingBank, timeLimit: parseInt(e.target.value)})} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Negative Marking</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={editingBank.negativeMarking || 0} 
                  onChange={e => setEditingBank({...editingBank, negativeMarking: parseFloat(e.target.value)})} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-800">Questions ({editingBank.questions.length})</h3>
              <button onClick={addQuestion} className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800">
                <Plus className="w-4 h-4" /> Add Question
              </button>
            </div>

            <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {editingBank.questions.map((q, qIndex) => (
                <div key={qIndex} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative">
                  <button onClick={() => removeQuestion(qIndex)} className="absolute top-4 right-4 p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="mb-4 pr-10">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Question {qIndex + 1}</label>
                    <textarea 
                      value={q.question} 
                      onChange={e => updateQuestion(qIndex, 'question', e.target.value)} 
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-slate-400 text-sm font-medium min-h-[80px] resize-y"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          name={`correct-${qIndex}`} 
                          checked={q.correct === optIndex}
                          onChange={() => updateQuestion(qIndex, 'correct', optIndex)}
                          className="w-4 h-4 text-emerald-500"
                        />
                        <input 
                          type="text" 
                          value={opt} 
                          onChange={e => updateOption(qIndex, optIndex, e.target.value)} 
                          className={`w-full p-2 bg-white border rounded-lg outline-none text-sm font-medium ${q.correct === optIndex ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 focus:border-slate-400'}`}
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Section</label>
                    <input 
                      type="text" 
                      value={q.section || ''} 
                      onChange={e => updateQuestion(qIndex, 'section', e.target.value)} 
                      className="w-full md:w-1/2 p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-slate-400 text-sm font-medium"
                      placeholder="e.g. Mathematics"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setEditingBank(null)} className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200">
                Cancel
              </button>
              <button onClick={saveBankEdits} className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
