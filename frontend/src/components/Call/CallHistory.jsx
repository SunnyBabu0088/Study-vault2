import { useEffect, useState } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Video } from 'lucide-react';
import { callService } from '../../services/callService';
import { useCallContext } from '../../context/CallContext';

export default function CallHistory({ username }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { startCall } = useCallContext();

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const data = await callService.getCallHistory(username);
      setHistory(data);
      setLoading(false);
    };
    fetchHistory();
  }, [username]);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (secs) => {
    if (!secs) return '0s';
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return mins > 0 ? `${mins} min ${remainder}s` : `${remainder}s`;
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] px-2">Call History</h3>
      {loading ? (
        <div className="p-4 text-center text-xs text-[var(--text-muted)]">Loading call history...</div>
      ) : history.length === 0 ? (
        <div className="p-4 text-center text-xs text-[var(--text-muted)] border border-[var(--border-color)] rounded-2xl">
          No previous call logs found.
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((call) => {
            const isOutgoing = call.caller_username === username;
            const peerName = isOutgoing ? call.receiver_username : call.caller_username;
            const isVideo = call.call_type === 'video';
            const isMissed = call.status === 'missed' || call.status === 'rejected';

            return (
              <div
                key={call.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--button-background)] transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-full ${isMissed ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {isMissed ? (
                      <PhoneMissed className="w-5 h-5" />
                    ) : isOutgoing ? (
                      <PhoneOutgoing className="w-5 h-5" />
                    ) : (
                      <PhoneIncoming className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="m-0 text-sm font-bold text-[var(--text-primary)]">{peerName}</h4>
                    <p className="m-0 text-xs text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                      <span>{formatTime(call.created_at)}</span>
                      <span>•</span>
                      <span>{isMissed ? 'Missed Call' : formatDuration(call.duration_seconds)}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="p-2 rounded-full hover:bg-[var(--border-color)] text-[var(--text-primary)] transition cursor-pointer"
                  onClick={() => startCall(peerName, call.call_type)}
                  title={`Call ${peerName}`}
                >
                  {isVideo ? <Video className="w-4 h-4 text-indigo-400" /> : <Phone className="w-4 h-4 text-emerald-400" />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
