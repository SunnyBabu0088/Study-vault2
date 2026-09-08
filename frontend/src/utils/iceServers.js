import { apiRequest } from '../api/client';

export const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

export async function fetchIceServers() {
  try {
    const data = await apiRequest('/api/calls/turn-credentials/');
    if (data && data.iceServers && Array.isArray(data.iceServers)) {
      return data.iceServers;
    }
  } catch (err) {
    console.warn('Failed to fetch TURN credentials, using default STUN servers:', err);
  }
  return DEFAULT_ICE_SERVERS;
}
