import { getApiBaseUrl } from '../api/client';

class CallSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Set();
    this.reconnectTimer = null;
    this.isConnecting = false;
  }

  getWebSocketUrl(username) {
    const apiBase = getApiBaseUrl();
    let protocol = 'ws:';
    let host = window.location.host;

    if (apiBase) {
      const url = new URL(apiBase);
      protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      host = url.host;
    } else {
      protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    }

    // Default to Django Channels port or relative host
    const userParam = username ? `?username=${encodeURIComponent(username)}` : '';
    return `${protocol}//${host}/ws/calls/${userParam}`;
  }

  connect(username) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = this.getWebSocketUrl(username);
    this.isConnecting = true;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        console.log('Call WebSocket connected to:', wsUrl);
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyListeners(data);
        } catch (err) {
          console.error('Error parsing WebSocket call message:', err);
        }
      };

      this.ws.onerror = (error) => {
        console.warn('Call WebSocket error:', error);
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        console.log('Call WebSocket disconnected');
        // Schedule auto-reconnect
        this.reconnectTimer = setTimeout(() => {
          if (username) this.connect(username);
        }, 5000);
      };
    } catch (err) {
      console.error('Failed to initialize WebSocket:', err);
      this.isConnecting = false;
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    console.warn('Call WebSocket is not connected. Message dropped:', data);
    return false;
  }

  addListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(data) {
    this.listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (err) {
        console.error('Listener callback error:', err);
      }
    });
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const callSocketService = new CallSocketService();
