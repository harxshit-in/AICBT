import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coins, 
  HelpCircle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  X,
  MessageSquare,
  User,
  Zap
} from 'lucide-react';
import { db, auth } from '../utils/firebase';
import { collection, query, where, getDocs, addDoc, orderBy, limit, updateDoc, doc } from 'firebase/firestore';

export default function BountyBoard() {
  const [bounties, setBounties] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newBounty, setNewBounty] = useState({ title: '', description: '', reward: 50 });

  useEffect(() => {
    fetchBounties();
  }, []);

  const fetchBounties = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "bounties"), orderBy("createdAt", "desc"), limit(20));
      const snap = await getDocs(q);
      setBounties(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching bounties:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBounty = async () => {
    if (!auth.currentUser || !newBounty.title.trim()) return;
    try {
      await addDoc(collection(db, "bounties"), {
        ...newBounty,
        userId: auth.currentUser.uid,
        status: 'open',
        createdAt: Date.now()
      });
      setShowAddModal(false);
      setNewBounty({ title: '', description: '', reward: 50 });
      fetchBounties();
    } catch (err) {
      console.error("Error adding bounty:", err);
    }
  };

  const handleSolveBounty = async (bountyId: string) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, "bounties", bountyId), {
        status: 'solved',
        solverId: auth.currentUser.uid
      });
      fetchBounties();
    } catch (err) {
      console.error("Error solving bounty:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <div className="bg-white border-b border-slate-200 px-6 py-12">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
              <Coins className="text-amber-500 fill-amber-500" />
              Doubt Bounty Board
            </h1>
            <p className="text-slate-500 mt-2 font-medium text-lg">Post difficult questions and reward those who solve them.</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Post Doubt
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bounties.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {bounties.map((bounty) => (
              <motion.div
                key={bounty.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-start md:items-center"
              >
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                  <HelpCircle size={32} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-black text-slate-900">{bounty.title}</h3>
                    {bounty.status === 'solved' && (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                        Solved
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 font-medium line-clamp-2 mb-4">{bounty.description}</p>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-slate-400">
                      <User size={14} />
                      <span className="text-xs font-bold uppercase tracking-widest">User ID: {bounty.userId.substring(0, 6)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={14} />
                      <span className="text-xs font-bold uppercase tracking-widest">{new Date(bounty.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-4 shrink-0 w-full md:w-auto">
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-6 py-3 rounded-2xl border border-amber-100">
                    <Coins size={20} fill="currentColor" />
                    <span className="text-xl font-black">{bounty.reward} XP</span>
                  </div>
                  {bounty.status === 'open' && bounty.userId !== auth.currentUser?.uid && (
                    <button 
                      onClick={() => handleSolveBounty(bounty.id)}
                      className="w-full bg-slate-900 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                      Solve Now <Zap size={14} fill="currentColor" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-300">
            <MessageSquare size={48} className="text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 font-bold text-lg">No doubts posted yet.</p>
            <p className="text-slate-400 text-sm">Be the first to post a doubt!</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900">Post a Doubt</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Question Title</label>
                  <input 
                    type="text" 
                    value={newBounty.title}
                    onChange={(e) => setNewBounty({ ...newBounty, title: e.target.value })}
                    placeholder="e.g., Help with Quadratic Equations"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-blue-200 focus:bg-white transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Description</label>
                  <textarea 
                    value={newBounty.description}
                    onChange={(e) => setNewBounty({ ...newBounty, description: e.target.value })}
                    placeholder="Provide details about your doubt..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-blue-200 focus:bg-white transition-all font-bold h-32 resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Reward (XP)</label>
                  <input 
                    type="number" 
                    value={newBounty.reward}
                    onChange={(e) => setNewBounty({ ...newBounty, reward: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-blue-200 focus:bg-white transition-all font-bold"
                  />
                </div>
                <button 
                  onClick={handleAddBounty}
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                >
                  Post Bounty
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
