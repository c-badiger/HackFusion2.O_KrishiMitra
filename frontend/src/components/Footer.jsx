import React from 'react';
import { Sprout, PhoneCall, ExternalLink, ShieldCheck, Heart } from 'lucide-react';

export default function Footer({ onNavigate }) {
  return (
    <footer className="border-t border-emerald-950 bg-slate-950 text-slate-400 pt-12 pb-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand & Purpose */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Sprout className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white font-kannada">ಕೃಷಿ ಮಿತ್ರ</span>
            </div>
            <p className="text-xs text-slate-400 font-kannada leading-relaxed">
              ಕರ್ನಾಟಕದ ರೈತರಿಗಾಗಿ ಕನ್ನಡದಲ್ಲೇ ಮಾತನಾಡುವ, ನಿಖರವಾದ ಮತ್ತು ಪಾರದರ್ಶಕ ಸರ್ಕಾರಿ ಯೋಜನೆ ಶಿಫಾರಸು ವೇದಿಕೆ.
            </p>
            <p className="text-[11px] text-slate-500">
              Voice-First Agricultural Scheme Decision Support for Karnataka Farmers.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white font-kannada uppercase tracking-wider">
              ತ್ವರಿತ ಸಂಪರ್ಕಗಳು (Quick Links)
            </h4>
            <ul className="space-y-2 text-xs font-kannada">
              <li>
                <button onClick={() => onNavigate('assistant')} className="hover:text-emerald-400 transition-colors">
                  🎙️ ಧ್ವನಿ ಸಹಾಯಕ (Voice Assistant)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('schemes')} className="hover:text-emerald-400 transition-colors">
                  📑 ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಪಟ್ಟಿ (Scheme Catalog)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('dashboard')} className="hover:text-emerald-400 transition-colors">
                  📊 ಅರ್ಹತಾ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ (Eligibility Dashboard)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('register')} className="hover:text-emerald-400 transition-colors">
                  ✍️ ಹೊಸ ರೈತರ ನೋಂದಣಿ (Farmer Registration)
                </button>
              </li>
            </ul>
          </div>

          {/* Official Karnataka Government Portals */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white font-kannada uppercase tracking-wider">
              ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ಗಳು (Government Portals)
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a 
                  href="https://fruits.karnataka.gov.in" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center space-x-1.5 hover:text-emerald-400 transition-colors font-kannada"
                >
                  <span>FRUITS ಪೋರ್ಟಲ್ (Farmer ID)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a 
                  href="https://samrakshane.karnataka.gov.in" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center space-x-1.5 hover:text-emerald-400 transition-colors font-kannada"
                >
                  <span>ಸಂರಕ್ಷಣೆ ಬೆಳೆ ವಿಮೆ (Samrakshane PMFBY)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a 
                  href="https://raitamitra.karnataka.gov.in" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center space-x-1.5 hover:text-emerald-400 transition-colors font-kannada"
                >
                  <span>ರೈತ ಮಿತ್ರ (ಕೃಷಿ ಇಲಾಖೆ ಕರ್ನಾಟಕ)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a 
                  href="https://sevasindhu.karnataka.gov.in" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center space-x-1.5 hover:text-emerald-400 transition-colors font-kannada"
                >
                  <span>ಸೇವಾ ಸಿಂಧು (Seva Sindhu Services)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

          {/* Emergency & Support Helpline */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white font-kannada uppercase tracking-wider">
              ಸಹಾಯವಾಣಿ (Farmer Helpline)
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-900/40 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400">
                <PhoneCall className="w-4 h-4" />
                <span className="font-bold text-sm">1800-425-3553</span>
              </div>
              <p className="text-[11px] font-kannada text-slate-300">
                ಕಿಸಾನ್ ಕಾಲ್ ಸೆಂಟರ್ ಮತ್ತು ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರ (RSK) ಉಚಿತ ಸಹಾಯವಾಣಿ.
              </p>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>100% Rule Engine Deterministic Validation</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <p className="font-kannada text-center sm:text-left">
            © 2026 ಕೃಷಿ ಮಿತ್ರ (Krishi Mitra) — ಕರ್ನಾಟಕದ ರೈತರ ಸಬಲೀಕರಣಕ್ಕಾಗಿ ತಂತ್ರಜ್ಞಾನ.
          </p>
          <div className="flex items-center space-x-3 text-[11px] text-slate-400">
            <span>React + Vite (5173)</span>
            <span>•</span>
            <span>FastAPI (8000)</span>
            <span>•</span>
            <span>MySQL 8.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
