import { io } from 'socket.io-client';

let socketRef = null;

export const getSocket = () => socketRef;

export const connectSocket = () => {
  if (socketRef) return socketRef;
  socketRef = io({ withCredentials: true });
  return socketRef;
};

export const disconnectSocket = () => {
  if (socketRef) {
    socketRef.disconnect();
    socketRef = null;
  }
};
