import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, signInWithPopup, saveUserProfile } from '../utils/firebase';
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-100"
      >
        <div className="text-center mb-8">
          <div className="bg-orange-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Welcome to AI CBT</h1>
          <p className="text-slate-500 mt-2">Sign in to continue your preparation journey</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in with Google'}
          {!loading && <ArrowRight className="w-5 h-5" />}
        </button>
      </motion.div>
    </div>
  );
}
