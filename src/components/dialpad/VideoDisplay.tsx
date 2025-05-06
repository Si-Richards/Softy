
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
  const audioOutputInitialized = useRef(false);

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
    
    if (isCallActive && !audioOutputInitialized.current) {
      checkAudioOutput();
      audioOutputInitialized.current = true;
    }

    if (!isCallActive) {
      audioOutputInitialized.current = false;
    }
  }, [isCallActive, remoteVideoRef]);

  // Create a hidden audio element as a fallback for audio-only calls
  useEffect(() => {
    if (isCallActive) {
      // Create hidden audio element as fallback for browsers that might have issues
      const audioEl = document.createElement('audio');
      audioEl.id = 'fallback-audio';
      audioEl.style.display = 'none';
      audioEl.autoplay = true;
      audioEl.playsInline = true;
      
      // Check if video element has remote stream and clone it for audio
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
        audioEl.srcObject = remoteVideoRef.current.srcObject;
        document.body.appendChild(audioEl);
        console.log("Fallback audio element created");
      }
      
      return () => {
        // Clean up when call ends
        if (document.getElementById('fallback-audio')) {
          document.getElementById('fallback-audio')?.remove();
        }
      };
    }
  }, [isCallActive, remoteVideoRef]);

  // For audio-only calls, we still need a hidden video element
  if (isCallActive && !isVideoEnabled) {
    return (
      <div className="hidden">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
        ></video>
      </div>
    );
  }

  // Only show visible video container if video is enabled
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
