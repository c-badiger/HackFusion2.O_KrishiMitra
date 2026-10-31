import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Loader2,
  Sparkles, 
  LandPlot, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  Send, 
  HelpCircle,
  FileText
} from 'lucide-react';
import { fetchVoiceAudio, processVoiceAudio, processVoiceTurn } from '../services/api';
import AlertBanner from '../components/AlertBanner';
import StatutoryDisclaimer from '../components/StatutoryDisclaimer';

export default function AssistantPage({ activeFarmerId = null, onSelectScheme, initialPrompt = "" }) {
  const [sessionId] = useState(() => 'sess_' + Math.random().toString(36).substring(2, 9));
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioStatus, setAudioStatus] = useState('idle');
  const [eligibleSchemeCount, setEligibleSchemeCount] = useState(0);

  const [assistantReply, setAssistantReply] = useState({
    kn: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಕೃಷಿ ಮಿತ್ರ. ನಿಮ್ಮ ಜಮೀನಿನ ವಿಸ್ತೀರ್ಣ (ಎಕರೆ), ಬೆಳೆಯುತ್ತಿರುವ ಬೆಳೆ ಮತ್ತು ನೀರಾವರಿ ಬಗ್ಗೆ ಕನ್ನಡದಲ್ಲೇ ಮಾತನಾಡಿ ತಿಳಿಸಿ.',
    en: 'Namaskara! I am your Krishi Mitra assistant. Speak in Kannada to discover government welfare schemes.'
  });

  const [extractedSlots, setExtractedSlots] = useState({
    district_kn: null,
    district: null,
    total_land_acres: null,
    farmer_category: null,
    irrigation_type: null,
    caste_category: null,
    crops: []
  });

  const [quickReplies, setQuickReplies] = useState([
    'ನನ್ನ ಬಳಿ 2.5 ಎಕರೆ ಜಮೀನು ಇದೆ',
    'ರಾಗಿ ಮತ್ತು ಕಬ್ಬು ಬೆಳೆಯುತ್ತೇನೆ',
    'ಮಳೆಯಾಶ್ರಿತ ಒಣಭೂಮಿ'
  ]);

  const [recommendedSchemes, setRecommendedSchemes] = useState([]);
  const recognitionRef = useRef(null);
  const recorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioPlayerRef = useRef(null);
  const audioObjectUrlRef = useRef(null);

  // Quick preset voice scenarios for guaranteed offline demo resilience
  const presetScenarios = [
    {
      title: 'ಸನ್ನಿವೇಶ 1: ಮಂಡ್ಯ - 2.5 ಎಕರೆ ರಾಗಿ ಬೆಳೆ',
      text: 'ನನ್ನ ಬಳಿ ಮಂಡ್ಯ ಜಿಲ್ಲೆಯಲ್ಲಿ 2.5 ಎಕರೆ ಜಮೀನು ಇದೆ, ನಾನು ರಾಗಿ ಬೆಳೆಯುತ್ತಿದ್ದೇನೆ.'
    },
    {
      title: 'ಸನ್ನಿವೇಶ 2: ಧಾರವಾಡ - 4 ಎಕರೆ ಒಣಭೂಮಿ ಹತ್ತಿ',
      text: 'ಧಾರವಾಡದಲ್ಲಿ ನನಗೆ 4 ಎಕರೆ ಮಳೆಯಾಶ್ರಿತ ಜಮೀನಿದೆ, ಹತ್ತಿ ಮತ್ತು ಜೋಳ ಬೆಳೆಯುತ್ತೇನೆ.'
    },
    {
      title: 'ಸನ್ನಿವೇಶ 3: ಹಿಂದುಳಿದ ವರ್ಗ - ಬೋರ್‌ವೆಲ್ ರಹಿತ',
      text: 'ನಾನು ಹಿಂದುಳಿದ ವರ್ಗದ ಸಣ್ಣ ರೈತ, 2 ಎಕರೆ ಜಮೀನಿದೆ ಆದರೆ ಯಾವುದೇ ಬೋರ್‌ವೆಲ್ ಇಲ್ಲ.'
    }
  ];

  useEffect(() => {
    // Check browser speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognizer = new SpeechRecognition();
      recognizer.lang = 'kn-IN';
      recognizer.continuous = false;
      recognizer.interimResults = false;

      recognizer.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setIsRecording(false);
        handleSendTurn(text);
      };

      recognizer.onerror = (event) => {
        setIsRecording(false);
        if (event.error === 'network') {
          startAudioRecording();
        } else if (event.error !== 'no-speech') {
          setErrorMsg('ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ದೋಷ: ' + event.error);
        }
      };

      recognizer.onend = () => {
        if (recorderRef.current?.state !== 'recording') setIsRecording(false);
      };

      recognitionRef.current = recognizer;
    }

    if (initialPrompt) {
      handleSendTurn(initialPrompt);
    }
    return () => {
      audioPlayerRef.current?.pause();
      if (audioObjectUrlRef.current) URL.revokeObjectURL(audioObjectUrlRef.current);
    };
  }, [initialPrompt]);

  const toggleRecording = async () => {
    setErrorMsg('');
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      } else if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsRecording(true);
        } catch {
          await startAudioRecording();
        }
      } else {
        await startAudioRecording();
      }
    }
  };

  const startAudioRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setErrorMsg('ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ದಾಖಲಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಕನ್ನಡದಲ್ಲಿ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioStreamRef.current = stream;
      recorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = event => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const bytes = new Uint8Array(await audioBlob.arrayBuffer());
        let binary = '';
        bytes.forEach(byte => { binary += String.fromCharCode(byte); });
        const audioFormat = (recorder.mimeType.split('/')[1] || 'webm').split(';')[0];
        sendAudioTurn(btoa(binary), audioFormat);
      };
      recorder.start();
      setIsRecording(true);
    } catch {
      setErrorMsg('ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ಸಿಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಕನ್ನಡದಲ್ಲಿ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ.');
    }
  };

  const handleSendTurn = async (messageText) => {
    const textToSend = messageText || inputText;
    if (!textToSend.trim()) return;

    setTranscript(textToSend);
    setInputText('');
    setLoading(true);
    setErrorMsg('');
    setAudioStatus('generating');

    try {
      const res = await processVoiceTurn(sessionId, textToSend, activeFarmerId);
      applyVoiceResponse(res);
    } catch (err) {
      setErrorMsg('ಸರ್ವರ್ ಸಂಪರ್ಕ ದೋಷ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendAudioTurn = async (audioBase64, audioFormat) => {
    setLoading(true);
    setErrorMsg('');
    setAudioStatus('generating');
    try {
      const res = await processVoiceAudio(sessionId, audioBase64, audioFormat, activeFarmerId);
      applyVoiceResponse(res);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyVoiceResponse = (res) => {
      if (res.success && res.data) {
        audioPlayerRef.current?.pause();
        audioPlayerRef.current = null;
        if (audioObjectUrlRef.current) URL.revokeObjectURL(audioObjectUrlRef.current);
        audioObjectUrlRef.current = null;
        setIsSpeaking(false);
        if (res.data.transcript_kannada) setTranscript(res.data.transcript_kannada);
        setAssistantReply({
          kn: res.data.assistant_reply_kannada,
          en: res.data.assistant_reply_english
        });

        if (res.data.extracted_parameters) {
          const params = res.data.extracted_parameters;
          setExtractedSlots(prev => ({
            ...prev,
            district_kn: params.district_kn ?? prev.district_kn,
            district: params.district ?? prev.district,
            total_land_acres: params.total_land_acres ?? prev.total_land_acres,
            irrigation_type: params.irrigation_type ?? prev.irrigation_type,
            caste_category: params.caste_category ?? prev.caste_category,
            crops: params.crops?.length
              ? params.crops.map(c => `${c.crop_name_kn} (${c.crop_name})`)
              : prev.crops
          }));
        }

        if (res.data.quick_replies_kannada?.length) {
          setQuickReplies(res.data.quick_replies_kannada);
        }

        setRecommendedSchemes(res.data.matched_schemes || []);
        setEligibleSchemeCount(res.data.eligible_schemes_count || 0);

        if (res.data.tts_audio_url) {
          setAudioStatus('loading');
          playAssistantAudio(res.data.tts_audio_url);
        } else {
          setAudioStatus('unavailable');
        }
      } else {
        setAudioStatus('unavailable');
        setErrorMsg('ಪ್ರತಿಕ್ರಿಯೆ ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.');
      }
  };

  const playAssistantAudio = async (audioUrl, replay = false) => {
    setAudioStatus('loading');
    setAudioLoading(true);
    try {
      let player = audioPlayerRef.current;
      if (!replay || !player || !audioObjectUrlRef.current) {
        const objectUrl = await fetchVoiceAudio(audioUrl);
        player?.pause();
        if (audioObjectUrlRef.current) URL.revokeObjectURL(audioObjectUrlRef.current);
        audioObjectUrlRef.current = objectUrl;
        player = new Audio(objectUrl);
        audioPlayerRef.current = player;
      }

      player.onplay = () => {
        setIsSpeaking(true);
        setAudioStatus('speaking');
      };
      player.onended = () => {
        setIsSpeaking(false);
        setAudioStatus('ready');
      };
      player.onerror = () => {
        setIsSpeaking(false);
        setAudioStatus('error');
      };
      player.currentTime = 0;
      await player.play();
    } catch (error) {
      setIsSpeaking(false);
      setAudioStatus(error.name === 'NotAllowedError' ? 'blocked' : 'error');
    } finally {
      setAudioLoading(false);
    }
  };

  const stopSpeaking = () => {
    audioPlayerRef.current?.pause();
    setIsSpeaking(false);
    setAudioStatus('ready');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <Mic className="w-3.5 h-3.5" />
            <span className="font-kannada">ಕನ್ನಡ ಧ್ವನಿ ಸಂಭಾಷಣೆ ಸ್ಟುಡಿಯೋ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-kannada mt-2">
            ಕೃಷಿ ಮಿತ್ರ ಧ್ವನಿ ಸಹಾಯಕ (Kannada AI Assistant)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-kannada">
            ನಿಮ್ಮ ಜಮೀನಿನ ಮಾಹಿತಿ ಮಾತನಾಡಿ; ನೈಜ ಸಮಯದ ನಿಯಮ ಎಂಜಿನ್ ನಿಮಗೆ ಅರ್ಹ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕುತ್ತದೆ.
          </p>
        </div>

        <span className="text-xs px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300 font-mono">
          Session: {sessionId}
        </span>
      </div>

      {errorMsg && (
        <AlertBanner 
          type="error"
          title="ದೋಷ"
          message={errorMsg}
          onClose={() => setErrorMsg('')}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-emerald-900/40">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-kannada">Voice status</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-base font-black text-white font-kannada">{speechSupported ? 'Kannada ready' : 'Fallback mode'}</span>
            <span className={`w-2.5 h-2.5 rounded-full ${speechSupported ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          </div>
        </div>
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-kannada">Eligible schemes</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-2xl font-black text-white font-kannada">{eligibleSchemeCount}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-kannada">Crops detected</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-2xl font-black text-white font-kannada">{extractedSlots.crops.length}</span>
            <LandPlot className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Voice Sphere & Chat Interface */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-emerald-900/40">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Microphone Interaction Hero */}
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <button
                onClick={toggleRecording}
                className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-2xl ${
                  isRecording
                    ? 'bg-rose-600 text-white voice-recording-pulse border-4 border-rose-300'
                    : 'bg-gradient-to-tr from-emerald-600 via-green-500 to-emerald-400 text-white shadow-emerald-500/30 border-4 border-emerald-300/40'
                }`}
                title={isRecording ? 'ನಿಲ್ಲಿಸಲು ಒತ್ತಿ' : 'ಮಾತನಾಡಲು ಒತ್ತಿ'}
              >
                {isRecording ? <MicOff className="w-12 h-12" /> : <Mic className="w-12 h-12" />}
              </button>

              <p className="text-sm font-bold text-white mt-4 font-kannada">
                {isRecording ? 'ಧ್ವನಿ ಆಲಿಸಲಾಗುತ್ತಿದೆ... (Listening in Kannada)' : 'ಮಾತನಾಡಲು ಮೈಕ್ ಒತ್ತಿ (Tap to Speak)'}
              </p>
              <p className="text-xs text-slate-400 mt-1 font-kannada">
                {speechSupported ? 'ಕನ್ನಡ ಮಾತುಗಳನ್ನು ನೈಜ ಸಮಯದಲ್ಲಿ ಗ್ರಹಿಸುತ್ತದೆ' : 'ಮೈಕ್ರೊಫೋನ್ ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆಗೆ ಬಳಸಲಾಗುತ್ತದೆ'}
              </p>
            </div>

            {/* Farmer Utterance Bubble */}
            {transcript && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-kannada">
                  ರೈತರ ಮಾತು (Your Utterance):
                </span>
                <p className="text-emerald-300 font-semibold font-kannada text-sm leading-relaxed">
                  "{transcript}"
                </p>
              </div>
            )}

            {/* Assistant Voice Reply Bubble */}
            <div className="mt-6 p-5 rounded-2xl glass-panel-emerald border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider font-kannada">
                    ಕೃಷಿ ಮಿತ್ರ ಧ್ವನಿ ಪ್ರತಿಕ್ರಿಯೆ (Assistant Response)
                  </span>
                </div>

                {audioLoading || audioStatus === 'generating' ? (
                  <span className="text-xs text-emerald-300 font-kannada flex items-center gap-1.5" role="status">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> ಧ್ವನಿ ಸಿದ್ಧವಾಗುತ್ತಿದೆ...
                  </span>
                ) : isSpeaking ? (
                  <button 
                    onClick={stopSpeaking}
                    className="p-1 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-700 text-xs flex items-center space-x-1 font-kannada"
                    title="ಧ್ವನಿ ನಿಲ್ಲಿಸಿ"
                  >
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>ನಿಲ್ಲಿಸಿ</span>
                  </button>
                ) : audioObjectUrlRef.current ? (
                  <button 
                    onClick={() => playAssistantAudio('', true)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-700 text-xs"
                    title="ಉತ್ತರವನ್ನು ಮತ್ತೆ ಕೇಳಿ"
                    aria-label="ಉತ್ತರವನ್ನು ಮತ್ತೆ ಕೇಳಿ"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                ) : <span className="text-xs text-slate-400 font-kannada">ಪಠ್ಯ ಉತ್ತರ ಲಭ್ಯವಿದೆ</span>}
              </div>

              {audioStatus === 'blocked' && (
                <p className="text-xs text-amber-300 font-kannada" role="status">ಸ್ವಯಂಚಾಲಿತ ಪ್ಲೇಬ್ಯಾಕ್ ತಡೆಯಲಾಗಿದೆ. ಮತ್ತೆ ಕೇಳಲು ಧ್ವನಿ ಬಟನ್ ಒತ್ತಿ.</p>
              )}
              {audioStatus === 'error' && (
                <p className="text-xs text-amber-300 font-kannada" role="status">ಧ್ವನಿ ಪ್ಲೇ ಆಗಲಿಲ್ಲ. ಪಠ್ಯ ಉತ್ತರ ಕೆಳಗೆ ಲಭ್ಯವಿದೆ.</p>
              )}
              {audioStatus === 'unavailable' && (
                <p className="text-xs text-slate-400 font-kannada" role="status">ಧ್ವನಿ ಸೇವೆ ಲಭ್ಯವಿಲ್ಲ; ಪಠ್ಯ ಉತ್ತರ ಬಳಸಿ.</p>
              )}

              <p className="text-white text-base leading-relaxed font-kannada font-medium">
                {assistantReply.kn}
              </p>
              <p className="text-xs text-emerald-200/70 pt-2 border-t border-emerald-800/40 italic">
                {assistantReply.en}
              </p>
            </div>

            {/* Quick Reply Pills */}
            {quickReplies.length > 0 && (
              <div className="mt-5 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 block font-kannada">
                  ತ್ವರಿತ ಪ್ರತಿಕ್ರಿಯೆಗಳು (Tap to Reply):
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((qr, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendTurn(qr)}
                      disabled={loading}
                      className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-950/60 text-emerald-300 border border-slate-800 hover:border-emerald-600/40 transition-all font-kannada font-medium"
                    >
                      💬 {qr}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Text Input Bar */}
            <div className="mt-6 pt-5 border-t border-slate-800 flex items-center space-x-2">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSendTurn(); }}
                placeholder="ಕನ್ನಡದಲ್ಲಿ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:outline-none text-white text-xs sm:text-sm font-kannada"
              />
              <button
                onClick={() => handleSendTurn()}
                disabled={loading || !inputText.trim()}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all disabled:opacity-50"
              >
                <span>ಕಳುಹಿಸಿ</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Guaranteed Preset Scenarios */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300 block font-kannada">
              🎯 ಪೂರ್ವಸಿದ್ಧ ಧ್ವನಿ ಸನ್ನಿವೇಶಗಳು (Instant Scenario Test):
            </span>
            <div className="space-y-2">
              {presetScenarios.map((sc, scIdx) => (
                <button
                  key={scIdx}
                  onClick={() => handleSendTurn(sc.text)}
                  disabled={loading}
                  className="w-full text-left p-3 rounded-xl bg-slate-900/80 hover:bg-emerald-950/50 border border-slate-800 hover:border-emerald-600/40 transition-all font-kannada flex items-center justify-between text-xs"
                >
                  <span className="text-white font-medium">{sc.title}</span>
                  <span className="text-emerald-400 font-semibold text-[11px] shrink-0 ml-2">ಪ್ಲೇ ಮಾಡಿ →</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Slot Filling Matrix & Matched Schemes */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Extracted Slots Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-emerald-400">
                <LandPlot className="w-5 h-5" />
                <h3 className="font-bold text-white text-base font-kannada">
                  ಗುರುತಿಸಲಾದ ಕೃಷಿ ವಿವರ (Extracted Slots)
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono">
                Real-time NLU
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block font-kannada">ಜಿಲ್ಲೆ (District):</span>
                <span className="font-bold text-white font-kannada text-sm mt-0.5 block">
                  {extractedSlots.district_kn && extractedSlots.district
                    ? `${extractedSlots.district_kn} (${extractedSlots.district})`
                    : 'ಇನ್ನೂ ಮಾಹಿತಿ ಇಲ್ಲ'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block font-kannada">ಜಮೀನು (Holding):</span>
                <span className="font-bold text-white font-kannada text-sm mt-0.5 block">
                  {extractedSlots.total_land_acres == null ? 'ಇನ್ನೂ ಮಾಹಿತಿ ಇಲ್ಲ' : `${extractedSlots.total_land_acres} ಎಕರೆ`}
                </span>
                <span className="text-[10px] text-emerald-400 block">
                  {extractedSlots.farmer_category || ''}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block font-kannada">ನೀರಾವರಿ (Irrigation):</span>
                <span className="font-bold text-white font-kannada text-sm mt-0.5 block">
                  {extractedSlots.irrigation_type || 'ಇನ್ನೂ ಮಾಹಿತಿ ಇಲ್ಲ'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block font-kannada">ಜಾತಿ ವರ್ಗ (Category):</span>
                <span className="font-bold text-white font-kannada text-sm mt-0.5 block">
                  {extractedSlots.caste_category || 'ಇನ್ನೂ ಮಾಹಿತಿ ಇಲ್ಲ'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <span className="text-slate-400 text-xs block font-kannada">ಬೆಳೆಗಳು (Cultivated Crops):</span>
              <div className="flex flex-wrap gap-1.5">
                {extractedSlots.crops.map((c, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 font-kannada font-semibold">
                    🌾 {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Matched Schemes in Real-Time */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-bold text-white text-base font-kannada">
                  ಹೊಂದಾಣಿಕೆಯಾದ ಯೋಜನೆಗಳು (Eligible Schemes)
                </h3>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                {eligibleSchemeCount} Matches
              </span>
            </div>

            <div className="space-y-3">
              {recommendedSchemes.map((s, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-white text-xs sm:text-sm font-kannada">{s.name_kn}</h4>
                      <p className="text-[11px] text-amber-300 font-semibold font-kannada">{s.benefit_amount_kn}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                      {s.match_score}% Match
                    </span>
                  </div>

                  <ul className="text-[11px] text-slate-300 font-kannada space-y-0.5 pt-1">
                    {s.qualification_reasons_kn?.map((r, rIdx) => (
                      <li key={rIdx} className="flex items-center space-x-1">
                        <span className="text-emerald-400">✓</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => onSelectScheme(s.scheme_id)}
                    className="mt-2 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 font-kannada"
                  >
                    <span>ಅಧಿಕೃತ ನಿಯಮಾವಳಿ ನೋಡಿ</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {recommendedSchemes.length === 0 && (
                <p className="text-sm text-slate-400 font-kannada">
                  ಇನ್ನೂ ದೃಢಪಟ್ಟ ಅರ್ಹ ಯೋಜನೆಗಳಿಲ್ಲ. ಹೆಚ್ಚಿನ ವಿವರಗಳನ್ನು ಹಂಚಿಕೊಂಡಂತೆ ನಿಯಮ ಎಂಜಿನ್ ಪರಿಶೀಲಿಸುತ್ತದೆ.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Statutory Notice */}
      <StatutoryDisclaimer />
    </div>
  );
}
