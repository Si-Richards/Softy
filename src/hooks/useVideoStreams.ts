
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
      }
      
      if (remoteVideoRef.current && remoteStream) {
        console.log("Setting remote stream to video element");
        remoteVideoRef.current.srcObject = remoteStream;
        
        // Ensure audio playback is enabled
        remoteVideoRef.current.muted = false;
        remoteVideoRef.current.volume = 1.0;
        
        // Try to play the stream (may be needed for autoplay policies)
        const playPromise = remoteVideoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Error playing remote stream:", error);
          });
        }
      }
    }
  }, [isCallActive, localVideoRef, remoteVideoRef]);
};
