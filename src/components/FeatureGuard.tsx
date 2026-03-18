import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAppConfig, auth } from '../utils/firebase';
import { Lock, LogIn } from 'lucide-react';

interface FeatureGuardProps {
  featureKey: string;
  children: React.ReactNode;
}

export default function FeatureGuard({ featureKey, children }: FeatureGuardProps) {
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConfig = async () => {
      const appConfig = await getAppConfig();
      setConfig(appConfig);
      setLoadingConfig(false);
    };
    
    fetchConfig();
    
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    
    return () => unsubscribe();
  }, []);

  if (loadingConfig || loadingAuth) {
    return <div className="flex items-center justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  const featureConfig = config?.features?.[featureKey] || { isLocked: false, requiresLogin: false };

  if (featureConfig.isLocked) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto mt-12 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Feature Locked</h2>
        <p className="text-slate-500 mb-6">This feature has been temporarily disabled by the administrator. Please check back later.</p>
        <button onClick={() => navigate('/')} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">
          Return Home
        </button>
      </div>
    );
  }

  if (featureConfig.requiresLogin && !user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto mt-12 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
          <LogIn className="w-8 h-8 text-indigo-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Login Required</h2>
        <p className="text-slate-500 mb-6">You need to be logged in to access this feature. Please sign in to continue.</p>
        <button onClick={() => navigate('/login')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
          Sign In
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
