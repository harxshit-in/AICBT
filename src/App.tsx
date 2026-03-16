import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import ExamOverview from './pages/ExamOverview';
import Exam from './pages/Exam';
import Results from './pages/Results';
import OMRScan from './pages/OMRScan';
import Settings from './pages/Settings';
import SharedTest from './pages/SharedTest';
import About from './pages/About';
import Explore from './pages/Explore';
import ParikshAI from './pages/ParikshAI';
import AIVidyalay from './pages/AIVidyalay';
import AISummary from './pages/AISummary';
import AllPdfToCbt from './pages/AllPdfToCbt';
import Admin from './pages/Admin';
import TeamAdmin from './pages/TeamAdmin';
import Intro from './pages/Intro';
import Login from './pages/Login';
import FloatingChat from './components/FloatingChat';
import DailyNews from './pages/DailyNews';
import Leaderboard from './pages/Leaderboard';
import OnboardingDialog from './components/OnboardingDialog';
import { PWAProvider } from './context/PWAContext';
import { logAnalyticsEvent, auth, getUserProfile } from './utils/firebase';

export default function App() {
  const [showIntro, setShowIntro] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('has_seen_intro');
    setShowIntro(!hasSeenIntro);

    if (!sessionStorage.getItem('visited')) {
      logAnalyticsEvent('visits');
      sessionStorage.setItem('visited', 'true');
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setAuthReady(true);
      if (user) {
        const profile = await getUserProfile(user.uid);
        if (!profile) {
          setShowOnboarding(true);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleStart = () => {
    localStorage.setItem('has_seen_intro', 'true');
    setShowIntro(false);
  };

  if (showIntro === null || !authReady) return null;

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!user) return <Navigate to="/login" replace />;
    return <>{children}</>;
  };

  return (
    <PWAProvider>
      <Router>
        {showIntro ? (
          <Intro onStart={handleStart} />
        ) : (
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
            <Route path="*" element={
              <>
                {showOnboarding && <OnboardingDialog onClose={() => setShowOnboarding(false)} />}
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/explore" element={<Explore />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/parikshai" element={<ParikshAI />} />
                    <Route path="/daily-news" element={<DailyNews />} />
                    <Route path="/exam-overview/:id" element={<ExamOverview />} />
                    <Route path="/exam/:id" element={<Exam />} />
                    <Route path="/shared/:id" element={<SharedTest />} />
                    <Route path="/results" element={<Results />} />
                    <Route path="/omr" element={<OMRScan />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/team-admin" element={<TeamAdmin />} />
                    
                    {/* Locked Features */}
                    <Route path="/ai-vidyalay" element={<ProtectedRoute><AIVidyalay /></ProtectedRoute>} />
                    <Route path="/ai-summary" element={<ProtectedRoute><AISummary /></ProtectedRoute>} />
                    <Route path="/all-pdf-to-cbt" element={<ProtectedRoute><AllPdfToCbt /></ProtectedRoute>} />
                    <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                    
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                  <FloatingChat />
                </Layout>
              </>
            } />
          </Routes>
        )}
      </Router>
    </PWAProvider>
  );
}
