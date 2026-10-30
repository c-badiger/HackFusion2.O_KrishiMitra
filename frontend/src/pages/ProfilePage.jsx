import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  LandPlot, 
  Sprout, 
  Phone, 
  MapPin, 
  Coins, 
  CheckCircle2, 
  ExternalLink,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { getFarmerProfile } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';

export default function ProfilePage({ activeFarmerId = 1, onNavigate }) {
  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [activeFarmerId]);

  const fetchProfile = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await getFarmerProfile(activeFarmerId);
      if (res.success && res.data) {
        setFarmer(res.data);
      } else {
        setErrorMsg('ರೈತರ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ.');
      }
    } catch (err) {
      setErrorMsg('ಮಾಹಿತಿ ಪಡೆಯುವಲ್ಲಿ ದೋಷ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="ರೈತರ ಪ್ರೊಫೈಲ್ ಮಾಹಿತಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <UserCheck className="w-3.5 h-3.5" />
            <span className="font-kannada">ರೈತರ ದಾಖಲಾತಿ ಮತ್ತು ಪ್ರೊಫೈಲ್</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-kannada mt-2">
            ರೈತರ ವಿವರ (Farmer Profile Matrix)
          </h2>
        </div>

        <button
          onClick={() => onNavigate('dashboard')}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-kannada flex items-center space-x-2 shadow-lg shadow-emerald-700/30"
        >
          <span>ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹೋಗಿ</span>
          <ArrowRight className="w-4 h-4" />
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

      {farmer && (
        <div className="space-y-6">
          
          {/* Card 1: Identity & Demographics */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-emerald-400">
                <UserCheck className="w-5 h-5" />
                <h3 className="font-bold text-white text-base font-kannada">
                  ವೈಯಕ್ತಿಕ ಮತ್ತು ಅಧಿಕೃತ ವಿವರಗಳು (Identity & Contact)
                </h3>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                Farmer ID #{farmer.id}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 block font-kannada">ರೈತರ ಹೆಸರು (Full Name):</span>
                <span className="font-bold text-white font-kannada mt-0.5 block">{farmer.full_name}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 block font-kannada">ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (Phone):</span>
                <span className="font-bold text-white font-mono mt-0.5 block">{farmer.phone_number}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 block font-kannada">FRUITS ಗುರುತಿನ ಸಂಖ್ಯೆ (FID):</span>
                <span className="font-bold text-emerald-400 font-mono mt-0.5 block">
                  {farmer.fruits_id || 'ನೋಂದಾಯಿಸಿಲ್ಲ (Not linked)'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 block font-kannada">ಜಿಲ್ಲೆ & ತಾಲೂಕು (District / Taluk):</span>
                <span className="font-bold text-white font-kannada mt-0.5 block">
                  {farmer.district_kn} ({farmer.district}), {farmer.taluk || '—'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 block font-kannada">ಗ್ರಾಮ (Village):</span>
                <span className="font-bold text-white font-kannada mt-0.5 block">
                  {farmer.village || '—'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 block font-kannada">ಜಾತಿ ವರ್ಗ (Caste Category):</span>
                <span className="font-bold text-white font-kannada mt-0.5 block">
                  {farmer.caste_category}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Agricultural Holdings & Irrigation */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl space-y-6">
            <div className="flex items-center space-x-2 text-emerald-400 border-b border-slate-800 pb-3">
              <LandPlot className="w-5 h-5" />
              <h3 className="font-bold text-white text-base font-kannada">
                ಕೃಷಿ ಜಮೀನು ಮತ್ತು ನೀರಾವರಿ ಸ್ಥಿತಿ (Landholding & Soil)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 block font-kannada">ಒಟ್ಟು ವಿಸ್ತೀರ್ಣ (Total Land):</span>
                <span className="text-lg font-bold text-emerald-300 font-kannada mt-0.5 block">
                  {farmer.total_land_acres} ಎಕರೆ
                </span>
                <span className="text-[10px] text-slate-400 block">
                  ವರ್ಗ: {farmer.farmer_category}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 block font-kannada">ಮಣ್ಣಿನ ಮಾದರಿ (Soil Type):</span>
                <span className="font-bold text-white font-kannada mt-0.5 block">
                  {farmer.soil_type || 'ಕೆಂಪು ಮಣ್ಣು (Red Loamy)'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 block font-kannada">ನೀರಾವರಿ ವಿಧ (Irrigation):</span>
                <span className="font-bold text-white font-kannada mt-0.5 block">
                  {farmer.irrigation_type}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 block font-kannada">ಬೋರ್‌ವೆಲ್ ಸೌಲಭ್ಯ (Borewell):</span>
                <span className={`font-bold mt-0.5 block font-kannada ${farmer.has_borewell ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {farmer.has_borewell ? 'ಹೌದು (Yes)' : 'ಇಲ್ಲ (No)'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Seasonal Crops */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl space-y-4">
            <div className="flex items-center space-x-2 text-emerald-400 border-b border-slate-800 pb-3">
              <Sprout className="w-5 h-5" />
              <h3 className="font-bold text-white text-base font-kannada">
                ಬೆಳೆಗಳ ದಾಖಲೆ (Cultivated Crop Records)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-kannada">
                    <th className="py-2.5 px-3">ಬೆಳೆಯ ಹೆಸರು (Crop)</th>
                    <th className="py-2.5 px-3">ವರ್ಗ (Category)</th>
                    <th className="py-2.5 px-3">ವಿಸ್ತೀರ್ಣ (Acres)</th>
                    <th className="py-2.5 px-3">ಋತು (Season)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-kannada">
                  {farmer.crops?.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-900/50">
                      <td className="py-3 px-3 font-bold text-white">
                        {c.crop_name_kn} ({c.crop_name})
                      </td>
                      <td className="py-3 px-3 text-emerald-400">
                        {c.crop_category}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {c.acres} ಎಕರೆ
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {c.season}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
