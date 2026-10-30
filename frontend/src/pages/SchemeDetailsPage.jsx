import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ExternalLink, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  Coins, 
  Building2, 
  Clock, 
  RefreshCw,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { getSchemes, checkEligibility } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';
import StatutoryDisclaimer from '../components/StatutoryDisclaimer';

export default function SchemeDetailsPage({ schemeId, onBack, onNavigate, activeFarmerId = 1 }) {
  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);

  useEffect(() => {
    fetchSchemeDetail();
  }, [schemeId]);

  const fetchSchemeDetail = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await getSchemes();
      if (res.success && res.data) {
        const found = res.data.find(s => s.id === Number(schemeId));
        if (found) {
          setScheme(found);
        } else {
          setErrorMsg('ಯೋಜನೆ ವಿವರ ಕಂಡುಬಂದಿಲ್ಲ.');
        }
      }
    } catch (err) {
      setErrorMsg('ಮಾಹಿತಿ ಪಡೆಯುವಲ್ಲಿ ದೋಷ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckMyEligibility = async () => {
    setEvaluating(true);
    try {
      const res = await checkEligibility(activeFarmerId, schemeId);
      if (res.success && res.data?.evaluations?.length > 0) {
        setEvaluationResult(res.data.evaluations[0]);
      }
    } catch (err) {
      setErrorMsg('ಅರ್ಹತಾ ಪರಿಶೀಲನೆ ದೋಷ: ' + err.message);
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="ಯೋಜನೆಯ ಅಧಿಕೃತ ನಿಯಮಾವಳಿಗಳು ಲೋಡ್ ಆಗುತ್ತಿವೆ..." />;
  }

  if (!scheme) {
    return (
      <div className="glass-panel p-12 rounded-2xl text-center space-y-4">
        <p className="text-sm text-slate-300 font-kannada">ಆಯ್ದ ಯೋಜನೆ ಲಭ್ಯವಿಲ್ಲ.</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold font-kannada"
        >
          ಹಿಂದಕ್ಕೆ ಹೋಗಿ
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Back Button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors font-kannada"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ಯೋಜನೆಗಳ ಪಟ್ಟಿಗೆ ಹಿಂತಿರುಗಿ (Back to Schemes)</span>
        </button>
      </div>

      {errorMsg && (
        <AlertBanner 
          type="error"
          title="ದೋಷ"
          message={errorMsg}
          onClose={() => setErrorMsg('')}
        />
      )}

      {/* Main Scheme Header Card */}
      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-emerald-900/40 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-slate-900 text-emerald-300 border border-emerald-800 font-mono">
                {scheme.scheme_code}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {scheme.category || 'Agricultural Welfare'}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                {scheme.level === 'Karnataka_State' ? 'ಕರ್ನಾಟಕ ರಾಜ್ಯ ಸರ್ಕಾರ' : 'ಕೇಂದ್ರ ಸರ್ಕಾರ'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white font-kannada pt-2">
              {scheme.name_kn}
            </h1>
            <p className="text-sm text-slate-400 font-medium">{scheme.name_en}</p>
            <p className="text-xs text-emerald-400 font-kannada flex items-center space-x-1.5 pt-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>{scheme.department_kn || scheme.department_en}</span>
            </p>
          </div>

          {/* Benefit Badge */}
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-600/40 text-right shrink-0">
            <span className="text-[11px] text-slate-400 block font-kannada">ಸಬ್ಸಿಡಿ / ಆರ್ಥಿಕ ಮೊತ್ತ</span>
            <span className="text-lg font-black text-amber-300 font-kannada block mt-1">
              {scheme.benefit_amount_desc_kn || scheme.benefit_amount}
            </span>
          </div>
        </div>

        {/* Summary Description */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-kannada">
            ಯೋಜನೆಯ ವಿವರಣೆ (Scheme Objective)
          </h3>
          <p className="text-sm text-slate-200 leading-relaxed font-kannada">
            {scheme.summary_kn}
          </p>
        </div>

        {/* Action Button: Check My Eligibility */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
          <button
            onClick={handleCheckMyEligibility}
            disabled={evaluating}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs sm:text-sm font-kannada flex items-center space-x-2 shadow-lg shadow-emerald-700/30 transition-all disabled:opacity-50"
          >
            <ShieldCheck className={`w-4 h-4 ${evaluating ? 'animate-spin' : ''}`} />
            <span>{evaluating ? 'ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...' : 'ನನ್ನ ಅರ್ಹತೆ ಪರಿಶೀಲಿಸಿ (Check My Eligibility)'}</span>
          </button>

          {scheme.application_portal && (
            <a
              href={scheme.application_portal}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-700 font-semibold text-xs sm:text-sm font-kannada flex items-center space-x-2 transition-all"
            >
              <span>ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ತೆರೆಯಿರಿ</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Real-time Dynamic Eligibility Evaluation Feedback */}
      {evaluationResult && (
        <div className="p-6 rounded-2xl glass-panel-emerald border border-emerald-500/50 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-300">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <h3 className="text-base font-bold font-kannada">
                ಅರ್ಹತಾ ಫಲಿತಾಂಶ (Eligibility Check Result)
              </h3>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-bold ${
              evaluationResult.status === 'ELIGIBLE' 
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                : 'bg-amber-950 text-amber-300 border border-amber-700'
            }`}>
              {evaluationResult.status === 'ELIGIBLE' ? '100% ಸಂಭಾವ್ಯ ಅರ್ಹ (Likely Eligible)' : 'ಷರತ್ತುಗಳಿಗೆ ಒಳಪಟ್ಟಿದೆ (Partial)'}
            </span>
          </div>

          <div className="space-y-2 text-xs font-kannada">
            <span className="font-semibold text-emerald-300 block">
              ✓ ತೃಪ್ತಿಪಡಿಸಿದ ಮಾನದಂಡಗಳು (Passed Conditions):
            </span>
            <ul className="list-disc list-inside text-slate-200 space-y-1">
              {evaluationResult.satisfied_conditions_kn?.map((sc, scIdx) => (
                <li key={scIdx}>{sc}</li>
              ))}
            </ul>
          </div>

          {evaluationResult.unsatisfied_conditions_kn?.length > 0 && (
            <div className="space-y-2 text-xs font-kannada">
              <span className="font-semibold text-amber-300 block">
                ⚠ ಪೂರ್ಣಗೊಳಿಸಬೇಕಾದ ಷರತ್ತುಗಳು (Conditions to Fulfill):
              </span>
              <ul className="list-disc list-inside text-slate-300 space-y-1">
                {evaluationResult.unsatisfied_conditions_kn?.map((uc, ucIdx) => (
                  <li key={ucIdx}>{uc}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Statutory Eligibility Criteria Checklist */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl space-y-4">
        <div className="flex items-center space-x-2 text-emerald-400 border-b border-slate-800 pb-3">
          <ShieldCheck className="w-5 h-5" />
          <h3 className="font-bold text-white text-base font-kannada">
            ಶಾಸನಬದ್ಧ ಅರ್ಹತಾ ಮಾನದಂಡಗಳು (Statutory Eligibility Criteria)
          </h3>
        </div>

        <div className="space-y-3">
          {scheme.rules?.length > 0 ? (
            scheme.rules.map((rule, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start space-x-3">
                <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="space-y-0.5">
                  <p className="text-xs sm:text-sm font-semibold text-white font-kannada">
                    {rule.explanation_kn || rule.reason_kn}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Parameter: {rule.parameter_name || rule.field} {rule.operator} {rule.target_value || rule.value}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 font-kannada">ಅಧಿಕೃತ ಇಲಾಖಾ ನಿಯಮಾವಳಿಗಳ ಅನ್ವಯ ಅನ್ವಯವಾಗುತ್ತದೆ.</p>
          )}
        </div>
      </div>

      {/* Mandatory Statutory Documents Checklist */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl space-y-4">
        <div className="flex items-center space-x-2 text-emerald-400 border-b border-slate-800 pb-3">
          <FileText className="w-5 h-5" />
          <h3 className="font-bold text-white text-base font-kannada">
            ಅಗತ್ಯವಿರುವ ಅಧಿಕೃತ ದಾಖಲೆಗಳು (Mandatory Documents Checklist)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(scheme.documents || scheme.documents_kn || []).map((doc, dIdx) => {
            const docName = typeof doc === 'string' ? doc : (doc.document_name_kn || doc.document_name_en);
            const authority = typeof doc === 'object' ? doc.issuing_authority_kn : null;
            return (
              <div key={dIdx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start space-x-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-white font-kannada block">
                    {docName}
                  </span>
                  {authority && (
                    <span className="text-[10px] text-slate-400 block font-kannada mt-0.5">
                      ವಿತರಿಸುವ ಇಲಾಖೆ: {authority}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* How to Apply Guide */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl space-y-4">
        <div className="flex items-center space-x-2 text-emerald-400 border-b border-slate-800 pb-3">
          <Clock className="w-5 h-5" />
          <h3 className="font-bold text-white text-base font-kannada">
            ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ವಿಧಾನ (Step-by-Step Application Instructions)
          </h3>
        </div>

        <ol className="space-y-3 text-xs sm:text-sm text-slate-300 font-kannada list-decimal list-inside leading-relaxed">
          <li>ನಿಮ್ಮ ಗ್ರಾಮ ವ್ಯಾಪ್ತಿಯ <strong>ರೈತ ಸಂಪರ್ಕ ಕೇಂದ್ರಕ್ಕೆ (RSK)</strong> ಅಥವಾ ಗ್ರಾಮ ಆಡಳಿತ ಅಧಿಕಾರಿಯನ್ನು (VAO) ಭೇಟಿ ನೀಡಿ.</li>
          <li>ನಿಮ್ಮ ಪಹಣಿ (RTC) ಯಲ್ಲಿ ಇತ್ತೀಚಿನ ಬೆಳೆ ಸಮೀಕ್ಷೆ (Crop Survey) ನಮೂದಾಗಿರುವುದನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.</li>
          <li>ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ <strong>ಆಧಾರ್ ಮತ್ತು NPCI ಲಿಂಕ್</strong> ಆಗಿರುವುದನ್ನು ಪರಿಶೀಲಿಸಿ (ನೇರ ನಗದು ವರ್ಗಾವಣೆಗೆ ಕಡ್ಡಾಯ).</li>
          <li>ಅಧಿಕೃತ <strong>FRUITS ಪೋರ್ಟಲ್</strong> ಮೂಲಕ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಅಥವಾ ನಾಡಕಚೇರಿಯಲ್ಲಿ ನಿಗದಿತ ನಮೂನೆಯಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.</li>
        </ol>
      </div>

      {/* Statutory Disclaimer */}
      <StatutoryDisclaimer />
    </div>
  );
}
