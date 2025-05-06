
import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import VideoDisplay from "./dialpad/VideoDisplay";
import DialpadGrid from "./dialpad/DialpadGrid";
import NumberInput from "./dialpad/NumberInput";
import CallControls from "./dialpad/CallControls";
import { useJanusSetup } from "./dialpad/useJanusSetup";
import { useDTMFTone } from "@/hooks/useDTMFTone";
import { useKeypadInput } from "@/hooks/useKeypadInput";
import { useVideoStreams } from "@/hooks/useVideoStreams";
import { useCallControls } from "@/hooks/useCallControls";
import { Button } from "@/components/ui/button";
import { VolumeX, Volume2 } from "lucide-react";

const Dialpad = () => {
  const [number, setNumber] = useState("");
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { isJanusConnected, errorMessage } = useJanusSetup();
  const { playDTMFTone } = useDTMFTone();
  const voicemailNumber = "1571"; // Updated voicemail number
  const [audioTrouble, setAudioTrouble] = useState(false);
  
  const {
    isCallActive,
    muted,
    isVideoEnabled,
    handleCall,
    toggleMute,
    toggleVideo,
    startVideoCall,
  } = useCallControls();

  const addDigitToNumber = (key: string) => {
    setNumber((prev) => prev + key);
  };

  const handleBackspace = () => {
    setNumber((prev) => prev.slice(0, -1));
  };

  useKeypadInput(addDigitToNumber);
  const { forceAudioPlayback } = useVideoStreams(isCallActive, localVideoRef, remoteVideoRef);

  // Set a timeout to check if audio might be having issues
  useEffect(() => {
    if (isCallActive) {
      const audioTroubleTimer = setTimeout(() => {
        setAudioTrouble(true);
      }, 5000); // Show audio help button after 5 seconds of active call
      
      return () => {
        clearTimeout(audioTroubleTimer);
        setAudioTrouble(false);
      };
    }
  }, [isCallActive]);

  const handleKeyPress = (key: string) => {
    addDigitToNumber(key);
    playDTMFTone(key);
  };

  const clearNumber = () => {
    setNumber("");
  };

  const callVoicemail = () => {
    setNumber(voicemailNumber);
    handleCall(voicemailNumber, isJanusConnected);
    toast({
      title: "Calling voicemail",
      description: "Connecting to voicemail service...",
    });
  };

  const handleFixAudio = () => {
    forceAudioPlayback();
    toast({
      title: "Audio Reset",
      description: "Trying to restore audio connection...",
    });
    setAudioTrouble(false);
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <VideoDisplay
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        isVideoEnabled={isVideoEnabled}
        isCallActive={isCallActive}
      />

      {errorMessage && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {errorMessage}
        </div>
      )}

      {isCallActive && audioTrouble && (
        <div className="mb-4 p-2 flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded">
          <div className="flex items-center text-yellow-700">
            <VolumeX className="w-5 h-5 mr-2" />
            <span>Can't hear audio?</span>
          </div>
          <Button size="sm" variant="outline" className="text-xs" onClick={handleFixAudio}>
            <Volume2 className="w-4 h-4 mr-1" /> Fix Audio
          </Button>
        </div>
      )}

      <NumberInput
        number={number}
        onChange={setNumber}
        onClear={clearNumber}
        onBackspace={handleBackspace}
      />

      <DialpadGrid onKeyPress={handleKeyPress} />

      <CallControls
        isCallActive={isCallActive}
        muted={muted}
        isVideoEnabled={isVideoEnabled}
        number={number}
        onCall={() => handleCall(number, isJanusConnected)}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onCallVoicemail={callVoicemail}
        onStartVideoCall={() => startVideoCall(number)}
      />
    </div>
  );
};

export default Dialpad;
