import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileUp, Settings, ScanLine, GraduationCap, Info, Globe } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

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

          <div className="md:hidden">
            {/* Mobile menu could go here */}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Bottom Nav for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex items-center justify-around py-3 px-4 z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 transition-all ${
                isActive ? 'text-orange-600' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium uppercase tracking-wider">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
