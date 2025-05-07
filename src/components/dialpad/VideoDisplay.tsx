
import React, { useEffect, useRef } from "react";

interface VideoDisplayProps {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  isVideoEnabled: boolean;
  isCallActive: boolean;
}

const VideoDisplay: React.FC<VideoDisplayProps> = ({
  localVideoRef,
  remoteVideoRef,
  isVideoEnabled,
  isCallActive,
}) => {
  // Add check for audio output device
  useEffect(() => {
    const checkAudioOutput = async () => {
      try {
        const savedAudioOutput = localStorage.getItem('selectedAudioOutput');
        if (savedAudioOutput && remoteVideoRef.current && 'setSinkId' in remoteVideoRef.current) {
          await (remoteVideoRef.current as any).setSinkId(savedAudioOutput);
          console.log("Audio output device set to:", savedAudioOutput);
        }
      } catch (error) {
        console.error("Error setting audio output device:", error);
      }
    };
    
    if (isCallActive) {
      checkAudioOutput();
    }
  }, [isCallActive, remoteVideoRef]);

  // Only show video container if video is enabled
  if (!isVideoEnabled) return null;

  return (
    <div className={`relative mb-6 ${isCallActive ? "block" : "hidden"}`}>
      <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
        <video
          ref={remoteVideoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
        ></video>
      </div>
      <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
        <video
          ref={localVideoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        ></video>
      </div>
    </div>
  );
};

export default VideoDisplay;
