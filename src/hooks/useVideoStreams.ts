
import { useEffect } from 'react';
import janusService from '@/services/JanusService';
import audioService from '@/services/AudioService';

export const useVideoStreams = (
  isCallActive: boolean,
  localVideoRef: React.RefObject<HTMLVideoElement>,
  remoteVideoRef: React.RefObject<HTMLVideoElement>
) => {
  useEffect(() => {
    if (isCallActive) {
      const localStream = janusService.getLocalStream();
      const remoteStream = janusService.getRemoteStream();
      
      console.log("Local stream in useVideoStreams:", localStream);
      console.log("Remote stream in useVideoStreams:", remoteStream);
      
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.muted = true; // Mute local stream to prevent echo
      }
      
      if (remoteVideoRef.current && remoteStream) {
        console.log("Setting remote stream to video element");
        remoteVideoRef.current.srcObject = remoteStream;
        
        // Ensure audio playback is properly enabled
        remoteVideoRef.current.muted = false;
        remoteVideoRef.current.volume = 1.0;
        
        // Add specific audio trace logging
        const audioTracks = remoteStream.getAudioTracks();
        console.log("Remote stream audio tracks:", audioTracks.length);
        audioTracks.forEach((track, idx) => {
          console.log(`Audio track ${idx}:`, {
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
            id: track.id,
          });
          // Ensure tracks are enabled
          track.enabled = true;
        });
        
        // Use the centralized AudioService for audio playback
        audioService.attachStream(remoteStream);
        
        // Try to play the video element (for video calls)
        if (remoteVideoRef.current) {
          const playPromise = remoteVideoRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => console.log("Remote video playback started successfully"))
              .catch(error => {
                console.error("Error playing remote video:", error);
              });
          }
        }
      } else if (remoteStream) {
        // Audio-only call - just use the audio service
        console.log("Audio-only call, using AudioService for playback");
        audioService.attachStream(remoteStream);
      }
      
      // Clean up when the component unmounts or call ends
      return () => {
        // Don't remove the audio element, just clean up resources
        audioService.cleanup();
      };
    }
  }, [isCallActive, localVideoRef, remoteVideoRef]);
};
