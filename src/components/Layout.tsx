import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileUp, Settings, ScanLine, GraduationCap, Info, Globe, Download, X } from 'lucide-react';
import { usePWA } from '../context/PWAContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isInstallable, installApp } = usePWA();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Check if we should show the install prompt
    const hasSeenPrompt = localStorage.getItem('has_seen_install_prompt');
    if (isInstallable && !hasSeenPrompt) {
      // Small delay so it doesn't pop up instantly
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable]);

  const dismissPrompt = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('has_seen_install_prompt', 'true');
  };

  const handleInstall = () => {
    installApp();
    dismissPrompt();
  };

  const navItems = [
    { name: 'Explore', path: '/explore', icon: Globe },
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Upload PDF', path: '/upload', icon: FileUp },
    { name: 'OMR Scan', path: '/omr', icon: ScanLine },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'About', path: '/about', icon: Info },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-orange-500 p-2 rounded-xl group-hover:scale-110 transition-transform">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">
              AI <span className="text-orange-500">CBT</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="md:hidden flex items-center gap-3">
            {isInstallable && (
              <button 
                onClick={installApp}
                className="bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                Install App
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Bottom Nav for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex items-center justify-around py-4 px-4 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all ${
                isActive ? 'bg-orange-50 text-orange-600 scale-110' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-6 h-6" />
            </Link>
          );
        })}
      </div>

      {/* First-time Install Prompt */}
      <AnimatePresence>
        {showInstallPrompt && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
            >
              <button 
                onClick={dismissPrompt}
                className="absolute top-4 right-4 p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-orange-50 w-16 h-16 rounded-2xl flex items-center justify-center text-orange-500 mb-2">
                  <Download className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Install AI CBT</h3>
                <p className="text-sm text-slate-500">
                  Add this app to your home screen for a faster, full-screen experience and offline access!
                </p>
                <div className="w-full space-y-3 pt-4">
                  <button
                    onClick={handleInstall}
                    className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Install Now
                  </button>
                  <button
                    onClick={dismissPrompt}
                    className="w-full py-3.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
