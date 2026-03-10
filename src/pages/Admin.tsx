import React, { useState, useEffect } from 'react';
import { auth, getAllSharedBanks, updateSharedBank, deleteSharedBank, sendNotification, getAnalyticsData } from '../utils/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { QuestionBank, Question } from '../utils/storage';
import { Shield, Check, X, Edit, Trash2, Send, LogOut, Plus, Minus, Save, BarChart3, Users, Share2, FileUp, Brain } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');
  const [notificationAttachment, setNotificationAttachment] = useState('');
  
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'tests' | 'analytics'>('tests');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        fetchBanks();
        fetchAnalytics();
      }
    });
    return () => unsubscribe();
  }, []);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message);
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
      await sendNotification(notificationTitle, notificationBody, notificationAttachment);
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

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Admin Login</h1>
        </div>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm font-medium">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400"
              required
            />
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors">
            Login
          </button>
        </form>
      </div>
    );
  }

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
                  Manage Tests
                </button>
                <button 
                  onClick={() => setActiveTab('analytics')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'analytics' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Analytics
                </button>
              </div>
            </div>

            {activeTab === 'tests' ? (
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
            ) : (
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
                    Monthly Stats
                  </h3>
                  <div className="space-y-3">
                    {monthlyStats.map((stat, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="font-bold text-slate-900">{stat.month}</span>
                        <div className="flex gap-4 text-sm font-medium text-slate-600">
                          <span>Visits: {stat.visits || 0}</span>
                          <span>Shares: {stat.shares || 0}</span>
                          <span>Uploads: {stat.pdf_uploads || 0}</span>
                          <span>AI: {stat.ai_analyses || 0}</span>
                        </div>
                      </div>
                    ))}
                    {monthlyStats.length === 0 && <p className="text-slate-500 text-center py-4 font-medium">No monthly data available yet.</p>}
                  </div>
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
