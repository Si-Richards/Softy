
import React, { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import VideoDisplay from "./dialpad/VideoDisplay";
import DialpadGrid from "./dialpad/DialpadGrid";
import NumberInput from "./dialpad/NumberInput";
import CallControls from "./dialpad/CallControls";
import { useJanusSetup } from "./dialpad/useJanusSetup";
import janusService from "@/services/JanusService";
import { useDTMFTone } from "@/hooks/useDTMFTone";
import { useKeypadInput } from "@/hooks/useKeypadInput";
import { useVideoStreams } from "@/hooks/useVideoStreams";

const Dialpad = () => {
  const [number, setNumber] = useState("");
  const [muted, setMuted] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { isJanusConnected, errorMessage } = useJanusSetup();
  const { playDTMFTone } = useDTMFTone();
  const voicemailNumber = "*97";

  const addDigitToNumber = (key: string) => {
    setNumber((prev) => prev + key);
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

  const handleCall = async () => {
    if (isCallActive) {
      try {
        if (isJanusConnected) {
          await janusService.hangup();
        }
        setIsCallActive(false);
        setIsVideoEnabled(false);
      } catch (error) {
        console.error("Error hanging up:", error);
      }
    } else if (number) {
      if (isJanusConnected) {
        try {
          await janusService.call(number);
          setIsCallActive(true);
        } catch (error) {
          console.error("Error making call:", error);
          toast({
            title: "Call Failed",
            description: "Failed to establish WebRTC call",
            variant: "destructive",
          });
        }
      } else {
        setIsCallActive(true);
        toast({
          title: "Simulated Call",
          description: "WebRTC server not connected. This is a simulated call.",
        });
      }
    }
  };

  const toggleMute = () => {
    const newMutedState = !muted;
    setMuted(newMutedState);
    
    if (janusService.getLocalStream()) {
      janusService.getLocalStream()?.getAudioTracks().forEach(track => {
        console.log("Setting audio track enabled:", !newMutedState);
        track.enabled = !newMutedState;
      });
    }
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    if (janusService.getLocalStream()) {
      janusService.getLocalStream()?.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
    }
  };

  const callVoicemail = () => {
    setNumber(voicemailNumber);
    setIsCallActive(true);
    toast({
      title: "Calling voicemail",
      description: "Connecting to voicemail service...",
    });
  };

  const startVideoCall = () => {
    if (number) {
      setIsCallActive(true);
      setIsVideoEnabled(true);
    }
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
      />

      <DialpadGrid onKeyPress={handleKeyPress} />

      <CallControls
        isCallActive={isCallActive}
        muted={muted}
        isVideoEnabled={isVideoEnabled}
        number={number}
        onCall={handleCall}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onCallVoicemail={callVoicemail}
        onStartVideoCall={startVideoCall}
      />
    </div>
  );
};

export default Dialpad;
