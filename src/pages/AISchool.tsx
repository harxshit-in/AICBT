import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../utils/firebase';
import Dashboard from '../components/AISchool/Dashboard';
import Onboarding from '../components/AISchool/Onboarding';

export default function AISchool() {
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setOnboardingCompleted(userDoc.data().onboardingCompleted);
        }
      }
    };
    checkOnboarding();
  }, []);

  if (onboardingCompleted === null) return <div>Loading...</div>;

  if (!onboardingCompleted) {
    return <Onboarding onComplete={() => setOnboardingCompleted(true)} />;
  }

  return (
    <div className="p-6 bg-zinc-950 min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-6">AI School</h1>
      <Dashboard />
    </div>
  );
}
