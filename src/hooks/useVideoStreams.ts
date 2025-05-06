import { useEffect, useRef } from 'react';
import janusService from '@/services/JanusService';
import { useSettings } from '@/hooks/useSettings';

export const useVideoStreams = (
  isCallActive: boolean,
  localVideoRef: React.RefObject<HTMLVideoElement>,
  remoteVideoRef: React.RefObject<HTMLVideoElement>
) => {
  // Keep track of whether we've already set up the audio
  const audioSetupComplete = useRef(false);
  const { audioSettings } = useSettings();
  
  useEffect(() => {
    if (isCallActive) {
      const localStream = janusService.getLocalStream();
      const remoteStream = janusService.getRemoteStream();
      
      console.log("Local stream in Dialpad:", localStream);
      console.log("Remote stream in Dialpad:", remoteStream);
      
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.muted = true; // Mute local stream to prevent echo
      }
      
      if (remoteVideoRef.current && remoteStream) {
        console.log("Setting remote stream to video element");
        
        // Apply volume setting from user preferences
        if (audioSettings?.masterVolume) {
          const volume = audioSettings.masterVolume / 100;
          remoteVideoRef.current.volume = volume;
          console.log("Setting remote video element volume to:", volume);
          
          // Also set the audio context gain if available
          const mediaHandler = janusService.getMediaHandler();
          if (mediaHandler) {
            mediaHandler.setRemoteVolume(audioSettings.masterVolume);
          }
        }
        
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.muted = false;
        
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
        
        // Try to play the stream (may be needed for autoplay policies)
        if (!audioSetupComplete.current) {
          const playPromise = remoteVideoRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log("Remote audio playback started successfully");
                audioSetupComplete.current = true;
              })
              .catch(error => {
                console.error("Error playing remote stream:", error);
                // Try again with user interaction on next click anywhere
                const handleClick = () => {
                  if (remoteVideoRef.current) {
                    remoteVideoRef.current.play()
                      .then(() => {
                        console.log("Remote audio playback started on user interaction");
                        audioSetupComplete.current = true;
                        document.removeEventListener('click', handleClick);
                      })
                      .catch(e => console.error("Still failed to play:", e));
                  }
                };
                document.addEventListener('click', handleClick, { once: true });
              });
          }
        }
      }
    } else {
      // Reset the flag when call is not active
      audioSetupComplete.current = false;
    }
  }, [isCallActive, localVideoRef, remoteVideoRef, audioSettings]);
};
