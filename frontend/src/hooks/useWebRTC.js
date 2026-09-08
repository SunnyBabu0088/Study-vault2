import { useEffect, useRef, useState, useCallback } from 'react';
import { fetchIceServers } from '../utils/iceServers';
import { CALL_STATES } from '../utils/callStates';

export function useWebRTC() {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [connectionState, setConnectionState] = useState(CALL_STATES.IDLE);

  const peerConnRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);

  // Initialize RTCPeerConnection with STUN/TURN servers
  const createPeerConnection = useCallback(async (onIceCandidate, onTrackReceived) => {
    if (peerConnRef.current) {
      peerConnRef.current.close();
    }

    const iceServers = await fetchIceServers();
    const pc = new RTCPeerConnection({ iceServers });

    pc.onicecandidate = (event) => {
      if (event.candidate && onIceCandidate) {
        onIceCandidate(event.candidate);
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        if (onTrackReceived) onTrackReceived(event.streams[0]);
      } else {
        const inboundStream = new MediaStream([event.track]);
        setRemoteStream(inboundStream);
        if (onTrackReceived) onTrackReceived(inboundStream);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE Connection State:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setConnectionState(CALL_STATES.CONNECTED);
      } else if (pc.iceConnectionState === 'disconnected') {
        setConnectionState(CALL_STATES.RECONNECTING);
      } else if (pc.iceConnectionState === 'failed') {
        setConnectionState(CALL_STATES.FAILED);
      }
    };

    peerConnRef.current = pc;
    return pc;
  }, []);

  // Add tracks to Peer Connection
  const addStreamTracks = useCallback((stream) => {
    setLocalStream(stream);
    if (peerConnRef.current && stream) {
      stream.getTracks().forEach((track) => {
        try {
          peerConnRef.current.addTrack(track, stream);
        } catch (e) {
          console.warn('Track already added or failed:', e);
        }
      });
    }
  }, []);

  // Create WebRTC Offer
  const createOffer = useCallback(async () => {
    if (!peerConnRef.current) return null;
    const offer = await peerConnRef.current.createOffer();
    await peerConnRef.current.setLocalDescription(offer);
    return offer;
  }, []);

  // Handle WebRTC Offer and create Answer
  const handleOfferAndCreateAnswer = useCallback(async (offer) => {
    if (!peerConnRef.current) return null;
    await peerConnRef.current.setRemoteDescription(new RTCSessionDescription(offer));
    
    // Process queued candidates
    while (pendingIceCandidatesRef.current.length > 0) {
      const candidate = pendingIceCandidatesRef.current.shift();
      try {
        await peerConnRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('Error adding queued ICE candidate:', e);
      }
    }

    const answer = await peerConnRef.current.createAnswer();
    await peerConnRef.current.setLocalDescription(answer);
    return answer;
  }, []);

  // Handle WebRTC Answer
  const handleAnswer = useCallback(async (answer) => {
    if (!peerConnRef.current) return;
    await peerConnRef.current.setRemoteDescription(new RTCSessionDescription(answer));

    // Process queued candidates
    while (pendingIceCandidatesRef.current.length > 0) {
      const candidate = pendingIceCandidatesRef.current.shift();
      try {
        await peerConnRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('Error adding queued ICE candidate:', e);
      }
    }
  }, []);

  // Handle ICE Candidate
  const addIceCandidate = useCallback(async (candidate) => {
    if (peerConnRef.current && peerConnRef.current.remoteDescription) {
      try {
        await peerConnRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('Error adding ICE candidate:', e);
      }
    } else {
      pendingIceCandidatesRef.current.push(candidate);
    }
  }, []);

  // Controls: Mute
  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  }, [localStream, isMuted]);

  // Controls: Camera
  const toggleCamera = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCameraOn;
        setIsCameraOn(!isCameraOn);
      }
    }
  }, [localStream, isCameraOn]);

  // Controls: Speaker
  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn((prev) => !prev);
  }, []);

  // Cleanup WebRTC connection & local stream tracks
  const cleanup = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    if (peerConnRef.current) {
      peerConnRef.current.close();
      peerConnRef.current = null;
    }
    pendingIceCandidatesRef.current = [];
    setConnectionState(CALL_STATES.IDLE);
    setIsMuted(false);
    setIsCameraOn(true);
    setIsSpeakerOn(true);
  }, [localStream]);

  return {
    localStream,
    remoteStream,
    isMuted,
    isCameraOn,
    isSpeakerOn,
    connectionState,
    createPeerConnection,
    addStreamTracks,
    createOffer,
    handleOfferAndCreateAnswer,
    handleAnswer,
    addIceCandidate,
    toggleMute,
    toggleCamera,
    toggleSpeaker,
    cleanup,
  };
}
