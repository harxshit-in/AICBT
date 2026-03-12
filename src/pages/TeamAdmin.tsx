import React, { useState, useEffect } from 'react';
import { Shield, Check, X, FileText, Bell, Trash2, Edit, Loader2, LogOut, Sparkles, Send, Brain } from 'lucide-react';
import { getAllCurrentAffairs, updateCurrentAffairsStatus, getNotifications, deleteNotification, uploadCurrentAffairs, updateUserRole, updateUserStatus, getAllUsers, auth, getUserProfile, saveUserProfile } from '../utils/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getAI } from '../utils/aiClient';
import { useNavigate } from 'react-router-dom';

export default function TeamAdmin() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'news' | 'notifications' | 'upload' | 'users'>('news');
  const [news, setNews] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedContent, setExtractedContent] = useState<any>(null);
  const [pastedText, setPastedText] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profile = await getUserProfile(currentUser.uid);
        if (profile?.isBlocked) {
          alert('You are blocked from using this website.');
          await signOut(auth);
          setUser(null);
          setRole(null);
        } else {
          setRole(profile?.role || 'user');
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const fetchData = async () => {
    if (role !== 'admin' && role !== 'team_admin') return;
    const newsData = await getAllCurrentAffairs();
    const notifData = await getNotifications();
    const userData = await getAllUsers();
    setNews(newsData);
    setNotifications(notifData);
    setUsers(userData);
  };

  const handleAIAnalysis = async () => {
    if (!pastedText.trim()) return;
    setIsExtracting(true);
    try {
      const { ai } = await getAI();
      const prompt = `
        Analyze the following text and extract current affairs information.
        Format the output as a JSON object with the following structure:
        {
          "title": "Main headline of the news",
          "subtitle": "A short one-sentence summary/context",
          "tags": ["Tag 1", "Tag 2"],
          "highlights": ["Key highlight 1", "Key highlight 2", ...],
          "insights": ["Detailed insight 1", "Detailed insight 2", ...],
          "concepts": ["Concept Name: Brief explanation", "Another Concept: Explanation", ...]
        }

        Text to analyze:
        ${pastedText}
      `;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      
      const content = JSON.parse(response.text || '{}');
      setExtractedContent(content);
      setActiveTab('upload');
    } catch (e) {
      console.error(e);
      alert('Failed to analyze text. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  const saveToFirebase = async () => {
    await uploadCurrentAffairs(extractedContent);
    setExtractedContent(null);
    setPastedText('');
    fetchData();
    setActiveTab('news');
  };

  useEffect(() => {
    if (role === 'admin' || role === 'team_admin') {
      fetchData();
    }
  }, [role]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await saveUserProfile(userCredential.user.uid, {
          email: email,
          role: 'user',
          createdAt: Date.now(),
          isBlocked: false,
          warningLevel: 0
        });
        alert('Account created successfully!');
      }
    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/invalid-credential') {
        alert('Invalid email or password.');
      } else {
        alert('Authentication failed: ' + e.message);
      }
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-10 h-10 animate-spin" /></div>;

  if (!user) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <h1 className="text-2xl font-black mb-4">{isLogin ? 'Login' : 'Create Account'}</h1>
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" placeholder="Email" className="w-full p-2 border rounded-xl" onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" className="w-full p-2 border rounded-xl" onChange={e => setPassword(e.target.value)} />
          <button type="submit" className="w-full bg-slate-900 text-white p-2 rounded-xl">{isLogin ? 'Login' : 'Create Account'}</button>
          <button type="button" className="w-full text-sm underline" onClick={() => setIsLogin(!isLogin)}>{isLogin ? 'Need an account?' : 'Already have an account?'}</button>
          <button type="button" className="w-full text-sm underline text-slate-500" onClick={() => navigate('/')}>Back to Home</button>
        </form>
      </div>
    );
  }

  if (role !== 'admin' && role !== 'team_admin') {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-black">Access Denied</h1>
        <p className="text-slate-500">You do not have permission to access this page.</p>
        <div className="flex flex-col gap-2 mt-4">
          <button onClick={() => navigate('/')} className="text-sm underline font-bold">Go to Home</button>
          <button onClick={() => signOut(auth)} className="text-sm underline text-red-500">Logout</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-slate-900">Team Admin Panel</h1>
        <button onClick={() => signOut(auth)} className="flex items-center gap-2 text-red-500"><LogOut className="w-4 h-4" /> Logout</button>
      </div>
      <div className="flex flex-wrap gap-4 mb-8">
        <button onClick={() => setActiveTab('news')} className={`px-4 py-2 rounded-xl font-bold transition-colors ${activeTab === 'news' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Current Affairs</button>
        <button onClick={() => setActiveTab('notifications')} className={`px-4 py-2 rounded-xl font-bold transition-colors ${activeTab === 'notifications' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Notifications</button>
        {role === 'admin' && (
          <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-xl font-bold transition-colors ${activeTab === 'users' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Users</button>
        )}
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm mb-8">
        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-500" />
          Analyze New Current Affairs
        </h2>
        <textarea 
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-orange-300 transition-all font-medium text-slate-700 h-40 resize-none mb-4"
          placeholder="Paste current affairs text here..."
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
        />
        <button 
          onClick={handleAIAnalysis}
          disabled={isExtracting || !pastedText.trim()}
          className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExtracting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
          AI Analysis
        </button>
      </div>
      
      {activeTab === 'news' && (
        <div className="space-y-4">
          {news.map(item => (
            <div key={item.id} className="p-4 bg-white rounded-2xl border flex justify-between items-center">
              <span>{item.title}</span>
              <button onClick={() => updateCurrentAffairsStatus(item.id, !item.approved)} className={`p-2 rounded-lg ${item.approved ? 'bg-emerald-100' : 'bg-orange-100'}`}>
                {item.approved ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      )}
      
      {activeTab === 'users' && (
        <div className="space-y-4">
          {users.map(user => (
            <div key={user.uid} className="p-4 bg-white rounded-2xl border flex justify-between items-center">
              <div>
                <p className="font-bold">{user.email}</p>
                <p className="text-sm text-slate-500">Role: {user.role || 'user'}</p>
                <p className="text-sm text-slate-500">Warnings: {user.warningLevel || 0} | Blocked: {user.isBlocked ? 'Yes' : 'No'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => updateUserStatus(user.uid, (user.warningLevel || 0) + 1, (user.warningLevel || 0) + 1 >= 3).then(fetchData)} className="p-2 bg-orange-100 rounded-xl">Warn</button>
                <button onClick={() => updateUserStatus(user.uid, user.warningLevel || 0, !user.isBlocked).then(fetchData)} className="p-2 bg-red-100 rounded-xl">{user.isBlocked ? 'Unblock' : 'Block'}</button>
                <select 
                  value={user.role || 'user'} 
                  onChange={(e) => updateUserRole(user.uid, e.target.value as any).then(fetchData)}
                  className="p-2 rounded-xl border"
                >
                  <option value="user">User</option>
                  <option value="team_admin">Team Admin</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {activeTab === 'upload' && extractedContent && (
        <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900">Review Analysis</h2>
            <button onClick={() => setExtractedContent(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Title</label>
              <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-slate-400 font-bold text-lg" value={extractedContent.title} onChange={e => setExtractedContent({...extractedContent, title: e.target.value})} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Subtitle / Context</label>
              <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 font-medium" value={extractedContent.subtitle} onChange={e => setExtractedContent({...extractedContent, subtitle: e.target.value})} />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">CA Type</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 font-medium"
                value={extractedContent.caType || 'Daily CA'}
                onChange={e => setExtractedContent({...extractedContent, caType: e.target.value})}
              >
                <option value="Daily CA">Daily CA</option>
                <option value="Weekly CA">Weekly CA</option>
                <option value="Monthly CA">Monthly CA</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tags (Comma separated)</label>
              <input 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 font-medium" 
                value={extractedContent.tags?.join(', ')} 
                onChange={e => setExtractedContent({...extractedContent, tags: e.target.value.split(',').map(t => t.trim())})} 
              />
            </div>
          </div>
          
          {(['highlights', 'insights', 'concepts'] as const).map(field => (
            <div key={field} className="space-y-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 capitalize">{field}</label>
              {(extractedContent[field] || []).map((item: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <textarea 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 text-sm font-medium resize-none" 
                    rows={2}
                    value={item} 
                    onChange={e => {
                      const newItems = [...extractedContent[field]];
                      newItems[index] = e.target.value;
                      setExtractedContent({...extractedContent, [field]: newItems});
                    }} 
                  />
                  <button onClick={() => {
                    const newItems = extractedContent[field].filter((_: any, i: number) => i !== index);
                    setExtractedContent({...extractedContent, [field]: newItems});
                  }} className="p-2 h-10 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              <button 
                onClick={() => setExtractedContent({...extractedContent, [field]: [...(extractedContent[field] || []), '']})} 
                className="text-sm text-slate-900 font-bold flex items-center gap-1 hover:underline"
              >
                + Add {field.slice(0, -1)}
              </button>
            </div>
          ))}

          <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
            <button onClick={() => setExtractedContent(null)} className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Discard</button>
            <button onClick={saveToFirebase} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2 shadow-lg">
              <Send className="w-4 h-4" />
              Upload to Firebase
            </button>
          </div>
        </div>
      )}
      
      {isExtracting && <div className="fixed inset-0 flex items-center justify-center bg-white/80"><Loader2 className="w-10 h-10 animate-spin" /></div>}
    </div>
  );
}
