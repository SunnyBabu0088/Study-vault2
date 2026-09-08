import { useEffect, useCallback } from 'react';
import { callSocketService } from '../services/socketService';

export function useCallSocket(username, handlers = {}) {
  useEffect(() => {
    if (username) {
      callSocketService.connect(username);
    }

    const unsubscribe = callSocketService.addListener((data) => {
      const { type } = data;
      if (type === 'incoming_call_offer' && handlers.onIncomingOffer) {
        handlers.onIncomingOffer(data);
      } else if (type === 'call_answer_received' && handlers.onAnswerReceived) {
        handlers.onAnswerReceived(data);
      } else if (type === 'ice_candidate_received' && handlers.onIceCandidateReceived) {
        handlers.onIceCandidateReceived(data);
      } else if (type === 'call_rejected_received' && handlers.onCallRejected) {
        handlers.onCallRejected(data);
      } else if (type === 'call_ended_received' && handlers.onCallEnded) {
        handlers.onCallEnded(data);
      } else if (type === 'call_busy_received' && handlers.onCallBusy) {
        handlers.onCallBusy(data);
      } else if (type === 'call_cancelled_received' && handlers.onCallCancelled) {
        handlers.onCallCancelled(data);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [username, handlers]);

  const sendOffer = useCallback((callId, receiverName, callType, offer) => {
    callSocketService.send({
      type: 'call_offer',
      call_id: callId,
      receiver_name: receiverName,
      call_type: callType,
      offer,
    });
  }, []);

  const sendAnswer = useCallback((callId, callerName, answer) => {
    callSocketService.send({
      type: 'call_answer',
      call_id: callId,
      caller_name: callerName,
      answer,
    });
  }, []);

  const sendIceCandidate = useCallback((callId, receiverName, candidate) => {
    callSocketService.send({
      type: 'ice_candidate',
      call_id: callId,
      receiver_name: receiverName,
      candidate,
    });
  }, []);

  const sendRejectCall = useCallback((callId, callerName) => {
    callSocketService.send({
      type: 'call_rejected',
      call_id: callId,
      caller_name: callerName,
    });
  }, []);

  const sendEndCall = useCallback((callId, receiverName, durationSeconds = 0) => {
    callSocketService.send({
      type: 'call_ended',
      call_id: callId,
      receiver_name: receiverName,
      duration_seconds: durationSeconds,
    });
  }, []);

  const sendCancelCall = useCallback((callId, receiverName) => {
    callSocketService.send({
      type: 'call_cancelled',
      call_id: callId,
      receiver_name: receiverName,
    });
  }, []);

  return {
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    sendRejectCall,
    sendEndCall,
    sendCancelCall,
  };
}
