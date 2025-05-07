
import { useEffect } from 'react';
import janusService from '@/services/JanusService';

export const useVideoStreams = (
  isCallActive: boolean,
  localVideoRef: React.RefObject<HTMLVideoElement>,
  remoteVideoRef: React.RefObject<HTMLVideoElement>
) => {
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
        
        // Try to play the stream (may be needed for autoplay policies)
        const playPromise = remoteVideoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => console.log("Remote audio playback started successfully"))
            .catch(error => {
              console.error("Error playing remote stream:", error);
              // Try again with user interaction on next click anywhere
              const handleClick = () => {
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.play()
                    .then(() => {
                      console.log("Remote audio playback started on user interaction");
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
  }, [isCallActive, localVideoRef, remoteVideoRef]);
};
