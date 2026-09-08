import { PhoneOff, Mic, MicOff, Volume2, VolumeX, Video } from 'lucide-react';
import { useCallContext } from '../../context/CallContext';
import { CALL_STATES, CALL_TYPES } from '../../utils/callStates';

export default function OutgoingCall() {
  const { callStatus, activeCall, endCall, isMuted, toggleMute, isSpeakerOn, toggleSpeaker } = useCallContext();

  const isOutgoing = callStatus === CALL_STATES.OUTGOING || callStatus === CALL_STATES.RINGING;

  if (!isOutgoing || !activeCall) {
    return null;
  }

  const { contactName, callType } = activeCall;
  const isVideo = callType === CALL_TYPES.VIDEO;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-slate-950 text-white animate-fadeIn">
      {/* TOP BADGE */}
      <div className="w-full flex flex-col items-center pt-8 space-y-2">
        <span className="px-3.5 py-1.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          {isVideo ? <Video className="w-4 h-4" /> : null}
          <span>{isVideo ? 'Outgoing Video Call' : 'Outgoing Voice Call'}</span>
        </span>
        <p className="text-sm text-slate-400 font-medium">
          {callStatus === CALL_STATES.RINGING ? 'Ringing...' : 'Calling...'}
        </p>
      </div>

      {/* CENTER AVATAR & NAME */}
      <div className="flex flex-col items-center space-y-4 my-auto">
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-indigo-500/20 animate-ping opacity-40" />
          <img
            src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${contactName}`}
            alt={contactName}
            className="w-32 h-32 rounded-full border-4 border-slate-800 object-cover relative z-10 shadow-2xl"
          />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 m-0">{contactName}</h2>
        <p className="text-xs text-slate-400 m-0">Connecting via WebRTC encrypted channel</p>
      </div>

      {/* CONTROLS */}
      <div className="w-full max-w-sm flex items-center justify-around pb-8">
        <button
          type="button"
          className={`p-4 rounded-full transition flex items-center justify-center cursor-pointer ${
            isMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
          onClick={toggleMute}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <button
          type="button"
          className="p-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-xl transition transform hover:scale-105 cursor-pointer"
          onClick={() => endCall('Cancelled')}
          title="End Call"
        >
          <PhoneOff className="w-7 h-7" />
        </button>

        <button
          type="button"
          className={`p-4 rounded-full transition flex items-center justify-center cursor-pointer ${
            !isSpeakerOn ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
          onClick={toggleSpeaker}
          title={isSpeakerOn ? 'Disable Speaker' : 'Enable Speaker'}
        >
          {!isSpeakerOn ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
}
