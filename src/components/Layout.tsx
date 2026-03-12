import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileUp, Settings, ScanLine, GraduationCap, Info, Globe, Download, X, Brain, ArrowRight, Key, Bell, Menu, Headphones, Bug } from 'lucide-react';
import { usePWA } from '../context/PWAContext';
import { motion, AnimatePresence } from 'motion/react';
import { listenToNotifications, auth, getUserProfile } from '../utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getAllBanks, QuestionBank } from '../utils/storage';
import BugReportDialog from './BugReportDialog';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isInstallable, installApp } = usePWA();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [recentBanks, setRecentBanks] = useState<QuestionBank[]>([]);
  const [showBugReport, setShowBugReport] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await getUserProfile(user.uid);
        setUserRole(profile?.role || 'user');
      } else {
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

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

                    {/* Admin items removed from sidebar per user request */}

                    <button
                      onClick={() => {
                        setShowBugReport(true);
                        setIsSidebarOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all mt-2"
                    >
                      <Bug className="w-5 h-5" />
                      Report Bug
                    </button>

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

      <main className="max-w-5xl mx-auto px-4 py-2">
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
      <BugReportDialog isOpen={showBugReport} onClose={() => setShowBugReport(false)} />
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
