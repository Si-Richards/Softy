
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
      
      // Always route remote stream to audio element regardless of video state
      if (remoteStream) {
        console.log("Setting remote stream to audio element", remoteStream);
        
        // Check for audio tracks and log their state
        const audioTracks = remoteStream.getAudioTracks();
        console.log(`Remote stream has ${audioTracks.length} audio tracks`);
        audioTracks.forEach((track, i) => {
          console.log(`Remote audio track ${i}: enabled=${track.enabled}, muted=${track.muted}, readyState=${track.readyState}`);
        });
        
        // Apply to audio element for all calls
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.play().catch(err => {
            console.error("Error playing remote audio:", err);
          });
          janusService.applyAudioOutputDevice(remoteAudioRef.current);
        }
        
        // Also set to video element if video is enabled
        if (isVideoEnabled && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          janusService.applyAudioOutputDevice(remoteVideoRef.current);
        }
      } else {
        console.warn("No remote stream available yet");
      }
    } else {
      // Clean up when call ends
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    }
    
    return () => {
      // Clean up when component unmounts
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    };
  }, [isCallActive, isVideoEnabled, remoteVideoRef]);

  return (
    <>
      {/* Always render the audio element, even for audio-only calls */}
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
