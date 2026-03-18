import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Star, ArrowLeft, Target, Zap, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { getGlobalLeaderboard } from '../utils/firebase';

export default function Leaderboard() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGlobalLeaderboard().then((data) => {
      setLeaderboard(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/')}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-500" />
            Global Leaderboard
          </h1>
          <p className="text-slate-500 mt-1">Top 10 performers of the week based on XP and Accuracy</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider">
            <Medal className="w-4 h-4" /> Rank
          </div>
          <div className="flex items-center gap-8 text-sm font-bold text-slate-400 uppercase tracking-wider">
            <span className="hidden md:inline-flex items-center gap-1"><Target className="w-4 h-4" /> Accuracy</span>
            <span className="flex items-center gap-1"><Zap className="w-4 h-4" /> Total XP</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-500 font-bold">Loading rankings...</p>
          </div>
        ) : leaderboard.length > 0 ? (
          <div className="space-y-4">
            {leaderboard.map((user, idx) => (
              <motion.div 
                key={user.uid}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4 md:gap-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shadow-sm ${
                    idx === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white' :
                    idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' :
                    idx === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-white' : 
                    'bg-white text-slate-400 border border-slate-200'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors flex items-center gap-2">
                      {user.name}
                      {user.totalXP > 1000 && (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-1">
                          <Star size={10} fill="currentColor" /> Mentor
                        </span>
                      )}
                    </div>
                    <div className="md:hidden flex items-center gap-1 text-xs font-bold text-slate-400 mt-1">
                      <Target className="w-3 h-3" /> {user.accuracy}% Acc
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="hidden md:flex items-center gap-2 text-slate-600 font-bold">
                    {user.accuracy}%
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-slate-900">{user.totalXP}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">XP</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No top performers yet</h3>
            <p className="text-slate-500">Solve more questions with high accuracy to appear here!</p>
          </div>
        )}
      </div>
    </div>
  );
}
