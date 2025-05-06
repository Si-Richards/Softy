
import { useEffect, useCallback } from 'react';
import janusService from '@/services/JanusService';
import { useSettings } from '@/hooks/useSettings';

export const useVideoStreams = (
  isCallActive: boolean,
  localVideoRef: React.RefObject<HTMLVideoElement>,
  remoteVideoRef: React.RefObject<HTMLVideoElement>
) => {
  const { audioSettings } = useSettings();
  
  // Function to force audio playback - can be called on user interaction
  const forceAudioPlayback = useCallback(() => {
    if (!isCallActive) return;
    
    console.log("Forcing audio playback on user interaction");
    const mediaHandler = (janusService as any).mediaHandler;
    if (mediaHandler && typeof mediaHandler.ensureAudioPlayback === 'function') {
      mediaHandler.ensureAudioPlayback();
    }
    
    // Also try to manually play the remote video element (which carries audio)
    if (remoteVideoRef.current && remoteVideoRef.current.paused) {
      remoteVideoRef.current.play()
        .then(() => console.log("Remote stream playback started via user interaction"))
        .catch(e => console.error("Still failed to play remote stream:", e));
    }
  }, [isCallActive, remoteVideoRef]);

  useEffect(() => {
    if (isCallActive) {
      const localStream = janusService.getLocalStream();
      const remoteStream = janusService.getRemoteStream();
      
      console.log("Local stream in useVideoStreams:", localStream);
      console.log("Remote stream in useVideoStreams:", remoteStream);
      
      // Set local video stream
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.muted = true; // Always mute local stream to prevent echo
      }
      
      // Set remote video/audio stream
      if (remoteVideoRef.current && remoteStream) {
        console.log("Setting remote stream to video element");
        remoteVideoRef.current.srcObject = remoteStream;
        
        // Ensure audio playback is properly enabled
        remoteVideoRef.current.muted = false;
        remoteVideoRef.current.volume = audioSettings.masterVolume ? audioSettings.masterVolume / 100 : 1.0;
        
        // Set the audio output device if available
        const selectedAudioOutput = localStorage.getItem('selectedAudioOutput');
        if (selectedAudioOutput && (remoteVideoRef.current as any).setSinkId) {
          try {
            (remoteVideoRef.current as any).setSinkId(selectedAudioOutput)
              .then(() => console.log("Audio output device set successfully"))
              .catch((e: Error) => console.error("Error setting audio output device:", e));
          } catch (e) {
            console.warn("setSinkId not fully supported:", e);
          }
        }
        
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
          if (!track.enabled) {
            console.log("Re-enabling disabled audio track");
            track.enabled = true;
          }
        });
        
        // Try to play the stream (may be needed for autoplay policies)
        const playPromise = remoteVideoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => console.log("Remote audio playback started successfully"))
            .catch(error => {
              console.error("Error playing remote stream:", error);
              console.log("Will retry on user interaction");
              
              // Add document-wide click handler to restart audio on interaction
              const handleUserInteraction = () => {
                forceAudioPlayback();
                // Only need to handle this once
                document.removeEventListener('click', handleUserInteraction);
                document.removeEventListener('touchstart', handleUserInteraction);
              };
              
              document.addEventListener('click', handleUserInteraction);
              document.addEventListener('touchstart', handleUserInteraction);
            });
        }
      }
      
      // Set volume on media handler if available
      const mediaHandler = (janusService as any).mediaHandler;
      if (mediaHandler && typeof mediaHandler.setAudioVolume === 'function' && audioSettings.masterVolume) {
        mediaHandler.setAudioVolume(audioSettings.masterVolume);
      }
    }
    
    // Cleanup function
    return () => {
      // Remove any document-wide event listeners when component unmounts
    };
  }, [isCallActive, localVideoRef, remoteVideoRef, audioSettings.masterVolume, forceAudioPlayback]);
  
  // Export the force playback function so it can be called from UI elements
  return { forceAudioPlayback };
};
