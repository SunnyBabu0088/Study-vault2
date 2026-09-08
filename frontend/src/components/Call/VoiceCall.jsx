import { useEffect, useRef } from 'react';
import { useCallContext } from '../../context/CallContext';
import { CALL_STATES, CALL_TYPES } from '../../utils/callStates';
import CallControls from './CallControls';

export default function VoiceCall() {
  const {
    callStatus,
    activeCall,
    remoteStream,
    callDuration,
    isMinimized,
    isMuted,
    toggleMute,
    isSpeakerOn,
    toggleSpeaker,
    endCall,
    toggleMinimize,
  } = useCallContext();

  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const isConnectedVoice =
    (callStatus === CALL_STATES.CONNECTED || callStatus === CALL_STATES.CONNECTING || callStatus === CALL_STATES.RECONNECTING) &&
    activeCall?.callType === CALL_TYPES.VOICE &&
    !isMinimized;

  if (!isConnectedVoice || !activeCall) {
    return null;
  }

  const { contactName } = activeCall;

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-slate-950 text-white animate-fadeIn">
      {/* Hidden HTML audio element for playing remote track */}
      <audio ref={audioRef} autoPlay playsInline />

      {/* TOP STATUS & TIMER */}
      <div className="w-full flex flex-col items-center pt-8 space-y-2">
        <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
          {callStatus === CALL_STATES.RECONNECTING ? 'Reconnecting...' : 'Voice Call'}
        </span>
        <p className="text-base text-slate-300 font-semibold">
          {callStatus === CALL_STATES.CONNECTED ? formatDuration(callDuration) : 'Connecting...'}
        </p>
      </div>

      {/* CENTER AVATAR & NAME */}
      <div className="flex flex-col items-center space-y-4 my-auto">
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-emerald-500/20 animate-pulse opacity-60" />
          <img
            src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${contactName}`}
            alt={contactName}
            className="w-36 h-36 rounded-full border-4 border-slate-800 object-cover relative z-10 shadow-2xl"
          />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-100 m-0">{contactName}</h2>
        <p className="text-xs text-slate-400 m-0">End-to-end WebRTC Audio Stream</p>
      </div>

      {/* BOTTOM CONTROLS */}
      <div className="w-full max-w-md pb-8 flex justify-center">
        <CallControls
          isMuted={isMuted}
          onToggleMute={toggleMute}
          isSpeakerOn={isSpeakerOn}
          onToggleSpeaker={toggleSpeaker}
          onEndCall={endCall}
          onMinimize={toggleMinimize}
          showCamera={false}
        />
      </div>
    </div>
  );
}
