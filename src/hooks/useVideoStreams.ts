
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
        remoteVideoRef.current.srcObject = remoteStream;
      }
    }
  }, [isCallActive, localVideoRef, remoteVideoRef]);
};
