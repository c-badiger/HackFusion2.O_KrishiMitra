import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Sprout, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  LandPlot, 
  Coins, 
  HelpCircle,
  ExternalLink,
  RefreshCw,
  Server,
  Sparkles
} from 'lucide-react';
import { checkBackendHealth, processVoiceTurn, getSchemes } from './services/api';

export default function App() {
  const [backendStatus, setBackendStatus] = useState({ checking: true, connected: false, message: '' });
  const [activeTab, setActiveTab] = useState('voice');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [assistantReply, setAssistantReply] = useState({
    kn: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಕೃಷಿ ಮಿತ್ರ. ನಿಮ್ಮ ಜಮೀನು ಮತ್ತು ಬೆಳೆಯ ವಿವರಗಳನ್ನು ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ ತಿಳಿಸಿ.',
    en: 'Namaskara! I am your Krishi Mitra assistant. Speak in Kannada to discover government welfare schemes.'
  });
  const [extractedSlots, setExtractedSlots] = useState({
    district_kn: 'ಮಂಡ್ಯ',
    district: 'Mandya',
    total_land_acres: 2.5,
    farmer_category: 'Small Farmer',
    irrigation_type: 'Rainfed (ಮಳೆಯಾಶ್ರಿತ)',
    caste_category: 'OBC',
    crops: ['ರಾಗಿ (Ragi)', 'ಕಬ್ಬು (Sugarcane)']
  });
  const [schemes, setSchemes] = useState([]);
  const [loadingVoice, setLoadingVoice] = useState(false);

  // Quick Voice Prompts for instant demonstration
  const quickPrompts = [
    {
      label: 'ಮಂಡ್ಯ - 2.5 ಎಕರೆ ರಾಗಿ ಬೆಳೆ',
      text: 'ನನ್ನ ಬಳಿ ಮಂಡ್ಯ ಜಿಲ್ಲೆಯಲ್ಲಿ 2.5 ಎಕರೆ ಜಮೀನು ಇದೆ, ನಾನು ರಾಗಿ ಬೆಳೆಯುತ್ತಿದ್ದೇನೆ.'
    },
    {
      label: 'ಧಾರವಾಡ - 4 ಎಕರೆ ಹತ್ತಿ ಬೆಳೆ',
      text: 'ಧಾರವಾಡದಲ್ಲಿ ನನಗೆ 4 ಎಕರೆ ಒಣಭೂಮಿ ಇದೆ, ಹತ್ತಿ ಮತ್ತು ಜೋಳ ಬೆಳೆಯುತ್ತೇನೆ.'
    },
    {
      label: 'ಬೋರ್‌ವೆಲ್ ಇಲ್ಲದ ಸಣ್ಣ ರೈತ (SC/ST)',
      text: 'ನಾನು ಪರಿಶಿಷ್ಟ ಜಾತಿಯ ಸಣ್ಣ ರೈತ, 2 ಎಕರೆ ಜಮೀನಿದೆ ಆದರೆ ಬೋರ್‌ವೆಲ್ ಇಲ್ಲ.'
    }
  ];

  useEffect(() => {
    pingBackend();
    loadSchemesCatalog();
  }, []);

  const pingBackend = async () => {
    setBackendStatus({ checking: true, connected: false, message: 'Connecting to port 8000...' });
    const res = await checkBackendHealth();
    if (res.success && res.data?.status === 'healthy') {
      setBackendStatus({
        checking: false,
        connected: true,
        message: `Connected: FastAPI (Port 8000) | DB: ${res.data.database_connected ? 'MySQL Active' : 'Fallback Engine'}`
      });
    } else {
      setBackendStatus({
        checking: false,
        connected: false,
        message: 'Backend Offline: Start backend on port 8000'
      });
    }
  };

  const loadSchemesCatalog = async () => {
    try {
      const res = await getSchemes();
      if (res.success && res.data) {
        setSchemes(res.data);
      }
    } catch {
      // schemes default to empty
    }
  };

  const handleSimulateVoice = async (promptText) => {
    setTranscript(promptText);
    setLoadingVoice(true);
    try {
      const res = await processVoiceTurn('demo-session-001', promptText);
      if (res.success && res.data) {
        setAssistantReply({
          kn: res.data.reply_kannada || res.data.assistant_reply_kannada,
          en: res.data.reply_english || res.data.assistant_reply_english
        });
        if (res.data.extracted_parameters) {
          const params = res.data.extracted_parameters;
          setExtractedSlots(prev => ({
            ...prev,
            district_kn: params.district_kn || prev.district_kn,
            district: params.district || prev.district,
            total_land_acres: params.total_land_acres !== null ? params.total_land_acres : prev.total_land_acres,
            irrigation_type: params.irrigation_type || prev.irrigation_type,
            caste_category: params.caste_category || prev.caste_category,
            crops: params.crops?.length ? params.crops.map(c => `${c.crop_name_kn} (${c.crop_name})`) : prev.crops
          }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVoice(false);
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      // Demo speech fallback simulation
      setTimeout(() => {
        setIsRecording(false);
        handleSimulateVoice('ನನ್ನ ಬಳಿ ಮಂಡ್ಯ ಜಿಲ್ಲೆಯಲ್ಲಿ 2.5 ಎಕರೆ ಜಮೀನು ಇದೆ, ನಾನು ರಾಗಿ ಬೆಳೆಯುತ್ತಿದ್ದೇನೆ.');
      }, 2500);
    } else {
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Top Banner Navigation */}
      <header className="border-b border-emerald-900/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/40">
              <Sprout className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold tracking-tight text-white font-kannada">ಕೃಷಿ ಮಿತ್ರ</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold tracking-wider">
                  KRISHI MITRA
                </span>
              </div>
              <p className="text-xs text-emerald-300/80 font-medium">Karnataka Voice-First Agricultural Scheme Assistant</p>
            </div>
          </div>

          {/* System Health Indicators */}
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              backendStatus.connected 
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
            }`}>
              <Server className="w-4 h-4" />
              <span>{backendStatus.message}</span>
              <button 
                onClick={pingBackend} 
                className="hover:rotate-180 transition-transform duration-500 text-slate-400 hover:text-white"
                title="Refresh Health"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-md bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              <span>Port: 5173</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-8 border-b border-emerald-900/30 pb-4">
          <button
            onClick={() => setActiveTab('voice')}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm flex items-center space-x-2 transition-all ${
              activeTab === 'voice'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/30'
                : 'bg-slate-900/50 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span className="font-kannada">ಧ್ವನಿ ಸಹಾಯಕ (Voice Assistant)</span>
          </button>

          <button
            onClick={() => setActiveTab('schemes')}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm flex items-center space-x-2 transition-all ${
              activeTab === 'schemes'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/30'
                : 'bg-slate-900/50 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="font-kannada">ಯೋಜನೆಗಳ ಪರಿಶೀಲನೆ (Schemes)</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm flex items-center space-x-2 transition-all ${
              activeTab === 'profile'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 border border-emerald-400/30'
                : 'bg-slate-900/50 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <LandPlot className="w-4 h-4" />
            <span className="font-kannada">ರೈತರ ವಿವರ (Profile Matrix)</span>
          </button>
        </div>

        {/* Tab 1: Voice Assistant & Rule Evaluation */}
        {activeTab === 'voice' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Voice Interaction Studio */}
            <div className="lg:col-span-7 space-y-6">
              <div className="glass-panel p-6 sm:p-8 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white font-kannada">ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ (Speak in Kannada)</h2>
                    <p className="text-xs text-slate-400 mt-1">Tap the mic to talk or test with real farm scenarios below.</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    Web Speech Engine
                  </span>
                </div>

                {/* Voice Record Sphere */}
                <div className="flex flex-col items-center justify-center py-6">
                  <button
                    onClick={toggleRecording}
                    className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 ${
                      isRecording
                        ? 'bg-rose-600 text-white voice-recording-pulse'
                        : 'bg-gradient-to-tr from-emerald-600 to-green-500 text-white shadow-xl shadow-emerald-600/30 border-2 border-emerald-300/40'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-12 h-12" /> : <Mic className="w-12 h-12" />}
                  </button>
                  <p className="text-sm text-slate-300 mt-4 font-kannada">
                    {isRecording ? 'ಧ್ವನಿ ಸ್ವೀಕರಿಸಲಾಗುತ್ತಿದೆ... (Listening...)' : 'ಧ್ವನಿ ಆರಂಭಿಸಲು ಮೈಕ್ ಒತ್ತಿ (Press to Speak)'}
                  </p>
                </div>

                {/* Transcript Display */}
                {transcript && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-semibold">ರೈತರ ಧ್ವನಿ (Your Voice):</p>
                    <p className="text-emerald-300 font-medium font-kannada text-base">"{transcript}"</p>
                  </div>
                )}

                {/* Assistant Spoken Response Box */}
                <div className="mt-6 p-5 rounded-xl glass-panel-emerald border border-emerald-500/30">
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">ಕೃಷಿ ಮಿತ್ರ ಪ್ರತಿಕ್ರಿಯೆ (Assistant Response)</span>
                  </div>
                  <p className="text-white text-base leading-relaxed font-kannada mb-2 font-medium">
                    {assistantReply.kn}
                  </p>
                  <p className="text-xs text-emerald-200/70 border-t border-emerald-800/40 pt-2 italic">
                    {assistantReply.en}
                  </p>
                </div>

                {/* Simulated Audio Prompts */}
                <div className="mt-6 pt-6 border-t border-slate-800">
                  <p className="text-xs font-semibold text-slate-400 mb-3">ಪೂರ್ವಸಿದ್ಧ ಧ್ವನಿ ಸನ್ನಿವೇಶಗಳು (Quick Demonstration Prompts):</p>
                  <div className="flex flex-wrap gap-2">
                    {quickPrompts.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => handleSimulateVoice(p.text)}
                        disabled={loadingVoice}
                        className="text-xs px-3 py-2 rounded-lg bg-slate-900 hover:bg-emerald-950/60 hover:text-emerald-300 border border-slate-800 hover:border-emerald-700/50 transition-all font-kannada"
                      >
                        🗣️ {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Rule Engine Output & Extracted Context */}
            <div className="lg:col-span-5 space-y-6">
              {/* Agricultural Profile Slots */}
              <div className="glass-panel p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-white flex items-center space-x-2">
                    <LandPlot className="w-4 h-4 text-emerald-400" />
                    <span className="font-kannada">ಕೃಷಿ ಮಾಹಿತಿ (Extracted Farm Profile)</span>
                  </h3>
                  <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                    Slot Filling
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-xs text-slate-400 block font-kannada">ಜಿಲ್ಲೆ (District):</span>
                    <span className="font-semibold text-white font-kannada">{extractedSlots.district_kn} ({extractedSlots.district})</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-xs text-slate-400 block font-kannada">ಜಮೀನು (Holding):</span>
                    <span className="font-semibold text-white font-kannada">{extractedSlots.total_land_acres} ಎಕರೆ ({extractedSlots.farmer_category})</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-xs text-slate-400 block font-kannada">ನೀರಾವರಿ (Irrigation):</span>
                    <span className="font-semibold text-white font-kannada">{extractedSlots.irrigation_type}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-xs text-slate-400 block font-kannada">ವರ್ಗ (Category):</span>
                    <span className="font-semibold text-white font-kannada">{extractedSlots.caste_category}</span>
                  </div>
                </div>

                <div className="mt-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1 font-kannada">ಬೆಳೆಗಳು (Cultivated Crops):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {extractedSlots.crops.map((c, i) => (
                      <span key={i} className="text-xs bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 px-2.5 py-1 rounded-md font-kannada font-medium">
                        🌾 {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Verified Qualifying Schemes */}
              <div className="glass-panel p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-white flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-kannada">ಅರ್ಹ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು (Eligible Schemes)</span>
                  </h3>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                    Rule Engine
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30 hover:border-emerald-500/60 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-white text-sm font-kannada">ರೈತ ಸಿರಿ ಯೋಜನೆ (Raitha Siri)</h4>
                        <p className="text-xs text-emerald-400 font-medium mt-0.5 font-kannada">₹10,000 / ಹೆಕ್ಟೇರ್ ಪ್ರೋತ್ಸಾಹಧನ</p>
                      </div>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-medium">
                        100% Match
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-2 font-kannada">
                      ✓ ನೀವು ರಾಗಿ ಬೆಳೆಯುತ್ತಿದ್ದೀರಿ (ಸಿರಿಧಾನ್ಯ ವರ್ಗ)
                    </p>
                    <p className="text-xs text-slate-300 font-kannada">
                      ✓ ಸಣ್ಣ ಹಿಡುವಳಿದಾರರ ವ್ಯಾಪ್ತಿಗೆ ಬರುತ್ತೀರಿ (2.5 ಎಕರೆ)
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-white text-sm font-kannada">ಕೃಷಿ ಭಾಗ್ಯ ಯೋಜನೆ (Krishi Bhagya)</h4>
                        <p className="text-xs text-emerald-400 font-medium mt-0.5 font-kannada">80% ಕೃಷಿ ಹೊಂಡ ಸಬ್ಸಿಡಿ</p>
                      </div>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-medium">
                        100% Match
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-2 font-kannada">
                      ✓ ಮಳೆಯಾಶ್ರಿತ / ಒಣಭೂಮಿ ಪ್ರದೇಶದಲ್ಲಿ ಜಮೀನಿದೆ
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-white text-sm font-kannada">ಪಿಎಂ-ಕಿಸಾನ್ (PM-KISAN)</h4>
                        <p className="text-xs text-emerald-400 font-medium mt-0.5 font-kannada">₹6,000 ವಾರ್ಷಿಕ ಆರ್ಥಿಕ ನೆರವು</p>
                      </div>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-medium">
                        Direct Transfer
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-2 font-kannada">
                      ✓ ಸಾಗುವಳಿ ಭೂಮಾಲೀಕ ಅರ್ಹತೆ ದೃಢಪಟ್ಟಿದೆ
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Scheme Catalog */}
        {activeTab === 'schemes' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white font-kannada">ಕರ್ನಾಟಕ ಕೃಷಿ ಯೋಜನೆಗಳ ಪಟ್ಟಿ (Karnataka Agricultural Schemes Catalog)</h2>
              <p className="text-xs text-slate-400 mt-1">Verified statutory schemes with transparent rules and official portal links.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(schemes.length ? schemes : [
                {
                  id: 1,
                  name_kn: 'ರೈತ ಸಿರಿ ಯೋಜನೆ',
                  name_en: 'Raitha Siri Scheme',
                  department: 'Department of Agriculture, Karnataka',
                  category: 'Direct Benefit Transfer',
                  benefit_amount: '₹10,000 / ಹೆಕ್ಟೇರ್',
                  summary_kn: 'ಸಿರಿಧಾನ್ಯ ಬೆಳೆಯುವ ರೈತರಿಗೆ ಆರ್ಥಿಕ ಪ್ರೋತ್ಸಾಹಧನ.',
                  documents_kn: ['ಪಹಣಿ (RTC)', 'ಆಧಾರ್ ಕಾರ್ಡ್', 'ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್', 'FRUITS ID'],
                  portal: 'https://fruits.karnataka.gov.in'
                },
                {
                  id: 2,
                  name_kn: 'ಕೃಷಿ ಭಾಗ್ಯ ಯೋಜನೆ',
                  name_en: 'Krishi Bhagya Scheme',
                  department: 'Department of Agriculture, Karnataka',
                  category: 'Water Harvesting',
                  benefit_amount: '80% ರಿಂದ 90% ಸಹಾಯಧನ',
                  summary_kn: 'ಮಳೆಯಾಶ್ರಿತ ಪ್ರದೇಶಗಳ ರೈತರಿಗೆ ಕೃಷಿ ಹೊಂಡ, ಪಾಲಿಥೀನ್ ಹೊದಿಕೆ ಮತ್ತು ಪಂಪ್‌ಸೆಟ್‌ಗಳಿಗೆ ಸಬ್ಸಿಡಿ.',
                  documents_kn: ['ಪಹಣಿ (RTC)', 'ಆಧಾರ್ ಕಾರ್ಡ್', 'ಜಮೀನಿನ ನಕ್ಷೆ'],
                  portal: 'https://raitamitra.karnataka.gov.in'
                },
                {
                  id: 3,
                  name_kn: 'ಗಂಗಾ ಕಲ್ಯಾಣ ಯೋಜನೆ',
                  name_en: 'Ganga Kalyana Scheme',
                  department: 'Social Welfare & Backward Classes Dept',
                  category: 'Irrigation Infrastructure',
                  benefit_amount: 'ಉಚಿತ ಬೋರ್‌ವೆಲ್ ಸೌಲಭ್ಯ',
                  summary_kn: 'SC/ST ಮತ್ತು ಹಿಂದುಳಿದ ವರ್ಗಗಳ ಸಣ್ಣ ರೈತರಿಗೆ 100% ಉಚಿತ ಬೋರ್‌ವೆಲ್ ಮತ್ತು ವಿದ್ಯುತ್ ಸಂಪರ್ಕ.',
                  documents_kn: ['ಜಾತಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ', 'RTC (ಪಹಣಿ)', 'ಬೋರ್‌ವೆಲ್ ಇಲ್ಲದಿರುವ VAO ದೃಢೀಕರಣ'],
                  portal: 'https://kstdc.karnataka.gov.in'
                }
              ]).map((s, idx) => (
                <div key={idx} className="glass-panel p-6 rounded-2xl flex flex-col justify-between border border-slate-800 hover:border-emerald-500/40 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium">
                        {s.category || 'Agricultural Welfare'}
                      </span>
                      <span className="text-xs font-bold text-amber-400 font-kannada">{s.benefit_amount || s.benefit_amount_kn}</span>
                    </div>

                    <h3 className="text-lg font-bold text-white font-kannada mt-2">{s.name_kn}</h3>
                    <p className="text-xs text-slate-400 font-medium">{s.name_en}</p>
                    <p className="text-xs text-emerald-400/90 mt-1 font-kannada">{s.department || s.department_kn}</p>

                    <p className="text-xs text-slate-300 mt-3 leading-relaxed font-kannada">
                      {s.summary_kn}
                    </p>

                    {s.documents_kn && (
                      <div className="mt-4 pt-3 border-t border-slate-800/80">
                        <span className="text-[11px] font-semibold text-slate-400 block mb-1 font-kannada">ಅಗತ್ಯವಿರುವ ದಾಖಲೆಗಳು (Required Documents):</span>
                        <ul className="text-xs text-slate-300 space-y-1 font-kannada">
                          {s.documents_kn.map((doc, dIdx) => (
                            <li key={dIdx} className="flex items-center space-x-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              <span>{doc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {s.portal && (
                    <a
                      href={s.portal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 w-full inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-emerald-900/40 text-emerald-300 border border-slate-800 hover:border-emerald-600/40 text-xs font-semibold transition-all"
                    >
                      <span>ಅರ್ಜಿ ಪೋರ್ಟಲ್ (Apply Online)</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Profile Matrix */}
        {activeTab === 'profile' && (
          <div className="glass-panel p-8 rounded-2xl max-w-4xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white font-kannada">ರೈತರ ಪ್ರೊಫೈಲ್ ಮತ್ತು ಕೃಷಿ ದಾಖಲೆ (Farmer Profile Management)</h2>
              <p className="text-xs text-slate-400 mt-1">Rule engine evaluated agricultural profile attributes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <label className="text-xs text-slate-400 block mb-1 font-kannada">ರೈತರ ಪೂರ್ಣ ಹೆಸರು (Full Name):</label>
                <p className="font-semibold text-white font-kannada">ಬಸವರಾಜ್ ಗೌಡ (Basavaraj Gowda)</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <label className="text-xs text-slate-400 block mb-1 font-kannada">ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (Phone Number):</label>
                <p className="font-semibold text-white">98765 43210</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <label className="text-xs text-slate-400 block mb-1 font-kannada">FRUITS ಐಡಿ (Karnataka FID):</label>
                <p className="font-semibold text-emerald-400">KA-2024-FR-98214</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <label className="text-xs text-slate-400 block mb-1 font-kannada">ಜಿಲ್ಲೆ & ತಾಲೂಕು (District & Taluk):</label>
                <p className="font-semibold text-white font-kannada">ಮಂಡ್ಯ (Mandya), ಮದ್ದೂರು (Maddur)</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <label className="text-xs text-slate-400 block mb-1 font-kannada">ಒಟ್ಟು ಜಮೀನು (Holding Size):</label>
                <p className="font-semibold text-white font-kannada">2.5 ಎಕರೆ (ಸಣ್ಣ ರೈತರು / Small Farmer)</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <label className="text-xs text-slate-400 block mb-1 font-kannada">ನೀರಾವರಿ ವಿಧ (Irrigation Source):</label>
                <p className="font-semibold text-white font-kannada">ಮಳೆಯಾಶ್ರಿತ ಒಣಭೂಮಿ (Rainfed)</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-900/30 bg-slate-950/90 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
          <p className="font-kannada">
            🌾 ಕೃಷಿ ಮಿತ್ರ (Krishi Mitra) - 24-Hour Hackathon Foundation Architecture.
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Frontend: React (Port 5173) | Backend: FastAPI (Port 8000) | DB: MySQL (Port 3306)
          </p>
        </div>
      </footer>
    </div>
  );
}
