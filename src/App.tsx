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
import Community from './pages/Community';
import Topic from './pages/Topic';
import Admin from './pages/Admin';
import TeamAdmin from './pages/TeamAdmin';
import StudyTools from './pages/StudyTools';
import MockTests from './pages/MockTests';
import Whiteboard from './pages/Whiteboard';
import BountyBoard from './pages/BountyBoard';
import Intro from './pages/Intro';
import Login from './pages/Login';
import FloatingChat from './components/FloatingChat';
import AICoaching from './pages/AICoaching';
import DailyNews from './pages/DailyNews';
import Leaderboard from './pages/Leaderboard';
import OnboardingDialog from './components/OnboardingDialog';
import FeatureGuard from './components/FeatureGuard';
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
                    
                    {/* New Exam Prep Features */}
                    <Route path="/study-tools" element={<FeatureGuard featureKey="study_tools"><ProtectedRoute><StudyTools /></ProtectedRoute></FeatureGuard>} />
                    <Route path="/mock-tests" element={<FeatureGuard featureKey="mock_tests"><ProtectedRoute><MockTests /></ProtectedRoute></FeatureGuard>} />
                    <Route path="/whiteboard" element={<ProtectedRoute><Whiteboard /></ProtectedRoute>} />
                    <Route path="/bounty-board" element={<ProtectedRoute><BountyBoard /></ProtectedRoute>} />
                    <Route path="/ai-coaching" element={<FeatureGuard featureKey="ai_coaching"><ProtectedRoute><AICoaching /></ProtectedRoute></FeatureGuard>} />
                    
                    {/* Locked Features */}
                    <Route path="/ai-vidyalay" element={<FeatureGuard featureKey="ai_vidyalay"><AIVidyalay /></FeatureGuard>} />
                    <Route path="/ai-summary" element={<FeatureGuard featureKey="ai_summary"><AISummary /></FeatureGuard>} />
                    <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
                    <Route path="/community/:id" element={<ProtectedRoute><Topic /></ProtectedRoute>} />
                    <Route path="/all-pdf-to-cbt" element={<FeatureGuard featureKey="pdf_to_cbt"><AllPdfToCbt /></FeatureGuard>} />
                    <Route path="/upload" element={<FeatureGuard featureKey="pdf_to_cbt"><Upload /></FeatureGuard>} />
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
