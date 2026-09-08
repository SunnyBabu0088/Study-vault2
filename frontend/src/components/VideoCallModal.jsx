import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Volume2, VolumeX, X } from 'lucide-react';

export default function VideoCallModal({ contactName, avatarSeed, onEndCall, socket, conversationId }) {
  const [callState, setCallState] = useState('Connecting video...');
  const [permissionError, setPermissionError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnRef = useRef(null);

  useEffect(() => {
    let timer;

    const startVideoCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        setCallState('Connected');

        timer = setInterval(() => {
          setSeconds((s) => s + 1);
        }, 1000);

        if (socket && socket.connected) {
          socket.emit('call_initiate', { conversationId, callType: 'video' });
        }
      } catch (err) {
        console.error('Camera/Microphone access error:', err);
        setPermissionError('Camera or Microphone access was denied or is unavailable on your device.');
      }
    };

    startVideoCall();

    return () => {
      if (timer) clearInterval(timer);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerConnRef.current) {
        peerConnRef.current.close();
      }
    };
  }, [conversationId, socket]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOff;
        setIsVideoOff(!isVideoOff);
      }
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  if (permissionError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950 text-white">
        <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-center">
          <div className="p-4 rounded-full bg-rose-500/20 text-rose-400 w-16 h-16 mx-auto flex items-center justify-center">
            <CameraOff className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-100 m-0">Media Device Error</h3>
          <p className="text-xs text-slate-400 leading-relaxed m-0">{permissionError}</p>
          <button
            type="button"
            className="w-full py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-sm font-bold text-white transition"
            onClick={() => onEndCall(0)}
          >
            Close Call Screen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white animate-fadeIn overflow-hidden">
      {/* MAIN REMOTE VIDEO CONTAINER */}
      <div className="relative flex-1 w-full h-full bg-slate-900 flex items-center justify-center">
        {/* Remote Video Stream */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Fallback overlay if remote video is not connected yet */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs space-y-4">
          <img
            src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${avatarSeed || contactName}`}
            alt={contactName}
            className="w-24 h-24 rounded-full border-2 border-slate-700 object-cover shadow-2xl"
          />
          <h3 className="text-xl font-bold text-slate-100 m-0">{contactName}</h3>
          <p className="text-xs text-emerald-400 font-semibold m-0">{callState === 'Connected' ? `In Call • ${formatTime(seconds)}` : callState}</p>
        </div>

        {/* TOP OVERLAY HEADER */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
          <div className="px-4 py-2 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-800 text-xs font-bold text-slate-200">
            📹 HD Video Call • {formatTime(seconds)}
          </div>
          <button
            type="button"
            className="p-2 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-800 text-slate-300 hover:text-white"
            onClick={() => onEndCall(seconds)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LOCAL CAMERA PREVIEW (PICTURE-IN-PICTURE) */}
        <div className="absolute bottom-24 right-4 z-20 w-32 h-44 sm:w-40 sm:h-56 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-black">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`}
          />
          {isVideoOff && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500 text-xs font-semibold">
              <CameraOff className="w-6 h-6 mb-1" />
              Off
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM CONTROLS BAR */}
      <div className="w-full bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-6 py-4 flex items-center justify-around z-30">
        <button
          type="button"
          className={`p-3.5 rounded-full transition flex items-center justify-center ${
            isMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
          onClick={toggleMute}
          title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          type="button"
          className={`p-3.5 rounded-full transition flex items-center justify-center ${
            isVideoOff ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
          onClick={toggleVideo}
          title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
        >
          {isVideoOff ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
        </button>

        <button
          type="button"
          className="p-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-xl transition transform hover:scale-105"
          onClick={() => {
            if (socket && socket.connected) {
              socket.emit('call_end', { conversationId });
            }
            onEndCall(seconds);
          }}
          title="End Video Call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>

        <button
          type="button"
          className={`p-3.5 rounded-full transition flex items-center justify-center ${
            isSpeakerOff ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
          onClick={() => setIsSpeakerOff(!isSpeakerOff)}
          title={isSpeakerOff ? 'Enable Speaker' : 'Disable Speaker'}
        >
          {isSpeakerOff ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
