import React, { useState } from 'react';
import { 
  UserPlus, 
  LandPlot, 
  Sprout, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { registerFarmer } from '../services/api';
import AlertBanner from '../components/AlertBanner';
import LoadingSpinner from '../components/LoadingSpinner';

const KARNATAKA_DISTRICTS = [
  { en: "Mandya", kn: "ಮಂಡ್ಯ" },
  { en: "Mysuru", kn: "ಮೈಸೂರು" },
  { en: "Hassan", kn: "ಹಾಸನ" },
  { en: "Dharwad", kn: "ಧಾರವಾಡ" },
  { en: "Belagavi", kn: "ಬೆಳಗಾವಿ" },
  { en: "Tumakuru", kn: "ತುಮಕೂರು" },
  { en: "Kolar", kn: "ಕೋಲಾರ" },
  { en: "Chikkaballapura", kn: "ಚಿಕ್ಕಬಳ್ಳಾಪುರ" },
  { en: "Shivamogga", kn: "ಶಿವಮೊಗ್ಗ" },
  { en: "Kalaburagi", kn: "ಕಲಬುರಗಿ" },
  { en: "Raichur", kn: "ರಾಯಚೂರು" },
  { en: "Vijayapura", kn: "ವಿಜಯಪುರ" },
  { en: "Ballari", kn: "ಬಳ್ಳಾರಿ" },
  { en: "Chitradurga", kn: "ಚಿತ್ರದುರ್ಗ" },
  { en: "Davangere", kn: "ದಾವಣಗೆರೆ" },
  { en: "Udupi", kn: "ಉಡುಪಿ" }
];

const COMMON_CROPS = [
  { en: "Ragi", kn: "ರಾಗಿ", cat: "Siridhanya_Millet" },
  { en: "Paddy", kn: "ಭತ್ತ", cat: "Cereal" },
  { en: "Sugarcane", kn: "ಕಬ್ಬು", cat: "Cash_Crop" },
  { en: "Cotton", kn: "ಹತ್ತಿ", cat: "Cash_Crop" },
  { en: "Jowar", kn: "ಜೋಳ", cat: "Cereal" },
  { en: "Bengal Gram", kn: "ಕಡಲೆ", cat: "Pulse" },
  { en: "Groundnut", kn: "ಶೇಂಗಾ", cat: "Oilseed" }
];

export default function RegisterPage({ onNavigate, onFarmerRegistered }) {
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    district: 'Mandya',
    district_kn: 'ಮಂಡ್ಯ',
    taluk: '',
    village: '',
    caste_category: 'General',
    annual_income: '90000',
    total_land_acres: '2.5',
    soil_type: 'Red Loamy',
    irrigation_type: 'Rainfed',
    has_borewell: false,
    fruits_id: '',
    aadhaar_last_four: ''
  });

  const [crops, setCrops] = useState([
    { crop_name: 'Ragi', crop_name_kn: 'ರಾಗಿ', crop_category: 'Siridhanya_Millet', acres: 2.0, season: 'Kharif' }
  ]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  // Compute farmer holding class dynamically
  const acresNum = parseFloat(formData.total_land_acres || 0);
  let computedCategoryKn = 'ಸಣ್ಣ ರೈತರು';
  let computedCategoryEn = 'Small Farmer';
  if (acresNum < 2.47) {
    computedCategoryKn = 'ಅತಿ ಸಣ್ಣ ರೈತರು (Marginal)';
    computedCategoryEn = 'Marginal';
  } else if (acresNum <= 4.94) {
    computedCategoryKn = 'ಸಣ್ಣ ರೈತರು (Small)';
    computedCategoryEn = 'Small';
  } else if (acresNum <= 24.7) {
    computedCategoryKn = 'ಮಧ್ಯಮ ರೈತರು (Medium)';
    computedCategoryEn = 'Medium';
  } else {
    computedCategoryKn = 'ದೊಡ್ಡ ರೈತರು (Large)';
    computedCategoryEn = 'Large';
  }

  const handleDistrictChange = (e) => {
    const selectedEn = e.target.value;
    const match = KARNATAKA_DISTRICTS.find(d => d.en === selectedEn);
    setFormData(prev => ({
      ...prev,
      district: selectedEn,
      district_kn: match ? match.kn : selectedEn
    }));
  };

  const handleAddCrop = () => {
    setCrops(prev => [
      ...prev,
      { crop_name: 'Paddy', crop_name_kn: 'ಭತ್ತ', crop_category: 'Cereal', acres: 1.0, season: 'Kharif' }
    ]);
  };

  const handleRemoveCrop = (index) => {
    if (crops.length > 1) {
      setCrops(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleCropFieldChange = (index, field, value) => {
    setCrops(prev => {
      const updated = [...prev];
      if (field === 'crop_name') {
        const found = COMMON_CROPS.find(c => c.en === value);
        updated[index] = {
          ...updated[index],
          crop_name: value,
          crop_name_kn: found ? found.kn : value,
          crop_category: found ? found.cat : 'Cereal'
        };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (!formData.full_name.trim()) {
      setErrorMsg('ದಯವಿಟ್ಟು ರೈತರ ಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ (Please enter full name).');
      setLoading(false);
      return;
    }

    if (!/^\d{10}$/.test(formData.phone_number.trim())) {
      setErrorMsg('ದಯವಿಟ್ಟು ಸರಿಯಾದ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ (Please enter a valid 10-digit mobile number).');
      setLoading(false);
      return;
    }

    const payload = {
      full_name: formData.full_name.trim(),
      phone_number: formData.phone_number.trim(),
      district: formData.district,
      district_kn: formData.district_kn,
      taluk: formData.taluk.trim() || undefined,
      village: formData.village.trim() || undefined,
      caste_category: formData.caste_category,
      annual_income: parseFloat(formData.annual_income || 0),
      total_land_acres: parseFloat(formData.total_land_acres || 0),
      farmer_category: computedCategoryEn,
      soil_type: formData.soil_type,
      irrigation_type: formData.irrigation_type,
      has_borewell: formData.has_borewell,
      fruits_id: formData.fruits_id.trim() || undefined,
      aadhaar_last_four: formData.aadhaar_last_four.trim() || undefined,
      crops: crops.map(c => ({
        crop_name: c.crop_name,
        crop_name_kn: c.crop_name_kn,
        crop_category: c.crop_category,
        acres: parseFloat(c.acres || 1),
        season: c.season
      }))
    };

    try {
      const res = await registerFarmer(payload);
      if (res.success && res.data) {
        setSuccessResult(res.data);
        if (onFarmerRegistered) {
          onFarmerRegistered(res.data);
        }
      } else {
        setErrorMsg(res.message || 'ನೋಂದಣಿ ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'ಸರ್ವರ್ ಸಂಪರ್ಕದಲ್ಲಿ ದೋಷವಾಗಿದೆ. Backend port 8000 ಚಾಲನೆಯಲ್ಲಿದೆಯೇ ಪರಿಶೀಲಿಸಿ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
          <UserPlus className="w-3.5 h-3.5" />
          <span className="font-kannada">ರೈತರ ಪ್ರೊಫೈಲ್ ಮತ್ತು ಕೃಷಿ ಹಿಡುವಳಿ ದಾಖಲೆ</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-kannada">
          ಹೊಸ ರೈತರ ನೋಂದಣಿ (Farmer Registration)
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 font-kannada">
          ನಿಮ್ಮ ಜಮೀನು, ಬೆಳೆ ಮತ್ತು ನೀರಾವರಿ ಮಾಹಿತಿಯನ್ನು ನಿಖರವಾಗಿ ನಮೂದಿಸಿ; ನಿಯಮ-ಆಧಾರಿತ ಎಂಜಿನ್ ನಿಮಗೆ ಅರ್ಹ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕುತ್ತದೆ.
        </p>
      </div>

      {/* Success Modal / Banner */}
      {successResult && (
        <div className="p-6 rounded-2xl glass-panel-emerald border border-emerald-400/50 space-y-4">
          <div className="flex items-center space-x-3 text-emerald-300">
            <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
            <div>
              <h3 className="text-lg font-bold font-kannada">
                ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಗಿದೆ! (Registration Successful)
              </h3>
              <p className="text-xs text-emerald-200">
                ರೈತರ ಗುರುತಿನ ಸಂಖ್ಯೆ (Farmer ID): <strong className="text-white text-sm">#{successResult.id}</strong>
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-200 font-kannada leading-relaxed">
            {successResult.full_name} ಅವರ {successResult.total_land_acres} ಎಕರೆ ಜಮೀನಿನ ವಿವರ ದಾಖಲಾಗಿದೆ ({successResult.farmer_category}). ಈಗ ನೀವು ನೇರವಾಗಿ ನಿಮ್ಮ ಅರ್ಹತಾ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಪರಿಶೀಲಿಸಬಹುದು.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-kannada flex items-center space-x-2 shadow-lg shadow-emerald-700/40"
            >
              <span>ಅರ್ಹತಾ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹೋಗಿ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('schemes')}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold font-kannada border border-slate-700"
            >
              <span>ಯೋಜನೆಗಳ ಪಟ್ಟಿ ವೀಕ್ಷಿಸಿ</span>
            </button>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <AlertBanner 
          type="error"
          title="ದೋಷ (Error)"
          message={errorMsg}
          onClose={() => setErrorMsg('')}
        />
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Farmer Personal Details */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl space-y-6">
          <div className="flex items-center space-x-2 text-emerald-400 border-b border-slate-800 pb-3">
            <UserPlus className="w-5 h-5" />
            <h3 className="font-bold text-white text-base font-kannada">
              1. ವೈಯಕ್ತಿಕ ಮತ್ತು ಸ್ಥಳದ ವಿವರ (Personal & Location Details)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-kannada">
                ರೈತರ ಪೂರ್ಣ ಹೆಸರು (Full Name) *
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="ಉದಾ: ಬಸವರಾಜ್ ಗೌಡ (Basavaraj Gowda)"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:outline-none text-white text-sm font-kannada"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-kannada">
                ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (Mobile Number) *
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                value={formData.phone_number}
                onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="10-ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:outline-none text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-kannada">
                ಜಿಲ್ಲೆ (District) *
              </label>
              <select
                value={formData.district}
                onChange={handleDistrictChange}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:outline-none text-white text-sm font-kannada"
              >
                {KARNATAKA_DISTRICTS.map(d => (
                  <option key={d.en} value={d.en}>
                    {d.kn} ({d.en})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-kannada">
                ತಾಲೂಕು (Taluk)
              </label>
              <input
                type="text"
                value={formData.taluk}
                onChange={e => setFormData({ ...formData, taluk: e.target.value })}
                placeholder="ಉದಾ: ಮದ್ದೂರು (Maddur)"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:outline-none text-white text-sm font-kannada"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-kannada">
                ಗ್ರಾಮ (Village)
              </label>
              <input
                type="text"
                value={formData.village}
                onChange={e => setFormData({ ...formData, village: e.target.value })}
                placeholder="ಉದಾ: ಬೆಸಗರಹಳ್ಳಿ (Besagarahalli)"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:outline-none text-white text-sm font-kannada"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-kannada">
                ಜಾತಿ ವರ್ಗ (Caste Category) *
              </label>
              <select
                value={formData.caste_category}
                onChange={e => setFormData({ ...formData, caste_category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:outline-none text-white text-sm font-kannada"
              >
                <option value="General">ಸಾಮಾನ್ಯ ವರ್ಗ (General)</option>
                <option value="OBC">ಹಿಂದುಳಿದ ವರ್ಗ (OBC)</option>
                <option value="SC">ಪರಿಶಿಷ್ಟ ಜಾತಿ (SC)</option>
                <option value="ST">ಪರಿಶಿಷ್ಟ ಪಂಗಡ (ST)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-kannada">
                ಕುಟುಂಬದ ವಾರ್ಷಿಕ ಆದಾಯ (Annual Income ₹)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.annual_income}
                onChange={e => setFormData({ ...formData, annual_income: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:outline-none text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-kannada">
                FRUITS ಗುರುತಿನ ಸಂಖ್ಯೆ (FID - ಐಚ್ಛಿಕ)
              </label>
              <input
                type="text"
                value={formData.fruits_id}
                onChange={e => setFormData({ ...formData, fruits_id: e.target.value })}
                placeholder="ಉದಾ: KA-2024-FR-98214"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:outline-none text-white text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Landholding & Irrigation */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl space-y-6">
          <div className="flex items-center space-x-2 text-emerald-400 border-b border-slate-800 pb-3">
            <LandPlot className="w-5 h-5" />
            <h3 className="font-bold text-white text-base font-kannada">
              2. ಕೃಷಿ ಜಮೀನು ಮತ್ತು ನೀರಾವರಿ ವಿವರ (Landholding & Irrigation)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-kannada">
                ಒಟ್ಟು ಜಮೀನು (ಎಕರೆಗಳಲ್ಲಿ / Acres) *
              </label>
              <input
                type="number"
                required
                step="0.1"
                min="0.1"
                value={formData.total_land_acres}
                onChange={e => setFormData({ ...formData, total_land_acres: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:outline-none text-white text-sm"
              />
              <span className="text-[11px] text-emerald-400 font-semibold font-kannada mt-1 block">
                ವರ್ಗ: {computedCategoryKn}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-kannada">
                ಮಣ್ಣಿನ ಮಾದರಿ (Soil Type)
              </label>
              <select
                value={formData.soil_type}
                onChange={e => setFormData({ ...formData, soil_type: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:outline-none text-white text-sm font-kannada"
              >
                <option value="Red Loamy">ಕೆಂಪು ಮಣ್ಣು (Red Loamy)</option>
                <option value="Black Cotton">ಕಪ್ಪು ಹತ್ತಿ ಮಣ್ಣು (Black Cotton)</option>
                <option value="Sandy Loam">ಮರಳು ಮಿಶ್ರಿತ (Sandy Loam)</option>
                <option value="Laterite">ಲ್ಯಾಟರೈಟ್ / ಜಂಬಿಟ್ಟಿಗೆ ಮಣ್ಣು</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-kannada">
                ನೀರಾವರಿ ಸೌಲಭ್ಯ (Irrigation Source) *
              </label>
              <select
                value={formData.irrigation_type}
                onChange={e => setFormData({ ...formData, irrigation_type: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:outline-none text-white text-sm font-kannada"
              >
                <option value="Rainfed">ಮಳೆಯಾಶ್ರಿತ ಒಣಭೂಮಿ (Rainfed)</option>
                <option value="Canal">ಕಾಲುವೆ ನೀರಾವರಿ (Canal)</option>
                <option value="Borewell">ಬೋರ್‌ವೆಲ್ ನೀರಾವರಿ (Borewell)</option>
                <option value="Drip">ಹನಿ ನೀರಾವರಿ (Drip)</option>
                <option value="Sprinkler">ತುಂತುರು ನೀರಾವರಿ (Sprinkler)</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.has_borewell}
                onChange={e => setFormData({ ...formData, has_borewell: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
              />
              <span className="text-xs text-slate-300 font-kannada">
                ಜಮೀನಿನಲ್ಲಿ ಈ ಮೊದಲೇ ಕೊರೆಸಿದ ಚಾಲ್ತಿ ಬೋರ್‌ವೆಲ್ ಸೌಲಭ್ಯವಿದೆಯೇ? (Existing Borewell)
              </span>
            </label>
          </div>
        </div>

        {/* Section 3: Seasonal Crops */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-emerald-400">
              <Sprout className="w-5 h-5" />
              <h3 className="font-bold text-white text-base font-kannada">
                3. ಬೆಳೆಯುತ್ತಿರುವ ಬೆಳೆಗಳ ವಿವರ (Cultivated Crops)
              </h3>
            </div>
            <button
              type="button"
              onClick={handleAddCrop}
              className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-xs font-semibold flex items-center space-x-1 font-kannada"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ಇನ್ನೊಂದು ಬೆಳೆ ಸೇರಿಸಿ</span>
            </button>
          </div>

          <div className="space-y-4">
            {crops.map((crop, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 font-kannada">ಬೆಳೆ (Crop)</label>
                  <select
                    value={crop.crop_name}
                    onChange={e => handleCropFieldChange(idx, 'crop_name', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-kannada"
                  >
                    {COMMON_CROPS.map(c => (
                      <option key={c.en} value={c.en}>{c.kn} ({c.en})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 font-kannada">ಬೆಳೆಯುವ ಜಮೀನು (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={crop.acres}
                    onChange={e => handleCropFieldChange(idx, 'acres', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 font-kannada">ಋತು (Season)</label>
                  <select
                    value={crop.season}
                    onChange={e => handleCropFieldChange(idx, 'season', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-kannada"
                  >
                    <option value="Kharif">ಮುಂಗಾರು / ಖಾರಿಫ್ (Kharif)</option>
                    <option value="Rabi">ಹಿಂಗಾರು / ರಬಿ (Rabi)</option>
                    <option value="Summer">ಬೇಸಿಗೆ (Summer)</option>
                    <option value="Annual">ವಾರ್ಷಿಕ (Annual)</option>
                  </select>
                </div>

                <div className="flex items-end justify-between sm:justify-end space-x-2 pt-2 sm:pt-4">
                  <span className="text-[11px] px-2 py-1 rounded bg-slate-800 text-emerald-400 font-mono">
                    {crop.crop_category}
                  </span>
                  {crops.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCrop(idx)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/50"
                      title="Delete crop"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <p className="text-xs text-slate-400 font-kannada">
            * ಕಡ್ಡಾಯವಾಗಿ ನಮೂದಿಸಬೇಕಾದ ವಿವರಗಳು.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-sm shadow-xl shadow-emerald-700/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="font-kannada">ದಾಖಲಿಸಲಾಗುತ್ತಿದೆ...</span>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span className="font-kannada">ರೈತರ ವಿವರ ದಾಖಲಿಸಿ (Complete Registration)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
