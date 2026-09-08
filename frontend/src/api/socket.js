import { io } from 'socket.io-client';
import { getApiBaseUrl } from './client';

let socketRef = null;

export const getSocket = () => socketRef;

export const connectSocket = () => {
  if (socketRef) return socketRef;
  const baseUrl = getApiBaseUrl();
  socketRef = baseUrl
    ? io(baseUrl, { withCredentials: true })
    : io({ withCredentials: true });
  return socketRef;
};

export const disconnectSocket = () => {
  if (socketRef) {
    socketRef.disconnect();
    socketRef = null;
  }
};
