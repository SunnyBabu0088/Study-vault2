import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from 'lucide-react';

export default function AudioCallModal({ contactName, avatarSeed, onEndCall, socket, conversationId }) {
  const [callState, setCallState] = useState('Calling...');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const localStreamRef = useRef(null);
  const peerConnRef = useRef(null);
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    let timer;
    const startCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = stream;
        setCallState('Connected');

        // Start duration counter
        timer = setInterval(() => {
          setSeconds((s) => s + 1);
        }, 1000);

        // Notify socket
        if (socket && socket.connected) {
          socket.emit('call_initiate', { conversationId, callType: 'audio' });
        }
      } catch (err) {
        console.error('Audio stream access error:', err);
        setCallState('Microphone access denied or unavailable');
      }
    };

    startCall();

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

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-slate-950 text-white animate-fadeIn">
      {/* Hidden audio element for remote audio */}
      <audio ref={remoteAudioRef} autoPlay />

      {/* TOP STATUS */}
      <div className="w-full flex flex-col items-center pt-8 space-y-2">
        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
          Audio Call
        </span>
        <p className="text-sm text-slate-400 font-medium">{callState === 'Connected' ? formatTime(seconds) : callState}</p>
      </div>

      {/* CENTER AVATAR */}
      <div className="flex flex-col items-center space-y-4 my-auto">
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-indigo-500/20 animate-ping opacity-40" />
          <img
            src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${avatarSeed || contactName}`}
            alt={contactName}
            className="w-32 h-32 rounded-full border-4 border-slate-800 object-cover relative z-10 shadow-2xl"
          />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 m-0">{contactName}</h2>
        <p className="text-xs text-slate-400 m-0">End-to-end encrypted audio call</p>
      </div>

      {/* BOTTOM CONTROLS */}
      <div className="w-full max-w-sm flex items-center justify-around pb-8">
        <button
          type="button"
          className={`p-4 rounded-full transition flex items-center justify-center ${
            isMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
          onClick={toggleMute}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <button
          type="button"
          className="p-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-xl transition transform hover:scale-105"
          onClick={() => {
            if (socket && socket.connected) {
              socket.emit('call_end', { conversationId });
            }
            onEndCall(seconds);
          }}
          title="End Call"
        >
          <PhoneOff className="w-7 h-7" />
        </button>

        <button
          type="button"
          className={`p-4 rounded-full transition flex items-center justify-center ${
            isSpeakerOff ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
          onClick={() => setIsSpeakerOff(!isSpeakerOff)}
          title={isSpeakerOff ? 'Enable Speaker' : 'Disable Speaker'}
        >
          {isSpeakerOff ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
}
