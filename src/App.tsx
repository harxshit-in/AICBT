import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import Admin from './pages/Admin';
import TeamAdmin from './pages/TeamAdmin';
import Intro from './pages/Intro';
import FloatingChat from './components/FloatingChat';
import DailyNews from './pages/DailyNews';
import OnboardingDialog from './components/OnboardingDialog';
import { PWAProvider } from './context/PWAContext';
import { logAnalyticsEvent } from './utils/firebase';

export default function App() {
  const [showIntro, setShowIntro] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('has_seen_intro');
    setShowIntro(!hasSeenIntro);

    if (!sessionStorage.getItem('visited')) {
      logAnalyticsEvent('visits');
      sessionStorage.setItem('visited', 'true');
    }
  }, []);

  const handleStart = () => {
    localStorage.setItem('has_seen_intro', 'true');
    setShowIntro(false);
    setShowOnboarding(true);
  };

  if (showIntro === null) return null;

  return (
    <PWAProvider>
      <Router>
        {showIntro ? (
          <Intro onStart={handleStart} />
        ) : (
          <>
            {showOnboarding && <OnboardingDialog onClose={() => setShowOnboarding(false)} />}
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/parikshai" element={<ParikshAI />} />
                <Route path="/ai-vidyalay" element={<AIVidyalay />} />
                <Route path="/ai-summary" element={<AISummary />} />
                <Route path="/daily-news" element={<DailyNews />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/exam-overview/:id" element={<ExamOverview />} />
                <Route path="/exam/:id" element={<Exam />} />
                <Route path="/shared/:id" element={<SharedTest />} />
                <Route path="/results" element={<Results />} />
                <Route path="/omr" element={<OMRScan />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/about" element={<About />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/team-admin" element={<TeamAdmin />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <FloatingChat />
            </Layout>
          </>
        )}
      </Router>
    </PWAProvider>
  );
}
