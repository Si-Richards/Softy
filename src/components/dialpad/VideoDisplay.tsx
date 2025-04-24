
import React from 'react';

interface VideoDisplayProps {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  isVideoEnabled: boolean;
  isCallActive: boolean;
}

const VideoDisplay = ({ localVideoRef, remoteVideoRef, isVideoEnabled, isCallActive }: VideoDisplayProps) => {
  if (!isVideoEnabled || !isCallActive) return null;

  return (
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
  );
};

export default VideoDisplay;
