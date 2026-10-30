const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      success: false,
      data: null,
      message: 'Backend connection failed',
      error: err.message
    };
  }
}

export async function sendChatMessage(sessionId, message, farmerId = null) {
  const res = await fetch(`${API_BASE_URL}/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      message: message,
      farmer_id: farmerId
    })
  });
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  return await res.json();
}

export async function processVoiceTurn(sessionId, transcriptKannada, farmerId = null) {
  const res = await fetch(`${API_BASE_URL}/voice/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      transcript_kannada: transcriptKannada,
      farmer_id: farmerId
    })
  });
  if (!res.ok) throw new Error(`Voice service returned ${res.status}`);
  return await res.json();
}

export async function processVoiceAudio(sessionId, audioBase64, audioFormat, farmerId = null) {
  const res = await fetch(`${API_BASE_URL}/voice/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      audio_base64: audioBase64,
      audio_format: audioFormat,
      farmer_id: farmerId
    })
  });
  if (!res.ok) throw new Error(`Voice transcription unavailable (${res.status}); type your message instead.`);
  return await res.json();
}

export async function fetchVoiceAudio(audioUrl) {
  const apiOrigin = new URL(API_BASE_URL, window.location.origin).origin;
  const audioEndpoint = new URL(audioUrl, apiOrigin);
  const res = await fetch(audioEndpoint);
  if (!res.ok) throw new Error(`Kannada audio request failed (${res.status})`);
  if (!res.headers.get('content-type')?.toLowerCase().startsWith('audio/')) {
    throw new Error('Voice service returned a non-audio response');
  }
  return URL.createObjectURL(await res.blob());
}

export async function getSchemes(category = null) {
  const url = category ? `${API_BASE_URL}/schemes?category=${encodeURIComponent(category)}` : `${API_BASE_URL}/schemes`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load schemes: ${res.status}`);
  return await res.json();
}

export async function recommendSchemes(farmerId = null, profile = null) {
  const res = await fetch(`${API_BASE_URL}/schemes/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      farmer_id: farmerId,
      profile: profile
    })
  });
  if (!res.ok) throw new Error(`Recommendation error: ${res.status}`);
  return await res.json();
}

export async function checkEligibility(farmerId, schemeId = null) {
  const res = await fetch(`${API_BASE_URL}/schemes/check-eligibility`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      farmer_id: farmerId,
      scheme_id: schemeId
    })
  });
  if (!res.ok) throw new Error(`Eligibility error: ${res.status}`);
  return await res.json();
}

export async function registerFarmer(farmerData) {
  const res = await fetch(`${API_BASE_URL}/farmers/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(farmerData)
  });
  if (!res.ok) throw new Error(`Registration error: ${res.status}`);
  return await res.json();
}

export async function getFarmerProfile(farmerId) {
  const res = await fetch(`${API_BASE_URL}/farmers/${farmerId}`);
  if (!res.ok) throw new Error(`Failed to load farmer: ${res.status}`);
  return await res.json();
}

export async function getFarmers() {
  const res = await fetch(`${API_BASE_URL}/farmers`);
  if (!res.ok) throw new Error(`Failed to load farmer list: ${res.status}`);
  return await res.json();
}
