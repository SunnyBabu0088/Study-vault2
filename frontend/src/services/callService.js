import { apiRequest } from '../api/client';

export const callService = {
  async getCallHistory(username) {
    try {
      const url = username ? `/api/calls/history/?username=${encodeURIComponent(username)}` : '/api/calls/history/';
      const data = await apiRequest(url);
      return data?.calls || [];
    } catch (err) {
      console.error('Failed to load call history:', err);
      return [];
    }
  },

  async getTurnCredentials() {
    try {
      const data = await apiRequest('/api/calls/turn-credentials/');
      return data?.iceServers || [];
    } catch (err) {
      console.warn('Failed to load TURN credentials:', err);
      return [];
    }
  },
};
