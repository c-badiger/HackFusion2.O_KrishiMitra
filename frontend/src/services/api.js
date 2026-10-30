const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

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

export async function processVoiceTurn(sessionId, transcriptKannada, farmerId = null) {
  const res = await fetch(`${API_BASE_URL}/voice/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      farmer_id: farmerId,
      transcript_kannada: transcriptKannada
    })
  });
  if (!res.ok) throw new Error(`Server returned ${res.status}`);
  return await res.json();
}

export async function getSchemes(category = null) {
  const url = category ? `${API_BASE_URL}/schemes?category=${encodeURIComponent(category)}` : `${API_BASE_URL}/schemes`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load schemes: ${res.status}`);
  return await res.json();
}

export async function evaluateEligibility(farmerId) {
  const res = await fetch(`${API_BASE_URL}/eligibility/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ farmer_id: farmerId })
  });
  if (!res.ok) throw new Error(`Eligibility error: ${res.status}`);
  return await res.json();
}

export async function getFarmersList() {
  const res = await fetch(`${API_BASE_URL}/farmers`);
  if (!res.ok) throw new Error(`Failed to load farmers: ${res.status}`);
  return await res.json();
}
