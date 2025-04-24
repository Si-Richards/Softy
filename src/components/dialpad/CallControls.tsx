
import React from 'react';
import { Button } from "@/components/ui/button";
import { Phone, Mic, MicOff, Video, Voicemail } from "lucide-react";

interface CallControlsProps {
  isCallActive: boolean;
  muted: boolean;
  isVideoEnabled: boolean;
  number: string;
  onCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onCallVoicemail: () => void;
  onStartVideoCall: () => void;
}

const CallControls = ({
  isCallActive,
  muted,
  isVideoEnabled,
  number,
  onCall,
  onToggleMute,
  onToggleVideo,
  onCallVoicemail,
  onStartVideoCall
}: CallControlsProps) => {
  return (
    <div className="flex justify-center space-x-4">
      <Button
        size="lg"
        className={`rounded-full w-16 h-16 ${
          isCallActive ? "bg-softphone-error hover:bg-red-600" : "bg-softphone-success hover:bg-green-600"
        }`}
        onClick={onCall}
      >
        <Phone className={`h-6 w-6 ${isCallActive ? "rotate-135" : ""}`} />
      </Button>
      
      {isCallActive ? (
        <>
          <Button
            size="lg"
            variant={muted ? "destructive" : "outline"}
            className="rounded-full w-16 h-16"
            onClick={onToggleMute}
          >
            {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>
          
          <Button
            size="lg"
            variant={isVideoEnabled ? "default" : "outline"}
            className={`rounded-full w-16 h-16 ${isVideoEnabled ? "bg-softphone-accent" : ""}`}
            onClick={onToggleVideo}
          >
            <Video className="h-6 w-6" />
          </Button>
        </>
      ) : (
        <>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full w-16 h-16"
            onClick={onCallVoicemail}
          >
            <Voicemail className="h-6 w-6" />
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            className="rounded-full w-16 h-16 border-softphone-accent text-softphone-accent hover:bg-softphone-accent hover:text-white"
            onClick={onStartVideoCall}
          >
            <Video className="h-6 w-6" />
          </Button>
        </>
      )}
    </div>
  );
};

export default CallControls;
