import React, { useState, useEffect } from 'react';
import { Shield, Check, X, FileUp, Bell, Trash2, Edit, Loader2, LogOut } from 'lucide-react';
import { getAllCurrentAffairs, updateCurrentAffairsStatus, getNotifications, deleteNotification, uploadCurrentAffairs, updateUserRole, updateUserStatus, getAllUsers, auth, getUserProfile } from '../utils/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import * as pdfjsLib from 'pdfjs-dist';
import { getAI } from '../utils/aiClient';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function TeamAdmin() {
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsExtracting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ');
      }
      
      const { ai } = await getAI();
      const prompt = `Extract current affairs from this text and format as JSON: { "title": "...", "highlights": ["..."], "insights": ["..."], "concepts": ["..."] }. Text: ${text}`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      setExtractedContent(JSON.parse(response.text || '{}'));
      setActiveTab('upload');
    } catch (e) {
      console.error(e);
    } finally {
      setIsExtracting(false);
    }
  };

  const saveToFirebase = async () => {
    await uploadCurrentAffairs(extractedContent);
    setExtractedContent(null);
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
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      console.error(e);
      alert('Authentication failed');
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
        </form>
      </div>
    );
  }

  if (role !== 'admin' && role !== 'team_admin') {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-black">Waiting for approval</h1>
        <p className="text-slate-500">Please wait for the administrator to approve your account.</p>
        <button onClick={() => signOut(auth)} className="mt-4 text-sm underline">Logout</button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-slate-900">Team Admin Panel</h1>
        <button onClick={() => signOut(auth)} className="flex items-center gap-2 text-red-500"><LogOut className="w-4 h-4" /> Logout</button>
      </div>
      <div className="flex gap-4 mb-8">
        <button onClick={() => setActiveTab('news')} className={`px-4 py-2 rounded-xl font-bold ${activeTab === 'news' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}>Current Affairs</button>
        <button onClick={() => setActiveTab('notifications')} className={`px-4 py-2 rounded-xl font-bold ${activeTab === 'notifications' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}>Notifications</button>
        {role === 'admin' && (
          <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-xl font-bold ${activeTab === 'users' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}>Users</button>
        )}
        <label className="px-4 py-2 rounded-xl font-bold bg-emerald-500 text-white cursor-pointer">
          Upload PDF
          <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} />
        </label>
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
        <div className="p-8 bg-white rounded-2xl border shadow-sm">
          <input className="w-full text-2xl font-bold mb-4" value={extractedContent.title} onChange={e => setExtractedContent({...extractedContent, title: e.target.value})} />
          <button onClick={saveToFirebase} className="bg-slate-900 text-white px-6 py-2 rounded-xl">Save to Firebase</button>
        </div>
      )}
      
      {isExtracting && <div className="fixed inset-0 flex items-center justify-center bg-white/80"><Loader2 className="w-10 h-10 animate-spin" /></div>}
    </div>
  );
}
