import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  ExternalLink, 
  ArrowRight, 
  Filter, 
  ShieldCheck, 
  Coins, 
  Droplets, 
  LandPlot 
} from 'lucide-react';
import { getSchemes } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';
import StatutoryDisclaimer from '../components/StatutoryDisclaimer';

export default function SchemesPage({ onSelectScheme }) {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');

  const categories = [
    { id: 'ALL', labelKn: 'ಎಲ್ಲಾ ವರ್ಗಗಳು', labelEn: 'All' },
    { id: 'Direct Benefit Transfer', labelKn: 'ನೇರ ನಗದು (DBT)', labelEn: 'Direct Benefit' },
    { id: 'Water Harvesting', labelKn: 'ಕೃಷಿ ಹೊಂಡ / ಸಬ್ಸಿಡಿ', labelEn: 'Water Subsidy' },
    { id: 'Irrigation', labelKn: 'ಉಚಿತ ಬೋರ್‌ವೆಲ್', labelEn: 'Irrigation' },
    { id: 'Income Support', labelKn: 'ಆದಾಯ ಬೆಂಬಲ', labelEn: 'Income Support' },
    { id: 'Insurance', labelKn: 'ಬೆಳೆ ವಿಮೆ', labelEn: 'Crop Insurance' }
  ];

  const levels = [
    { id: 'ALL', labelKn: 'ಎಲ್ಲಾ ಹಂತಗಳು', labelEn: 'All Levels' },
    { id: 'Karnataka_State', labelKn: 'ಕರ್ನಾಟಕ ಸರ್ಕಾರ', labelEn: 'Karnataka State' },
    { id: 'Central_Government', labelKn: 'ಕೇಂದ್ರ ಸರ್ಕಾರ', labelEn: 'Central Government' }
  ];

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await getSchemes();
      if (res.success && res.data) {
        setSchemes(res.data);
      } else {
        setErrorMsg('ಯೋಜನೆಗಳ ಮಾಹಿತಿ ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.');
      }
    } catch (err) {
      setErrorMsg('ಸರ್ವರ್ ಸಂಪರ್ಕ ದೋಷ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter schemes based on search, category and level
  const filteredSchemes = schemes.filter(s => {
    const query = searchQuery.trim().toLowerCase();
    const nameKn = (s.name_kn || '').toLowerCase();
    const nameEn = (s.name_en || '').toLowerCase();
    const summaryKn = (s.summary_kn || '').toLowerCase();
    const dept = (s.department_kn || s.department_en || '').toLowerCase();
    const matchesSearch = !query || nameKn.includes(query) || nameEn.includes(query) || summaryKn.includes(query) || dept.includes(query);

    const matchesCategory = selectedCategory === 'ALL' || (s.category && s.category.toLowerCase().includes(selectedCategory.toLowerCase()));
    const matchesLevel = selectedLevel === 'ALL' || s.level === selectedLevel;

    return matchesSearch && matchesCategory && matchesLevel;
  });

  return (
    <div className="space-y-8">
      
      {/* Page Title */}
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
          <FileText className="w-3.5 h-3.5" />
          <span className="font-kannada">ದೃಢೀಕೃತ ಶಾಸನಬದ್ಧ ಯೋಜನೆಗಳು</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-kannada">
          ಸರ್ಕಾರಿ ಕೃಷಿ ಯೋಜನೆಗಳ ಪಟ್ಟಿ (Government Schemes Catalog)
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-kannada">
          ಕರ್ನಾಟಕ ರಾಜ್ಯ ಕೃಷಿ ಇಲಾಖೆ ಹಾಗೂ ಕೇಂದ್ರ ಕೃಷಿ ಸಚಿವಾಲಯದ ಅಧಿಕೃತ ಯೋಜನೆಗಳ ಅಧಿಕೃತ ಮಾನದಂಡಗಳು ಮತ್ತು ದಾಖಲೆಗಳು.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ಯೋಜನೆಯ ಹೆಸರು, ಬೆಳೆ (ರಾಗಿ, ಭತ್ತ) ಅಥವಾ ಸಬ್ಸಿಡಿ ಪ್ರಕಾರ ಹುಡುಕಿ..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:outline-none text-white text-sm font-kannada"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center space-x-1 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              <span className="font-kannada">ವರ್ಗ:</span>
            </span>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span className="font-kannada">{cat.labelKn}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {levels.map(lvl => (
              <button
                key={lvl.id}
                onClick={() => setSelectedLevel(lvl.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedLevel === lvl.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span className="font-kannada">{lvl.labelKn}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {errorMsg && (
        <AlertBanner 
          type="error"
          title="ದೋಷ"
          message={errorMsg}
          onClose={() => setErrorMsg('')}
        />
      )}

      {loading ? (
        <LoadingSpinner message="ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಪಟ್ಟಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ..." />
      ) : filteredSchemes.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white font-kannada">ಯಾವುದೇ ಯೋಜನೆ ಕಂಡುಬಂದಿಲ್ಲ</h3>
          <p className="text-xs text-slate-400 font-kannada">
            ನಿಮ್ಮ ಶೋಧನೆಗೆ ಹೊಂದಿಕೆಯಾಗುವ ಯೋಜನೆಗಳು ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಬೇರೆ ಕೀವರ್ಡ್ ಬಳಸಿ.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); setSelectedLevel('ALL'); }}
            className="px-4 py-2 rounded-xl bg-slate-900 text-emerald-400 text-xs font-semibold border border-slate-800 font-kannada"
          >
            ಫಿಲ್ಟರ್ ಮರುಹೊಂದಿಸಿ (Reset)
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchemes.map((scheme) => (
            <div 
              key={scheme.id}
              className="glass-panel p-6 rounded-2xl flex flex-col justify-between border border-slate-800 hover:border-emerald-500/40 transition-all group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 font-mono">
                    {scheme.scheme_code}
                  </span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {scheme.level === 'Karnataka_State' ? 'ಕರ್ನಾಟಕ ರಾಜ್ಯ' : 'ಕೇಂದ್ರ ಸರ್ಕಾರ'}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white font-kannada group-hover:text-emerald-300 transition-colors">
                    {scheme.name_kn}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">{scheme.name_en}</p>
                  <p className="text-xs text-emerald-400 font-kannada mt-0.5">
                    {scheme.department_kn || scheme.department_en}
                  </p>
                </div>

                {/* Financial Benefit Highlight */}
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
                  <span className="text-[11px] text-slate-400 block font-kannada">ಆರ್ಥಿಕ ನೆರವು / ಸೌಲಭ್ಯ:</span>
                  <span className="text-sm font-bold text-amber-300 font-kannada block mt-0.5">
                    {scheme.benefit_amount_desc_kn || scheme.benefit_amount}
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-kannada leading-relaxed line-clamp-3">
                  {scheme.summary_kn}
                </p>

                {/* Documents Count Badge */}
                {scheme.documents?.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-kannada">
                    <span>ಕಡ್ಡಾಯ ದಾಖಲೆಗಳು:</span>
                    <span className="font-semibold text-emerald-400 font-mono">
                      {scheme.documents.length} ದಾಖಲೆಗಳು
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <button
                  onClick={() => onSelectScheme(scheme.id)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold font-kannada border border-slate-700 flex items-center justify-center space-x-1.5 transition-all"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ವಿವರಗಳನ್ನು ನೋಡಿ</span>
                </button>

                {scheme.application_portal && (
                  <a
                    href={scheme.application_portal}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-emerald-950 text-emerald-400 border border-slate-700 shrink-0"
                    title="ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ತೆರೆಯಿರಿ"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statutory Disclaimer */}
      <StatutoryDisclaimer />
    </div>
  );
}
