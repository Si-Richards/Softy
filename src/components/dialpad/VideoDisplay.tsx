
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
  // Add dedicated audio element for audio-only calls
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Add check for audio output device and apply to both video and audio elements
  useEffect(() => {
    const checkAudioOutput = async () => {
      try {
        const savedAudioOutput = localStorage.getItem('selectedAudioOutput');
        if (savedAudioOutput) {
          // Apply to video element for video calls
          if (remoteVideoRef.current && 'setSinkId' in remoteVideoRef.current) {
            await (remoteVideoRef.current as any).setSinkId(savedAudioOutput);
            console.log("Video audio output set to:", savedAudioOutput);
          }
          
          // Apply to dedicated audio element for audio-only calls
          if (audioRef.current && 'setSinkId' in audioRef.current) {
            await (audioRef.current as any).setSinkId(savedAudioOutput);
            console.log("Audio element output set to:", savedAudioOutput);
          }
        }
      } catch (error) {
        console.error("Error setting audio output device:", error);
      }
    };
    
    if (isCallActive) {
      checkAudioOutput();
    }
  }, [isCallActive, remoteVideoRef]);

  return (
    <div className="relative mb-6">
      {/* Always include the audio element regardless of video being enabled */}
      <audio 
        ref={audioRef}
        autoPlay
        playsInline
        className="hidden" // Hide from view but still active
        data-testid="remote-audio"
        style={{ display: 'none' }}
      />
      
      {isVideoEnabled && (
        <div className={`${isCallActive ? "block" : "hidden"}`}>
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
      )}
    </div>
  );
};

export default VideoDisplay;
