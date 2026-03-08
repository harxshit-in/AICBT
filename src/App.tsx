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
import { PWAProvider } from './context/PWAContext';

export default function App() {
  return (
    <PWAProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/exam-overview/:id" element={<ExamOverview />} />
            <Route path="/exam/:id" element={<Exam />} />
            <Route path="/shared/:id" element={<SharedTest />} />
            <Route path="/results" element={<Results />} />
            <Route path="/omr" element={<OMRScan />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </Layout>
      </Router>
    </PWAProvider>
  );
}
