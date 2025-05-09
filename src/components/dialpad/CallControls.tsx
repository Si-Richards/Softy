
import React from 'react';
import { Button } from "@/components/ui/button";
import { Phone, Mic, MicOff, Voicemail } from "lucide-react";

interface CallControlsProps {
  isCallActive: boolean;
  muted: boolean;
  number: string;
  onCall: () => void;
  onToggleMute: () => void;
  onCallVoicemail: () => void;
}

const CallControls = ({
  isCallActive,
  muted,
  number,
  onCall,
  onToggleMute,
  onCallVoicemail
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
        <Button
          size="lg"
          variant={muted ? "destructive" : "outline"}
          className="rounded-full w-16 h-16"
          onClick={onToggleMute}
        >
          {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>
      ) : (
        <Button
          size="lg"
          variant="outline"
          className="rounded-full w-16 h-16"
          onClick={onCallVoicemail}
        >
          <Voicemail className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default CallControls;
