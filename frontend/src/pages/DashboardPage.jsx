import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  LandPlot, 
  Sprout, 
  FileText, 
  RefreshCw, 
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Coins,
  Droplets,
  ExternalLink
} from 'lucide-react';
import { getFarmerProfile, recommendSchemes, checkEligibility } from '../services/api';
import StatutoryDisclaimer from '../components/StatutoryDisclaimer';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';

export default function DashboardPage({ activeFarmerId = null, onNavigate, onSelectScheme }) {
  const [farmer, setFarmer] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [evaluationResults, setEvaluationResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [activeFarmerId]);

  const loadDashboardData = async () => {
    if (!activeFarmerId) {
      setFarmer(null);
      setRecommendations([]);
      setErrorMsg('');
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Fetch Farmer Profile
      const farmerRes = await getFarmerProfile(activeFarmerId);
      if (farmerRes.success && farmerRes.data) {
        setFarmer(farmerRes.data);
      }

      // 2. Fetch Rule-Based Scheme Recommendations
      const recRes = await recommendSchemes(activeFarmerId);
      if (recRes.success && recRes.data) {
        setRecommendations(recRes.data.schemes || []);
      }
    } catch (err) {
      setErrorMsg('ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಮಾಹಿತಿ ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunFullAudit = async () => {
    setEvaluating(true);
    try {
      const res = await checkEligibility(activeFarmerId);
      if (res.success && res.data) {
        setEvaluationResults(res.data.evaluations || []);
      }
    } catch (err) {
      setErrorMsg('ಅರ್ಹತಾ ಪರಿಶೀಲನೆ ದೋಷ: ' + err.message);
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="ರೈತರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಮತ್ತು ಯೋಜನೆಗಳ ಮಾಹಿತಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ..." />;
  }

  return (
    <div className="space-y-8">
      
      <div className="glass-panel p-5 sm:p-7 rounded-[28px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="section-tag mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="font-kannada">ಕರ್ನಾಟಕ ರೈತ ಅರ್ಹತಾ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-kannada">
              {farmer ? `ನಮಸ್ಕಾರ, ${farmer.full_name}!` : 'ರೈತರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್'}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 font-kannada">
              {farmer
                ? `${farmer.district_kn} (${farmer.district}) ಜಿಲ್ಲೆಯ ಕೃಷಿ ಹಿಡುವಳಿ ಆಧಾರಿತ ಸರ್ಕಾರಿ ಸೌಲಭ್ಯಗಳ ಪರಿಶೀಲನೆ.`
                : 'ಸಕ್ರಿಯ ರೈತ ಪ್ರೊಫೈಲ್ ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ ಹೊಸ ರೈತರನ್ನು ನೋಂದಾಯಿಸಿ.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunFullAudit}
              disabled={evaluating || !activeFarmerId}
              className="primary-action px-5 py-3 rounded-xl text-xs sm:text-sm font-kannada font-bold flex items-center space-x-2 transition-all disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${evaluating ? 'animate-spin' : ''}`} />
              <span>{evaluating ? 'ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...' : 'ಅರ್ಹತೆ ಮರುಪರಿಶೀಲಿಸಿ'}</span>
            </button>

            <button
              onClick={() => onNavigate('assistant')}
              className="secondary-action px-4 py-3 rounded-xl text-xs sm:text-sm font-kannada font-semibold flex items-center space-x-1.5"
            >
              <span>ಧ್ವನಿ ಸಹಾಯಕ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {farmer && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-6 border-t border-slate-800/80">
            <div className="soft-card rounded-2xl p-3.5">
              <span className="text-[11px] text-slate-400 block font-kannada">ಒಟ್ಟು ಜಮೀನು</span>
              <span className="mt-2 block text-base font-bold text-white font-kannada">{farmer.total_land_acres} ಎಕರೆ</span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">{farmer.farmer_category}</span>
            </div>

            <div className="soft-card rounded-2xl p-3.5">
              <span className="text-[11px] text-slate-400 block font-kannada">ನೀರಾವರಿ</span>
              <span className="mt-2 block text-sm font-bold text-white font-kannada">{farmer.irrigation_type}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{farmer.has_borewell ? 'ಬೋರ್‌ವೆಲ್ ಇದೆ' : 'ಬೋರ್‌ವೆಲ್ ಇಲ್ಲ'}</span>
            </div>

            <div className="soft-card rounded-2xl p-3.5">
              <span className="text-[11px] text-slate-400 block font-kannada">ಜಾತಿ ವರ್ಗ</span>
              <span className="mt-2 block text-sm font-bold text-white font-kannada">{farmer.caste_category}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">ಆದಾಯ: ₹{farmer.annual_income}</span>
            </div>

            <div className="soft-card rounded-2xl p-3.5">
              <span className="text-[11px] text-slate-400 block font-kannada">ಬೆಳೆಗಳು</span>
              <span className="mt-2 block text-sm font-bold text-emerald-300 font-kannada truncate">
                {farmer.crops?.length ? farmer.crops.map(c => c.crop_name_kn || c.crop_name).join(', ') : 'ದಾಖಲಾಗಿಲ್ಲ'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{farmer.crops?.length || 0} ಬೆಳೆ ದಾಖಲೆ</span>
            </div>
          </div>
        )}
      </div>

      {!farmer && (
        <div className="soft-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-sky-100 font-kannada">ಈ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಸಕ್ರಿಯ ರೈತ ಪ್ರೊಫೈಲ್ ಇಲ್ಲ. ಮೊದಲು ರೈತರನ್ನು ನೋಂದಾಯಿಸಿ.</p>
          <button
            onClick={() => onNavigate('register')}
            className="primary-action px-4 py-2.5 rounded-xl text-xs font-bold font-kannada"
          >
            ರೈತರನ್ನು ನೋಂದಾಯಿಸಿ
          </button>
        </div>
      )}

      {errorMsg && (
        <AlertBanner 
          type="error"
          title="ದೋಷ (Notice)"
          message={errorMsg}
          onClose={() => setErrorMsg('')}
        />
      )}

      {evaluationResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white font-kannada flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>ಶಾಸನಬದ್ಧ ನಿಯಮ ಎಂಜಿನ್ ಪರಿಶೀಲನೆ</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">{evaluationResults.length} Schemes Evaluated</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evaluationResults.map((ev, i) => (
              <div key={i} className="soft-card p-5 rounded-2xl space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white font-kannada text-base">{ev.name_kn}</h3>
                    <p className="text-xs text-slate-400">{ev.name_en}</p>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                    ev.status === 'ELIGIBLE' 
                      ? 'bg-emerald-900/70 text-emerald-300 border border-emerald-700'
                      : 'bg-amber-900/70 text-amber-300 border border-amber-700'
                  }`}>
                    {ev.status === 'ELIGIBLE' ? '100% ಅರ್ಹ' : 'ಭಾಗಶಃ ಅರ್ಹ'}
                  </span>
                </div>

                <div className="text-xs space-y-1 pt-2 border-t border-slate-800">
                  <span className="font-semibold text-emerald-400 font-kannada block">✓ ತೃಪ್ತಿಪಡಿಸಿದ ಮಾನದಂಡಗಳು</span>
                  <ul className="list-disc list-inside text-slate-300 font-kannada space-y-0.5">
                    {ev.satisfied_conditions_kn.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>

                {ev.unsatisfied_conditions_kn?.length > 0 && (
                  <div className="text-xs space-y-1">
                    <span className="font-semibold text-amber-400 font-kannada block">⚠ ಗಮನಿಸಬೇಕಾದ ನಿಯಮಗಳು</span>
                    <ul className="list-disc list-inside text-slate-400 font-kannada space-y-0.5">
                      {ev.unsatisfied_conditions_kn.map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Schemes Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-white font-kannada">
              ನಿಮಗೆ ಶಿಫಾರಸು ಮಾಡಲಾದ ಯೋಜನೆಗಳು
            </h2>
            <p className="text-xs text-slate-400 font-kannada">
              ನಿಮ್ಮ ಕೃಷಿ ವಿವರಗಳೊಂದಿಗೆ ಹೊಂದಾಣಿಕೆಯಾಗುವ ಅಧಿಕೃತ ಕರ್ನಾಟಕ ಮತ್ತು ಕೇಂದ್ರ ಸರ್ಕಾರದ ಯೋಜನೆಗಳು.
            </p>
          </div>
          <span className="text-xs bg-emerald-950/60 text-emerald-300 border border-emerald-800 px-3 py-1 rounded-full font-semibold font-kannada">
            {recommendations.length} ಯೋಜನೆಗಳು ಲಭ್ಯ
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendations.map((rec) => (
            <div 
              key={rec.scheme_id}
              className="glass-panel p-5 sm:p-6 rounded-2xl flex flex-col justify-between border border-slate-800 hover:border-emerald-500/40 transition-all space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                      {rec.scheme_code}
                    </span>
                    <h3 className="text-base font-bold text-white font-kannada leading-relaxed mt-2t-lg font-bold text-white font-kannada mt-2">
                      {rec.name_kn}
                    </h3>
                    <p className="text-xs text-slate-400">{rec.name_en}</p>
                    <p className="text-xs text-emerald-400 font-kannada mt-0.5">{rec.department_kn}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold block">
                      {rec.match_score}% ಹೊಂದಾಣಿಕೆ
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                      {rec.indicative_status}
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-emerald-950/35 border border-emerald-800/40 text-emerald-300 font-bold text-xs font-kannada">
                  ಆರ್ಥಿಕ ನೆರವು / ಸಬ್ಸಿಡಿ: <span className="text-white text-sm ml-1">{rec.benefit_amount_kn}</span>
                </div>

                {rec.qualification_reasons_kn?.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 block font-kannada">
                      ಅರ್ಹತಾ ಕಾರಣಗಳು
                    </span>
                    <ul className="text-xs text-slate-300 space-y-1 font-kannada">
                      {rec.qualification_reasons_kn.map((reason, rIdx) => (
                        <li key={rIdx} className="flex items-start space-x-1.5">
                          <span className="text-emerald-400">✓</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {rec.required_documents_kn?.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1 font-kannada">
                      ಅಗತ್ಯವಿರುವ ದಾಖಲೆಗಳು
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {rec.required_documents_kn.map((doc, dIdx) => (
                        <span key={dIdx} className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-kannada">
                          📄 {doc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <button
                  onClick={() => onSelectScheme(rec.scheme_id)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold font-kannada border border-slate-700 flex items-center space-x-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ವಿವರ ನೋಡಿ</span>
                </button>

                {rec.application_portal && (
                  <a
                    href={rec.application_portal}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-kannada flex items-center space-x-1.5 shadow-md shadow-emerald-700/30"
                  >
                    <span>ಅರ್ಜಿ ಸಲ್ಲಿಸಿ</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statutory Disclaimer */}
      <StatutoryDisclaimer />
    </div>
  );
}
