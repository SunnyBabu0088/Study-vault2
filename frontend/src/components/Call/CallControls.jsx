import { Mic, MicOff, Video, VideoOff, Volume2, VolumeX, PhoneOff, Minimize2 } from 'lucide-react';

export default function CallControls({
  isMuted,
  onToggleMute,
  isCameraOn,
  onToggleCamera,
  isSpeakerOn,
  onToggleSpeaker,
  onEndCall,
  onMinimize,
  showCamera = true,
}) {
  return (
    <div className="flex items-center justify-center gap-4 py-4 px-6 rounded-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-2xl">
      {/* Minimize Button */}
      {onMinimize && (
        <button
          type="button"
          className="p-3.5 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
          onClick={onMinimize}
          title="Minimize call window"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      )}

      {/* Mute Mic */}
      <button
        type="button"
        className={`p-4 rounded-full transition cursor-pointer ${
          isMuted ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
        }`}
        onClick={onToggleMute}
        title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
      >
        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
      </button>

      {/* Camera Toggle */}
      {showCamera && onToggleCamera && (
        <button
          type="button"
          className={`p-4 rounded-full transition cursor-pointer ${
            !isCameraOn ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
          onClick={onToggleCamera}
          title={isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
        >
          {!isCameraOn ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </button>
      )}

      {/* Speaker Toggle */}
      <button
        type="button"
        className={`p-4 rounded-full transition cursor-pointer ${
          !isSpeakerOn ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
        }`}
        onClick={onToggleSpeaker}
        title={isSpeakerOn ? 'Disable Speaker' : 'Enable Speaker'}
      >
        {!isSpeakerOn ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
      </button>

      {/* End Call */}
      <button
        type="button"
        className="p-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-600/40 transition transform hover:scale-105 cursor-pointer"
        onClick={onEndCall}
        title="End Call"
      >
        <PhoneOff className="w-7 h-7" />
      </button>
    </div>
  );
}
