import { Phone, Video, Maximize2, PhoneOff } from 'lucide-react';
import { useCallContext } from '../../context/CallContext';
import { CALL_STATES, CALL_TYPES } from '../../utils/callStates';

export default function MinimizedCallBubble() {
  const { callStatus, activeCall, callDuration, isMinimized, toggleMinimize, endCall } = useCallContext();

  const isCallActive =
    (callStatus === CALL_STATES.CONNECTED || callStatus === CALL_STATES.CONNECTING || callStatus === CALL_STATES.RECONNECTING) &&
    activeCall &&
    isMinimized;

  if (!isCallActive) return null;

  const { contactName, callType } = activeCall;
  const isVideo = callType === CALL_TYPES.VIDEO;

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-3 p-2.5 px-4 rounded-full bg-slate-900/90 text-white border border-slate-700 shadow-2xl backdrop-blur-xl animate-fadeIn cursor-pointer hover:bg-slate-800 transition">
      <div className="flex items-center gap-2.5" onClick={toggleMinimize}>
        <div className="relative">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute -top-0.5 -right-0.5" />
          <img
            src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${contactName}`}
            alt={contactName}
            className="w-8 h-8 rounded-full border border-slate-700 object-cover"
          />
        </div>

        <div className="leading-tight">
          <p className="m-0 text-xs font-bold text-slate-100 flex items-center gap-1">
            {isVideo ? <Video className="w-3 h-3 text-indigo-400" /> : <Phone className="w-3 h-3 text-emerald-400" />}
            <span>{contactName}</span>
          </p>
          <p className="m-0 text-[10px] font-mono text-emerald-400">{formatDuration(callDuration)}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
        <button
          type="button"
          className="p-1.5 rounded-full hover:bg-slate-700 text-slate-300 transition cursor-pointer"
          onClick={toggleMinimize}
          title="Return to full call screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          className="p-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer"
          onClick={() => endCall('User ended from floating bubble')}
          title="End Call"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
