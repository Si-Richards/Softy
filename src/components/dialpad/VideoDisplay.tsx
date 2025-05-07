
import React, { useEffect, useRef } from 'react';
import janusService from "@/services/JanusService";

interface VideoDisplayProps {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  isVideoEnabled: boolean;
  isCallActive: boolean;
}

const VideoDisplay = ({ localVideoRef, remoteVideoRef, isVideoEnabled, isCallActive }: VideoDisplayProps) => {
  // Create additional audio element reference for audio-only calls
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  
  // Effect to handle remote stream when call is active
  useEffect(() => {
    if (isCallActive) {
      const remoteStream = janusService.getRemoteStream();
      
      // Route remote stream to both video and audio elements
      if (remoteStream) {
        console.log("Setting remote stream to audio element", remoteStream);
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          janusService.applyAudioOutputDevice(remoteAudioRef.current);
        }
        
        // Also set to video element if video is enabled
        if (isVideoEnabled && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          janusService.applyAudioOutputDevice(remoteVideoRef.current);
        }
      }
    }
    
    return () => {
      // Clean up audio element when component unmounts or call ends
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }
    };
  }, [isCallActive, isVideoEnabled, remoteVideoRef]);

  // Always render the audio element, even for audio-only calls
  return (
    <>
      <audio 
        ref={remoteAudioRef} 
        autoPlay 
        playsInline
        className="hidden"
      />
      
      {isVideoEnabled && isCallActive && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="aspect-video bg-gray-800 rounded overflow-hidden">
            <video 
              ref={localVideoRef} 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="aspect-video bg-gray-800 rounded overflow-hidden">
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default VideoDisplay;
