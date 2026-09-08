import { useEffect, useRef, useState } from 'react';
import { useCallContext } from '../../context/CallContext';
import { CALL_STATES, CALL_TYPES } from '../../utils/callStates';
import CallControls from './CallControls';

export default function VideoCall() {
  const {
    callStatus,
    activeCall,
    localStream,
    remoteStream,
    callDuration,
    isMinimized,
    isMuted,
    toggleMute,
    isCameraOn,
    toggleCamera,
    isSpeakerOn,
    toggleSpeaker,
    endCall,
    toggleMinimize,
  } = useCallContext();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Dragging state for local video preview box
  const [localPos, setLocalPos] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const isConnectedVideo =
    (callStatus === CALL_STATES.CONNECTED || callStatus === CALL_STATES.CONNECTING || callStatus === CALL_STATES.RECONNECTING) &&
    activeCall?.callType === CALL_TYPES.VIDEO &&
    !isMinimized;

  if (!isConnectedVideo || !activeCall) {
    return null;
  }

  const { contactName } = activeCall;

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - localPos.x, y: e.clientY - localPos.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setLocalPos({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black text-white overflow-hidden animate-fadeIn select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* FULL SCREEN REMOTE VIDEO */}
      <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4">
            <img
              src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${contactName}`}
              alt={contactName}
              className="w-28 h-28 rounded-full border-4 border-slate-800 object-cover shadow-2xl animate-pulse"
            />
            <p className="text-sm font-semibold text-slate-300">Establishing WebRTC video connection with {contactName}...</p>
          </div>
        )}

        {/* TOP OVERLAY HEADER */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20 pointer-events-none">
          <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-sm font-bold text-slate-100">{contactName}</span>
            <span className="text-xs text-slate-400 font-mono">
              {callStatus === CALL_STATES.CONNECTED ? formatDuration(callDuration) : 'Connecting...'}
            </span>
          </div>
        </div>

        {/* DRAGGABLE LOCAL CAMERA PREVIEW */}
        <div
          className="absolute z-30 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-2xl"
          style={{ right: `${localPos.x}px`, top: `${localPos.y}px` }}
          onMouseDown={handleMouseDown}
        >
          <div className="w-32 h-44 sm:w-40 sm:h-56 rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-900 shadow-2xl relative">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
            {!isCameraOn && (
              <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-xs text-slate-400 font-medium">
                Camera Off
              </div>
            )}
            <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/60 px-2 py-0.5 rounded-full text-slate-200">
              You
            </span>
          </div>
        </div>

        {/* BOTTOM FLOATING CONTROL BAR */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-4 flex justify-center">
          <CallControls
            isMuted={isMuted}
            onToggleMute={toggleMute}
            isCameraOn={isCameraOn}
            onToggleCamera={toggleCamera}
            isSpeakerOn={isSpeakerOn}
            onToggleSpeaker={toggleSpeaker}
            onEndCall={endCall}
            onMinimize={toggleMinimize}
            showCamera={true}
          />
        </div>
      </div>
    </div>
  );
}
