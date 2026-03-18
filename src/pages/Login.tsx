import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, signInWithPopup, saveUserProfile } from '../utils/firebase';
import { ArrowRight, Loader2, ShieldCheck, Brain, Target, Zap, Users, CheckCircle2, Star, Trophy, BookOpen, Sparkles, Scan } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [userCount, setUserCount] = useState(1800);
  const navigate = useNavigate();

  const headlines = ["Exams.", "Preparation.", "Future.", "Success."];

  useEffect(() => {
    const interval = setInterval(() => {
      setHeadlineIndex((prev) => (prev + 1) % headlines.length);
    }, 3000);

    const countInterval = setInterval(() => {
      setUserCount(prev => prev < 2450 ? prev + Math.floor(Math.random() * 10) : prev);
    }, 100);

    return () => {
      clearInterval(interval);
      clearInterval(countInterval);
    };
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Ensure user profile exists
      await saveUserProfile(user.uid, {
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        createdAt: Date.now()
      });
      
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -30, filter: 'blur(10px)' },
    visible: { opacity: 1, x: 0, filter: 'blur(0px)' }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row items-stretch overflow-hidden">
      {/* Left Side: Info & Branding */}
      <div className="hidden lg:flex flex-1 bg-slate-900 p-16 flex-col justify-between relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              x: [0, 50, 0],
              y: [0, 30, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[120px]" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0],
              x: [0, -40, 0],
              y: [0, -60, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px]" 
          />
          
          {/* Moving Decorative Grid */}
          <motion.div 
            animate={{ backgroundPosition: ['0px 0px', '40px 40px'] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 opacity-[0.03]" 
            style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
          />
          
          {/* Floating Particles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 0.5, 0],
                scale: [0, 1, 0],
                x: [Math.random() * 1000, Math.random() * 1000 + 50],
                y: [Math.random() * 1000, Math.random() * 1000 - 50]
              }}
              transition={{ 
                duration: 5 + Math.random() * 5,
                repeat: Infinity,
                delay: Math.random() * 5
              }}
              className="absolute w-1 h-1 bg-white rounded-full"
            />
          ))}
        </div>

        {/* Floating Badges */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="absolute top-10 right-10 z-0 pointer-events-none"
        >
          <motion.div 
            animate={{ y: [0, -10, 0], rotate: [0, 2, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl flex items-center gap-3 group hover:bg-white/10 transition-colors"
          >
            <div className="w-8 h-8 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/30">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Global Rank</p>
              <p className="text-white font-bold text-base">#124</p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="absolute bottom-10 right-10 z-0 pointer-events-none"
        >
          <motion.div 
            animate={{ y: [0, 10, 0], rotate: [0, -2, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl flex items-center gap-3 group hover:bg-white/10 transition-colors"
          >
            <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
              <Star className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Accuracy</p>
              <p className="text-white font-bold text-base">98.4%</p>
            </div>
          </motion.div>
        </motion.div>

        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-16"
          >
            <motion.div 
              animate={{ 
                boxShadow: ["0 0 0px rgba(59, 130, 246, 0)", "0 0 20px rgba(59, 130, 246, 0.5)", "0 0 0px rgba(59, 130, 246, 0)"] 
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20"
            >
              <Brain className="w-7 h-7 text-white" />
            </motion.div>
            <span className="text-2xl font-black text-white tracking-tight">AI CBT</span>
          </motion.div>

          <div className="mb-10 min-h-[140px]">
            <motion.h1 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl md:text-7xl font-black text-white leading-[1]"
            >
              Master Your <br />
              <AnimatePresence mode="wait">
                <motion.span 
                  key={headlineIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-blue-500 inline-block"
                >
                  {headlines[headlineIndex]}
                </motion.span>
              </AnimatePresence>
            </motion.h1>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 max-w-lg"
          >
            {[
              { icon: Target, color: 'blue', title: 'Personalized AI Analysis', desc: 'Our AI identifies your weak spots and crafts a unique path to mastery.' },
              { icon: Zap, color: 'indigo', title: 'Smart Study Tools', desc: 'Automated OMR scanning and summary generation to save you hundreds of hours.' },
              { icon: Users, color: 'emerald', title: 'Collaborative Community', desc: 'Join focused discussion topics and get real-time AI doubt solving.' }
            ].map((feature, i) => (
              <motion.div 
                key={i} 
                variants={itemVariants} 
                whileHover={{ x: 10 }}
                className="flex gap-5 group cursor-default"
              >
                <div className={`relative w-12 h-12 rounded-2xl bg-${feature.color}-500/10 flex items-center justify-center shrink-0 border border-${feature.color}-500/20 shadow-inner group-hover:bg-${feature.color}-500/20 transition-colors overflow-hidden`}>
                  <feature.icon className={`w-6 h-6 text-${feature.color}-400 relative z-10`} />
                  {feature.icon === Target && (
                    <motion.div 
                      animate={{ y: [-20, 60] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="absolute top-0 left-0 w-full h-0.5 bg-blue-400/50 blur-[1px]"
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-white font-bold text-xl mb-1.5 group-hover:text-blue-400 transition-colors">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed font-medium">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="relative z-10 flex items-center gap-6"
        >
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map(i => (
              <motion.img 
                key={i} 
                whileHover={{ y: -5, zIndex: 10 }}
                src={`https://picsum.photos/seed/${i + 10}/100/100`} 
                className="w-10 h-10 rounded-full border-2 border-slate-900 object-cover cursor-pointer" 
                alt="User" 
              />
            ))}
            <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white">
              +2k
            </div>
          </div>
          <div className="flex flex-col">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Joined by {userCount.toLocaleString()}+ Students</p>
            <div className="flex items-center gap-1 mt-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 relative">
        {/* Subtle Background for Login Side */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.02] grayscale" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }} />
          
          {/* Floating Sparkles */}
          <motion.div
            animate={{ 
              y: [0, -20, 0],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-20 right-20 text-blue-500/20"
          >
            <Sparkles className="w-12 h-12" />
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full relative z-10"
        >
          <div className="text-center lg:text-left mb-12">
            <motion.div 
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              whileHover={{ rotate: 5 }}
              className="lg:hidden bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-600/20"
            >
              <Brain className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">Welcome Back</h2>
            <p className="text-slate-500 font-bold text-lg">Ready to crush your next exam?</p>
          </div>

          <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/60 p-10 border border-slate-100 mb-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-700" />
            
            <div className="relative z-10 space-y-8 mb-10">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Preparation Benefits</h3>
                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-emerald-100"
                >
                  Premium Access
                </motion.div>
              </div>
              
              <div className="space-y-5">
                {[
                  { text: "Real-time AI Performance Tracking", icon: Target },
                  { text: "Unlimited Mock Tests & Analysis", icon: BookOpen },
                  { text: "Priority AI Doubt Solving", icon: Zap },
                  { text: "Global Leaderboard Access", icon: Trophy }
                ].map((item, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + (i * 0.1) }}
                    whileHover={{ x: 5 }}
                    className="flex items-center gap-4 text-slate-700 text-sm font-bold cursor-default"
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:border-blue-100 transition-colors">
                      <item.icon className="w-4 h-4 text-blue-600" />
                    </div>
                    {item.text}
                  </motion.div>
                ))}
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm mb-8 border border-red-100 flex items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse" />
                {error}
              </motion.div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-lg hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-4 disabled:opacity-70 disabled:cursor-not-allowed shadow-2xl shadow-slate-900/20 group relative overflow-hidden"
            >
              <motion.div 
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
              />
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <motion.div 
                    whileHover={{ rotate: 15 }}
                    className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                  </motion.div>
                  Sign in with Google
                </>
              )}
              {!loading && <ArrowRight className="w-6 h-6 ml-1 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />}
            </button>
          </div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest"
          >
            Trusted by <span className="text-slate-900">2,000+</span> students worldwide
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
