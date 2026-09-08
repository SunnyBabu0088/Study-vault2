import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { CALL_STATES, CALL_TYPES } from '../utils/callStates';
import { useWebRTC } from '../hooks/useWebRTC';
import { useCallPermissions } from '../hooks/useCallPermissions';
import { callSocketService } from '../services/socketService';

const CallContext = createContext(null);

export function CallProvider({ children, currentUsername }) {
  const [callStatus, setCallStatus] = useState(CALL_STATES.IDLE);
  const [activeCall, setActiveCall] = useState(null); // { callId, contactName, callType, conversationId, role: 'caller'|'receiver' }
  const [callDuration, setCallDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [callError, setCallError] = useState(null);

  const durationTimerRef = useRef(null);
  const pendingOfferRef = useRef(null);

  const {
    localStream,
    remoteStream,
    isMuted,
    isCameraOn,
    isSpeakerOn,
    createPeerConnection,
    addStreamTracks,
    createOffer,
    handleOfferAndCreateAnswer,
    handleAnswer,
    addIceCandidate,
    toggleMute,
    toggleCamera,
    toggleSpeaker,
    cleanup: cleanupWebRTC,
  } = useWebRTC();

  const { requestPermissions } = useCallPermissions();

  // Connect WebSocket signaling when username is available
  useEffect(() => {
    if (currentUsername) {
      callSocketService.connect(currentUsername);
    }
    return () => {
      callSocketService.disconnect();
    };
  }, [currentUsername]);

  // Start Duration Timer when Connected
  const startTimer = useCallback(() => {
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    setCallDuration(0);
    durationTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, []);

  // End Call & Reset
  const endCall = useCallback((reason = 'Call ended') => {
    stopTimer();
    if (activeCall) {
      const targetName = activeCall.contactName;
      callSocketService.send({
        type: 'call_ended',
        call_id: activeCall.callId,
        receiver_name: targetName,
        caller_name: currentUsername,
        duration_seconds: callDuration,
      });
    }

    setCallStatus(CALL_STATES.ENDED);
    setTimeout(() => {
      cleanupWebRTC();
      setActiveCall(null);
      setCallStatus(CALL_STATES.IDLE);
      setIsMinimized(false);
      setCallDuration(0);
      setCallError(null);
      pendingOfferRef.current = null;
    }, 1000);
  }, [activeCall, currentUsername, callDuration, stopTimer, cleanupWebRTC]);

  // Reject Call
  const rejectCall = useCallback(() => {
    if (activeCall) {
      callSocketService.send({
        type: 'call_rejected',
        call_id: activeCall.callId,
        caller_name: activeCall.contactName,
        receiver_name: currentUsername,
      });
    }
    stopTimer();
    setCallStatus(CALL_STATES.REJECTED);
    setTimeout(() => {
      cleanupWebRTC();
      setActiveCall(null);
      setCallStatus(CALL_STATES.IDLE);
      setIsMinimized(false);
      pendingOfferRef.current = null;
    }, 1000);
  }, [activeCall, currentUsername, stopTimer, cleanupWebRTC]);

  // Start Outgoing Call
  const startCall = useCallback(async (contactName, callType = CALL_TYPES.VOICE, conversationId = null) => {
    if (!currentUsername) {
      setCallError('Authentication required to make a call.');
      return;
    }
    if (callStatus !== CALL_STATES.IDLE) {
      setCallError('Already in an active call session.');
      return;
    }

    setCallError(null);
    const { stream, error } = await requestPermissions(callType);
    if (error || !stream) {
      setCallError(error || 'Camera/Microphone permission denied.');
      return;
    }

    const callId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `call_${Date.now()}`;
    setActiveCall({
      callId,
      contactName,
      callType,
      conversationId,
      role: 'caller',
    });
    setCallStatus(CALL_STATES.OUTGOING);

    // Create RTCPeerConnection
    await createPeerConnection(
      (candidate) => {
        callSocketService.send({
          type: 'ice_candidate',
          call_id: callId,
          receiver_name: contactName,
          candidate,
        });
      },
      () => {
        setCallStatus(CALL_STATES.CONNECTED);
        startTimer();
      }
    );

    addStreamTracks(stream);

    // Create WebRTC Offer
    const offer = await createOffer();

    // Send Call Offer over WebSocket
    callSocketService.send({
      type: 'call_offer',
      call_id: callId,
      receiver_name: contactName,
      caller_name: currentUsername,
      call_type: callType,
      offer,
    });

    setCallStatus(CALL_STATES.RINGING);
  }, [currentUsername, callStatus, requestPermissions, createPeerConnection, addStreamTracks, createOffer, startTimer]);

  // Accept Incoming Call
  const acceptCall = useCallback(async () => {
    if (!activeCall || !pendingOfferRef.current) return;
    const { callId, contactName, callType } = activeCall;

    const { stream, error } = await requestPermissions(callType);
    if (error || !stream) {
      setCallError(error || 'Permission denied.');
      rejectCall();
      return;
    }

    setCallStatus(CALL_STATES.CONNECTING);

    await createPeerConnection(
      (candidate) => {
        callSocketService.send({
          type: 'ice_candidate',
          call_id: callId,
          receiver_name: contactName,
          candidate,
        });
      },
      () => {
        setCallStatus(CALL_STATES.CONNECTED);
        startTimer();
      }
    );

    addStreamTracks(stream);

    // Handle Offer and generate Answer
    const answer = await handleOfferAndCreateAnswer(pendingOfferRef.current);

    // Send Answer via WebSocket
    callSocketService.send({
      type: 'call_answer',
      call_id: callId,
      caller_name: contactName,
      receiver_name: currentUsername,
      answer,
    });
  }, [activeCall, requestPermissions, rejectCall, createPeerConnection, startTimer, addStreamTracks, handleOfferAndCreateAnswer, currentUsername]);

  // WebSocket Event Listeners
  useEffect(() => {
    const unsubscribe = callSocketService.addListener(async (data) => {
      const { type } = data;

      if (type === 'incoming_call_offer') {
        if (callStatus !== CALL_STATES.IDLE) {
          // Send Busy response
          callSocketService.send({
            type: 'call_busy',
            call_id: data.call_id,
            caller_name: data.caller_name,
            message: `${currentUsername} is currently busy.`,
          });
          return;
        }

        pendingOfferRef.current = data.offer;
        setActiveCall({
          callId: data.call_id,
          contactName: data.caller_name,
          callType: data.call_type || CALL_TYPES.VOICE,
          role: 'receiver',
        });
        setCallStatus(CALL_STATES.INCOMING);
      } else if (type === 'call_answer_received') {
        if (data.answer) {
          await handleAnswer(data.answer);
          setCallStatus(CALL_STATES.CONNECTED);
          startTimer();
        }
      } else if (type === 'ice_candidate_received') {
        if (data.candidate) {
          await addIceCandidate(data.candidate);
        }
      } else if (type === 'call_rejected_received') {
        setCallStatus(CALL_STATES.REJECTED);
        stopTimer();
        setTimeout(() => {
          cleanupWebRTC();
          setActiveCall(null);
          setCallStatus(CALL_STATES.IDLE);
        }, 1500);
      } else if (type === 'call_ended_received') {
        setCallStatus(CALL_STATES.ENDED);
        stopTimer();
        setTimeout(() => {
          cleanupWebRTC();
          setActiveCall(null);
          setCallStatus(CALL_STATES.IDLE);
          setIsMinimized(false);
        }, 1500);
      } else if (type === 'call_busy_received') {
        setCallStatus(CALL_STATES.BUSY);
        stopTimer();
        setTimeout(() => {
          cleanupWebRTC();
          setActiveCall(null);
          setCallStatus(CALL_STATES.IDLE);
        }, 2000);
      } else if (type === 'call_cancelled_received') {
        setCallStatus(CALL_STATES.CANCELLED);
        stopTimer();
        setTimeout(() => {
          cleanupWebRTC();
          setActiveCall(null);
          setCallStatus(CALL_STATES.IDLE);
        }, 1500);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [callStatus, currentUsername, handleAnswer, addIceCandidate, startTimer, stopTimer, cleanupWebRTC]);

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  return (
    <CallContext.Provider
      value={{
        callStatus,
        activeCall,
        callDuration,
        isMinimized,
        callError,
        localStream,
        remoteStream,
        isMuted,
        isCameraOn,
        isSpeakerOn,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
        toggleSpeaker,
        toggleMinimize,
        clearCallError: () => setCallError(null),
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCallContext() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCallContext must be used within a CallProvider');
  }
  return context;
}
