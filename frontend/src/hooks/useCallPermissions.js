import { useState, useCallback } from 'react';

export function useCallPermissions() {
  const [permissionError, setPermissionError] = useState(null);

  const requestPermissions = useCallback(async (callType = 'voice') => {
    setPermissionError(null);
    const needVideo = callType === 'video';
    const constraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: needVideo
        ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          }
        : false,
    };

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices access is not supported on your browser or requires HTTPS connection.');
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return { stream, error: null };
    } catch (err) {
      let message = 'Failed to access media devices.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = needVideo
          ? 'Camera and microphone access are required for video calls.'
          : 'Microphone access is required for voice calls.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = needVideo ? 'No camera or microphone found on your device.' : 'No microphone found on your device.';
      } else if (err.message) {
        message = err.message;
      }
      setPermissionError(message);
      return { stream: null, error: message };
    }
  }, []);

  return {
    permissionError,
    requestPermissions,
    clearError: () => setPermissionError(null),
  };
}
