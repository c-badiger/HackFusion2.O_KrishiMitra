import React, { useState } from 'react';
import { 
  Sprout, 
  Mic, 
  FileText, 
  LayoutDashboard, 
  UserPlus, 
  UserCheck, 
  Server, 
  RefreshCw, 
  Menu, 
  X,
  Home
} from 'lucide-react';

export default function Navbar({ 
  currentPage, 
  onNavigate, 
  backendStatus, 
  onRefreshHealth,
  activeFarmer 
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', labelKn: 'ಮುಖಪುಟ', labelEn: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'assistant', labelKn: 'ಧ್ವನಿ ಸಹಾಯಕ', labelEn: 'Voice AI', icon: <Mic className="w-4 h-4" />, highlight: true },
    { id: 'schemes', labelKn: 'ಯೋಜನೆಗಳು', labelEn: 'Schemes', icon: <FileText className="w-4 h-4" /> },
    { id: 'dashboard', labelKn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', labelEn: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'profile', labelKn: 'ರೈತರ ವಿವರ', labelEn: 'Profile', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'register', labelKn: 'ಹೊಸ ನೋಂದಣಿ', labelEn: 'Register', icon: <UserPlus className="w-4 h-4" /> }
  ];

  const handleNavClick = (id) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-900/30 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Branding */}
          <div 
            onClick={() => handleNavClick('home')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-emerald-400 to-lime-300 flex items-center justify-center shadow-lg shadow-emerald-500/25 border border-emerald-200/50 group-hover:scale-105 transition-transform duration-300">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-kannada">
                  ಕೃಷಿ ಮಿತ್ರ
                </span>
                <span className="hidden sm:inline-flex text-[10px] tracking-wider uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Karnataka
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-emerald-200/80 font-medium">
                Voice-First AI Agricultural Scheme Assistant
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1.5">
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md shadow-emerald-600/30 border border-emerald-400/40'
                      : item.highlight
                      ? 'bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-200 border border-emerald-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/85 border border-transparent'
                  }`}
                >
                  {item.icon}
                  <span className="font-kannada">{item.labelKn}</span>
                  <span className="text-[10px] opacity-70">({item.labelEn})</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action: Backend Port Health Badge & Mobile Toggle */}
          <div className="flex items-center space-x-3">
            <div 
              className={`hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                backendStatus.connected
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>{backendStatus.connected ? 'FastAPI (8000) Active' : 'Port 8000 Offline'}</span>
              <button
                onClick={onRefreshHealth}
                title="Refresh API Health"
                className="hover:rotate-180 transition-transform duration-500 text-slate-400 hover:text-white ml-1"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-800/80 space-y-2 animate-in fade-in slide-in-from-top-4 duration-200">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full px-4 py-3 rounded-xl text-left text-sm font-semibold flex items-center justify-between transition-all ${
                  currentPage === item.id
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {item.icon}
                  <span className="font-kannada text-base">{item.labelKn}</span>
                  <span className="text-xs text-slate-400">({item.labelEn})</span>
                </div>
              </button>
            ))}

            {/* Mobile Health Status */}
            <div className="pt-2">
              <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                backendStatus.connected ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-300' : 'bg-rose-950/40 border-rose-600/40 text-rose-300'
              }`}>
                <span>{backendStatus.message}</span>
                <button onClick={onRefreshHealth} className="p-1 text-slate-400">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
