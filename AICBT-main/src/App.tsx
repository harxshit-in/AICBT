import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import { PWAProvider } from './context/PWAContext';
import { logAnalyticsEvent } from './utils/firebase';

export default function App() {
  useEffect(() => {
    if (!sessionStorage.getItem('visited')) {
      logAnalyticsEvent('visits');
      sessionStorage.setItem('visited', 'true');
    }
  }, []);

  return (
    <PWAProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/parikshai" element={<ParikshAI />} />
            <Route path="/ai-vidyalay" element={<AIVidyalay />} />
            <Route path="/ai-summary" element={<AISummary />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/exam-overview/:id" element={<ExamOverview />} />
            <Route path="/exam/:id" element={<Exam />} />
            <Route path="/shared/:id" element={<SharedTest />} />
            <Route path="/results" element={<Results />} />
            <Route path="/omr" element={<OMRScan />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<About />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Layout>
      </Router>
    </PWAProvider>
  );
}
