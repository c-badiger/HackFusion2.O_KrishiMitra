import React from 'react';
import { 
  Mic, 
  Sparkles, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Coins, 
  Droplets, 
  Sprout, 
  LandPlot,
  Users
} from 'lucide-react';
import StatutoryDisclaimer from '../components/StatutoryDisclaimer';

export default function HomePage({ onNavigate, onStartVoiceScenario }) {
  const samplePrompts = [
    {
      title: 'ರಾಗಿ ಬೆಳೆಯುವ ಸಣ್ಣ ರೈತರು',
      text: 'ನನ್ನ ಬಳಿ ಮಂಡ್ಯ ಜಿಲ್ಲೆಯಲ್ಲಿ 2.5 ಎಕರೆ ಜಮೀನು ಇದೆ, ನಾನು ರಾಗಿ ಬೆಳೆಯುತ್ತಿದ್ದೇನೆ.',
      tag: 'ರೈತ ಸಿರಿ & ಕೃಷಿ ಭಾಗ್ಯ'
    },
    {
      title: 'ಒಣಭೂಮಿ ಹತ್ತಿ ಮತ್ತು ಜೋಳ',
      text: 'ಧಾರವಾಡದಲ್ಲಿ ನನಗೆ 4 ಎಕರೆ ಮಳೆಯಾಶ್ರಿತ ಜಮೀನಿದೆ, ಹತ್ತಿ ಮತ್ತು ಜೋಳ ಬೆಳೆಯುತ್ತೇನೆ.',
      tag: 'ಪಿಎಂ-ಕಿಸಾನ್ & PMFBY'
    },
    {
      title: 'ಬೋರ್‌ವೆಲ್ ಸೌಲಭ್ಯ ಕೋರಿಕೆ',
      text: 'ನಾನು ಹಿಂದುಳಿದ ವರ್ಗದ ಸಣ್ಣ ರೈತ, 2 ಎಕರೆ ಜಮೀನಿದೆ ಆದರೆ ಬೋರ್‌ವೆಲ್ ಇಲ್ಲ.',
      tag: 'ಗಂಗಾ ಕಲ್ಯಾಣ ಯೋಜನೆ'
    }
  ];

  const highlights = [
    {
      titleKn: 'ರೈತ ಸಿರಿ ಯೋಜನೆ',
      titleEn: 'Raitha Siri Scheme',
      amount: '₹10,000 / ಹೆಕ್ಟೇರ್',
      desc: 'ರಾಗಿ, ನವಣೆ, ಸಾಮೆ ಮೊದಲಾದ ಸಿರಿಧಾನ್ಯ ಬೆಳೆಯುವ ರೈತರಿಗೆ ನೇರ ಆರ್ಥಿಕ ನೆರವು.',
      icon: <Sprout className="w-6 h-6 text-emerald-400" />,
      tag: 'Direct Benefit'
    },
    {
      titleKn: 'ಕೃಷಿ ಭಾಗ್ಯ ಯೋಜನೆ',
      titleEn: 'Krishi Bhagya Scheme',
      amount: '80% - 90% ಸಬ್ಸಿಡಿ',
      desc: 'ಮಳೆಯಾಶ್ರಿತ ಪ್ರದೇಶಗಳ ರೈತರಿಗೆ ಕೃಷಿ ಹೊಂಡ, ಪಾಲಿಥೀನ್ ಹೊದಿಕೆ ಮತ್ತು ಪಂಪ್‌ಸೆಟ್‌ಗಳಿಗೆ ಸಹಾಯಧನ.',
      icon: <Droplets className="w-6 h-6 text-sky-400" />,
      tag: 'Water Harvesting'
    },
    {
      titleKn: 'ಗಂಗಾ ಕಲ್ಯಾಣ ಯೋಜನೆ',
      titleEn: 'Ganga Kalyana Scheme',
      amount: '100% ಉಚಿತ ಬೋರ್‌ವೆಲ್',
      desc: 'SC, ST ಮತ್ತು ಹಿಂದುಳಿದ ವರ್ಗಗಳ ಸಣ್ಣ ರೈತರಿಗೆ ಉಚಿತ ಬೋರ್‌ವೆಲ್ ಕೊರೆಯುವಿಕೆ ಮತ್ತು ವಿದ್ಯುದ್ದೀಕರಣ.',
      icon: <LandPlot className="w-6 h-6 text-amber-400" />,
      tag: 'Free Irrigation'
    },
    {
      titleKn: 'ಪಿಎಂ-ಕಿಸಾನ್ ಸಮ್ಮಾನ್ ನಿಧಿ',
      titleEn: 'PM-KISAN Samman Nidhi',
      amount: '₹6,000 / ವಾರ್ಷಿಕ',
      desc: 'ದೇಶದ ಎಲ್ಲಾ ಭೂಮಾಲೀಕ ರೈತ ಕುಟುಂಬಗಳಿಗೆ ವರ್ಷಕ್ಕೆ 3 ಕಂತುಗಳಲ್ಲಿ ನೇರ ನಗದು ವರ್ಗಾವಣೆ.',
      icon: <Coins className="w-6 h-6 text-yellow-400" />,
      tag: 'Income Support'
    }
  ];

  return (
    <div className="space-y-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[30px] glass-panel p-6 sm:p-8 lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(134,239,172,0.12),transparent_33%)]" aria-hidden="true" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="max-w-3xl space-y-6">
            <div className="section-tag">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-kannada">ಕರ್ನಾಟಕದ ರೈತರಿಗಾಗಿ ನವೀನ ಧ್ವನಿ ತಂತ್ರಜ್ಞಾನ</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight font-kannada tracking-tight">
              ಕನ್ನಡದಲ್ಲೇ ಮಾತನಾಡಿ, <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-green-200 to-amber-300">
                ಸರ್ಕಾರಿ ಸೌಲಭ್ಯಗಳನ್ನು
              </span> ಪಾರದರ್ಶಕವಾಗಿ ತಿಳಿಯಿರಿ.
            </h1>

            <p className="max-w-xl text-sm sm:text-base text-slate-200 leading-relaxed font-kannada font-normal">
              ಕೃಷಿ ಮಿತ್ರ ನಿಮ್ಮ ಕೃಷಿ ವಿವರಗಳನ್ನು (ಜಮೀನು, ಬೆಳೆ, ನೀರಾವರಿ) ಧ್ವನಿಯ ಮೂಲಕ ಅರ್ಥೈಸಿಕೊಂಡು, ನೀವು ಅರ್ಹರಾಗಿರುವ ಕರ್ನಾಟಕ ಮತ್ತು ಕೇಂದ್ರ ಸರ್ಕಾರದ ನೈಜ ಯೋಜನೆಗಳನ್ನು ಕರಾರುವಾಕ್ಕಾಗಿ ಶಿಫಾರಸು ಮಾಡುತ್ತದೆ.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('assistant')}
                className="primary-action px-6 py-4 rounded-2xl font-bold text-base flex items-center justify-center space-x-3 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <span className="font-kannada">ಧ್ವನಿ ಸಹಾಯಕ ಆರಂಭಿಸಿ (Speak Now)</span>
              </button>

              <button
                onClick={() => onNavigate('schemes')}
                className="secondary-action px-6 py-4 rounded-2xl font-semibold text-sm flex items-center justify-center space-x-2 transition-all"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="font-kannada">ಯೋಜನೆಗಳ ಪಟ್ಟಿ ನೋಡಿ</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>

          <div className="soft-card rounded-3xl p-5 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">Quick Snapshot</p>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Live</span>
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  <p className="text-xs text-slate-400">Eligible schemes</p>
                  <p className="mt-2 text-3xl font-black text-white">12+</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                    <p className="text-[10px] text-slate-400">Avg. match</p>
                    <p className="mt-2 text-xl font-bold text-emerald-300">82%</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                    <p className="text-[10px] text-slate-400">Info source</p>
                    <p className="mt-2 text-xl font-bold text-amber-300">Verified</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Click Prompts */}
        <div className="mt-10 pt-8 border-t border-slate-800/80">
          <p className="text-xs font-semibold text-slate-400 mb-3 font-kannada">
            💡 ಉದಾಹರಣೆ ಮಾತುಗಳು (ಒಂದು ಕ್ಲಿಕ್‌ನಲ್ಲಿ ಧ್ವನಿ ಪರೀಕ್ಷಿಸಿ):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => onStartVoiceScenario(p.text)}
                className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-600/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-400 mb-1">
                  <span className="font-kannada">{p.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                    {p.tag}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-kannada line-clamp-2 group-hover:text-white">
                  "{p.text}"
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Verified Scheme Highlights */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-kannada">
              ಪ್ರಮುಖ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-kannada mt-1">
              ಕರ್ನಾಟಕದ ರೈತರಿಗಾಗಿ ಸೌಲಭ್ಯಗಳು
            </h2>
          </div>
          <button
            onClick={() => onNavigate('schemes')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 font-kannada"
          >
            <span>ಎಲ್ಲಾ ಯೋಜನೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((h, i) => (
            <div 
              key={i}
              className="glass-panel p-6 rounded-2xl flex flex-col justify-between border border-slate-800/80 hover:border-emerald-500/40 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 group-hover:border-emerald-500/40 transition-colors">
                    {h.icon}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-700">
                    {h.tag}
                  </span>
                </div>
                <h3 className="font-bold text-base text-white font-kannada">{h.titleKn}</h3>
                <p className="text-xs text-slate-400 font-medium">{h.titleEn}</p>
                <div className="my-3 py-1.5 px-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 font-bold text-sm font-kannada">
                  {h.amount}
                </div>
                <p className="text-xs text-slate-300 font-kannada leading-relaxed">
                  {h.desc}
                </p>
              </div>
              <button
                onClick={() => onNavigate('schemes')}
                className="mt-4 pt-3 border-t border-slate-800/80 text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center justify-between font-kannada"
              >
                <span>ಅರ್ಹತಾ ಮಾನದಂಡಗಳು</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Trust & Architecture Pillars */}
      <section className="glass-panel p-8 sm:p-10 rounded-3xl border border-emerald-900/30">
        <h3 className="text-xl font-bold text-white font-kannada text-center mb-8">
          ಕೃಷಿ ಮಿತ್ರ ವೇದಿಕೆಯ ವಿಶ್ವಾಸಾರ್ಹತೆ (Why Farmers Trust Krishi Mitra)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 flex items-center justify-center text-emerald-400 border border-emerald-800/60">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-base font-kannada">100% ನಿಯಮ-ಆಧಾರಿತ ನಿರ್ಧಾರ (Zero AI Hallucination)</h4>
            <p className="text-xs text-slate-300 font-kannada leading-relaxed">
              ಯಾವ ಸರ್ಕಾರಿ ಯೋಜನೆಗೆ ನೀವು ಅರ್ಹರು ಎಂಬುದನ್ನು AI ಕಲ್ಪನೆಯಿಂದ ಹೇಳುವುದಿಲ್ಲ; ಕೃಷಿ ಇಲಾಖೆಯ ಅಧಿಕೃತ ನಿಯಮಾವಳಿಗಳನ್ನು ಮಾತ್ರ ಹೋಲಿಸಿ ನಿಖರವಾಗಿ ತಿಳಿಸುತ್ತದೆ.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 flex items-center justify-center text-emerald-400 border border-emerald-800/60">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-base font-kannada">ಪಾರದರ್ಶಕ ಕಾರಣಗಳು (Explainable Reasons)</h4>
            <p className="text-xs text-slate-300 font-kannada leading-relaxed">
              ನೀವು ಯೋಜನೆಗೆ ಏಕೆ ಅರ್ಹರಾಗಿದ್ದೀರಿ (ಉದಾ: 5 ಎಕರೆಗಿಂತ ಕಡಿಮೆ ಜಮೀನು, ರಾಗಿ ಬೆಳೆ) ಎಂಬುದನ್ನು ಪ್ರತಿ ಮಾನದಂಡದ ಸಮೇತ ಸ್ಪಷ್ಟವಾಗಿ ವಿವರಿಸಲಾಗುತ್ತದೆ.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 flex items-center justify-center text-emerald-400 border border-emerald-800/60">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-base font-kannada">ರೈತ-ಕೇಂದ್ರಿತ ಕನ್ನಡ ವಿನ್ಯಾಸ (Farmer-Centric UX)</h4>
            <p className="text-xs text-slate-300 font-kannada leading-relaxed">
              ಸರಳ ಪದಗಳು, ಸ್ಪಷ್ಟವಾದ ದೊಡ್ಡ ಬಟನ್‌ಗಳು ಮತ್ತು ಮೊಬೈಲ್-ಸ್ನೇಹಿ ಇಂಟರ್ಫೇಸ್ ಮೂಲಕ ಹಳ್ಳಿಯ ರೈತರೂ ಸರಾಗವಾಗಿ ಬಳಸಬಹುದು.
            </p>
          </div>
        </div>
      </section>

      {/* Statutory Disclaimer Notice */}
      <StatutoryDisclaimer />
    </div>
  );
}
