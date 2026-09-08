import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCallContext } from '../../context/CallContext';
import { CALL_STATES, CALL_TYPES } from '../../utils/callStates';

export default function IncomingCall() {
  const { callStatus, activeCall, acceptCall, rejectCall } = useCallContext();

  if (callStatus !== CALL_STATES.INCOMING || !activeCall) {
    return null;
  }

  const { contactName, callType } = activeCall;
  const isVideo = callType === CALL_TYPES.VIDEO;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-2xl animate-fadeIn transition-all duration-300">
      <div className="w-full max-w-sm flex flex-col items-center text-center p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6 transform transition-all duration-300 scale-100">
        
        {/* CALL TYPE BADGE */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          {isVideo ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
          <span>Incoming {isVideo ? 'Video' : 'Voice'} Call</span>
        </div>

        {/* FLOATING AVATAR */}
        <div className="relative my-2">
          <div className="absolute -inset-3 rounded-full bg-indigo-500/20 animate-pulse opacity-50" />
          <img
            src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${contactName}`}
            alt={contactName}
            className="w-28 h-28 rounded-full border-4 border-slate-800 object-cover relative z-10 shadow-2xl transition transform duration-1000 ease-in-out hover:scale-105"
          />
        </div>

        {/* USERNAME */}
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 m-0">{contactName}</h2>
          <p className="text-xs text-slate-400 mt-1 m-0">StudyVault Student is calling you...</p>
        </div>

        {/* ACTIONS: DECLINE & ACCEPT */}
        <div className="flex items-center gap-6 pt-4 w-full justify-center">
          {/* DECLINE */}
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition transform hover:scale-105 cursor-pointer"
            onClick={rejectCall}
          >
            <PhoneOff className="w-5 h-5" />
            <span>Decline</span>
          </button>

          {/* ACCEPT */}
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition transform hover:scale-105 cursor-pointer"
            onClick={acceptCall}
          >
            {isVideo ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
            <span>Accept</span>
          </button>
        </div>

      </div>
    </div>
  );
}
