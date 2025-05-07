import React, { useState, useRef } from "react";
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

const Dialpad = () => {
  const [number, setNumber] = useState("");
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { isJanusConnected, errorMessage } = useJanusSetup();
  const { playDTMFTone } = useDTMFTone();
  const voicemailNumber = "1571"; // Updated voicemail number
  
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
  useVideoStreams(isCallActive, localVideoRef, remoteVideoRef);

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
