import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileUp, Settings, ScanLine, GraduationCap, Info, Globe, Download, X, Brain, ArrowRight, Key, Bell, Menu, Headphones } from 'lucide-react';
import { usePWA } from '../context/PWAContext';
import { motion, AnimatePresence } from 'motion/react';
import { listenToNotifications } from '../utils/firebase';
import { getAllBanks, QuestionBank } from '../utils/storage';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isInstallable, installApp } = usePWA();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showParikshAIPrompt, setShowParikshAIPrompt] = useState(false);
  const [isParikshAIMode, setIsParikshAIMode] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [recentBanks, setRecentBanks] = useState<QuestionBank[]>([]);

  useEffect(() => {
    if (isSidebarOpen) {
      getAllBanks().then(banks => {
        setRecentBanks(banks.sort((a, b) => b.createdAt - a.createdAt));
      });
    }
  }, [isSidebarOpen]);

  useEffect(() => {
    // Request notification permission if not granted
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const unsubscribe = listenToNotifications((newNotifications) => {
      setNotifications(newNotifications);
      
      // Check for new notifications to show browser push
      const lastSeenId = localStorage.getItem('last_seen_notification_id');
      if (newNotifications.length > 0) {
        const latest = newNotifications[0];
        if (latest.id !== lastSeenId) {
          setUnreadCount(prev => prev + 1);
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(latest.title, {
              body: latest.body,
              icon: '/icon-192x192.png',
              image: latest.attachmentUrl || undefined
            } as any);
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleOpenNotifications = () => {
    setShowNotifications(true);
    setUnreadCount(0);
    if (notifications.length > 0) {
      localStorage.setItem('last_seen_notification_id', notifications[0].id);
    }
  };

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

  useEffect(() => {
    // Show ParikshAI prompt on load if not already in ParikshAI mode
    const hasSeenParikshAIPrompt = sessionStorage.getItem('has_seen_parikshai_prompt');
    if (!hasSeenParikshAIPrompt && location.pathname !== '/parikshai') {
      setShowParikshAIPrompt(true);
    }
  }, [location.pathname]);

  const handleTryParikshAI = () => {
    const apiKey = localStorage.getItem('user_gemini_api_key');
    if (!apiKey) {
      setApiKeyError(true);
      return;
    }
    
    setApiKeyError(false);
    setShowParikshAIPrompt(false);
    setIsParikshAIMode(true);
    sessionStorage.setItem('has_seen_parikshai_prompt', 'true');
    navigate('/parikshai');
  };

  const dismissParikshAIPrompt = () => {
    setShowParikshAIPrompt(false);
    sessionStorage.setItem('has_seen_parikshai_prompt', 'true');
  };

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
    { name: 'ParikshAI', path: '/parikshai', icon: Brain },
    { name: 'AI Vidyalay', path: '/ai-vidyalay', icon: GraduationCap },
    { name: 'AI Summary', path: '/ai-summary', icon: Headphones },
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Upload PDF', path: '/upload', icon: FileUp },
    { name: 'OMR Scan', path: '/omr', icon: ScanLine },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'About', path: '/about', icon: Info },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <AnimatePresence>
        {showParikshAIPrompt && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <button 
                onClick={dismissParikshAIPrompt}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              
              <div className="relative z-10 space-y-6">
                <div className="bg-orange-500 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Try Pariksh<span className="text-orange-500">AI</span> Mode</h2>
                  <p className="text-slate-500 font-medium">Experience the full power of AI-driven exam analysis. Upload past papers, get trend reports, and generate study strategies instantly.</p>
                </div>

                {apiKeyError && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold flex items-start gap-3 border border-red-100">
                    <Key className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p>API Key required for ParikshAI.</p>
                      <button 
                        onClick={() => {
                          setShowParikshAIPrompt(false);
                          navigate('/settings');
                        }}
                        className="underline mt-1 hover:text-red-700"
                      >
                        Go to Settings to set it up
                      </button>
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleTryParikshAI}
                  className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20"
                >
                  Enter ParikshAI Mode
                  <ArrowRight className="w-5 h-5" />
                </button>
                
                <button 
                  onClick={dismissParikshAIPrompt}
                  className="w-full text-slate-500 font-bold py-3 hover:text-slate-800 transition-colors"
                >
                  Continue to standard app
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isParikshAIMode && (
        <>
          {/* Top Navigation Bar */}
          <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 print:hidden">
            <div className="flex items-center justify-between max-w-5xl mx-auto">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <Link to="/" className="flex items-center gap-2 group">
                  <div className="bg-orange-500 p-1.5 rounded-lg group-hover:scale-105 transition-transform">
                    <GraduationCap className="text-white w-5 h-5" />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-slate-800">
                    AI <span className="text-orange-500">CBT</span>
                  </span>
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handleOpenNotifications}
                  className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <Bell className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </button>
              </div>
            </div>
          </nav>

          {/* Sidebar Overlay */}
          <AnimatePresence>
            {isSidebarOpen && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSidebarOpen(false)}
                  className="fixed inset-0 z-[120] bg-slate-900/20 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed inset-y-0 left-0 z-[130] w-72 bg-white shadow-2xl border-r border-slate-100 flex flex-col"
                >
                  <div className="p-4 flex items-center justify-between border-b border-slate-100">
                    <Link to="/" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-2">
                      <div className="bg-slate-800 p-2 rounded-xl">
                        <GraduationCap className="text-white w-5 h-5" />
                      </div>
                      <span className="text-lg font-bold text-slate-800">AI CBT</span>
                    </Link>
                    <button 
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsSidebarOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                            isActive
                              ? 'bg-slate-100 text-slate-900'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          {item.name}
                        </Link>
                      );
                    })}

                    {recentBanks.length > 0 && (
                      <div className="pt-6 pb-2">
                        <div className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Recent Tests
                        </div>
                        <div className="space-y-1">
                          {recentBanks.slice(0, 5).map(bank => (
                            <Link
                              key={bank.bankId}
                              to={`/exam-overview/${bank.bankId}`}
                              onClick={() => setIsSidebarOpen(false)}
                              className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl truncate transition-colors"
                            >
                              {bank.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {isInstallable && (
                    <div className="p-4 border-t border-slate-100">
                      <button 
                        onClick={() => {
                          installApp();
                          setIsSidebarOpen(false);
                        }}
                        className="w-full bg-slate-100 text-slate-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Install App
                      </button>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}

      <main className={`max-w-5xl mx-auto px-4 ${isParikshAIMode ? 'py-4' : 'py-2'}`}>
        {isParikshAIMode && (
          <div className="mb-6 flex justify-between items-center print:hidden">
            <button 
              onClick={() => setIsParikshAIMode(false)}
              className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
              Exit ParikshAI Mode
            </button>
            <button 
              onClick={handleOpenNotifications}
              className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
          </div>
        )}
        {children}
      </main>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="fixed inset-0 z-[100] bg-slate-900/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-[110] w-full max-w-sm bg-white shadow-2xl border-l border-slate-100 flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-500" />
                  Notifications
                </h2>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-medium">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <h3 className="font-bold text-slate-900 mb-1">{notif.title}</h3>
                      <p className="text-sm text-slate-600 mb-3 leading-relaxed">{notif.body}</p>
                      {notif.attachmentUrl && (
                        <a 
                          href={notif.attachmentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block mt-2"
                        >
                          <img 
                            src={notif.attachmentUrl} 
                            alt="Attachment" 
                            className="w-full h-32 object-cover rounded-xl border border-slate-100"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </a>
                      )}
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Nav for Mobile - Removed in favor of sidebar */}

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
