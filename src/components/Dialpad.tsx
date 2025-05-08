
import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import VideoDisplay from "./dialpad/VideoDisplay";
import DialpadGrid from "./dialpad/DialpadGrid";
import NumberInput from "./dialpad/NumberInput";
import CallControls from "./dialpad/CallControls";
import { useJanusSetup } from "./dialpad/useJanusSetup";
import { useDTMFTone } from "@/hooks/useDTMFTone";
import { useSendDTMF } from "@/hooks/useSendDTMF";
import { useKeypadInput } from "@/hooks/useKeypadInput";
import { useVideoStreams } from "@/hooks/useVideoStreams";
import { useCallControls } from "@/hooks/useCallControls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { AudioOutputHandler } from "@/services/janus/utils/audioOutputHandler";

const Dialpad = () => {
  const [number, setNumber] = useState("");
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { isJanusConnected, isRegistered, errorMessage } = useJanusSetup();
  const { playDTMFTone } = useDTMFTone();
  const { sendDTMFTone } = useSendDTMF();
  const voicemailNumber = "1571"; // Updated voicemail number
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  
  const {
    isCallActive,
    muted,
    isVideoEnabled,
    handleCall,
    toggleMute,
    toggleVideo,
    startVideoCall,
  } = useCallControls();

  // Effect for setting up audio element
  useEffect(() => {
    if (isCallActive) {
      // Ensure we have an audio element for the call
      const savedAudioOutput = localStorage.getItem('selectedAudioOutput');
      
      // Create a dedicated audio element for the call if not exists
      if (!document.querySelector('audio#remoteAudio')) {
        const audioElement = document.createElement('audio');
        audioElement.id = 'remoteAudio';
        audioElement.autoplay = true;
        audioElement.volume = 1.0;
        document.body.appendChild(audioElement);
        audioElementRef.current = audioElement;
        
        console.log("Created dedicated audio element for call");
      }
      
      // Monitor audio tracks during call
      const audioCheckInterval = setInterval(() => {
        const audioElement = document.querySelector('audio#remoteAudio') as HTMLAudioElement;
        if (audioElement) {
          console.log("Audio element status:", {
            volume: audioElement.volume,
            muted: audioElement.muted,
            paused: audioElement.paused
          });
        }
      }, 5000);
      
      return () => {
        clearInterval(audioCheckInterval);
      };
    }
  }, [isCallActive]);

  const addDigitToNumber = (key: string) => {
    if (isCallActive) {
      // If in a call, send DTMF tones
      sendDTMFTone(key);
    } else {
      // Otherwise just add to the dialed number
      setNumber((prev) => prev + key);
      playDTMFTone(key);
    }
  };

  const handleBackspace = () => {
    if (!isCallActive) {
      setNumber((prev) => prev.slice(0, -1));
    }
  };

  useKeypadInput(addDigitToNumber);
  useVideoStreams(isCallActive, localVideoRef, remoteVideoRef);

  const handleKeyPress = (key: string) => {
    addDigitToNumber(key);
  };

  const clearNumber = () => {
    if (!isCallActive) {
      setNumber("");
    }
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

      {!isJanusConnected && (
        <Alert className="mb-4 bg-yellow-50 border-yellow-200">
          <AlertTitle className="flex items-center"><Info className="h-4 w-4 mr-2" /> Not Connected</AlertTitle>
          <AlertDescription>
            WebRTC connection is not established. Please go to Settings and connect your SIP account.
          </AlertDescription>
        </Alert>
      )}

      {isJanusConnected && !isRegistered && (
        <Alert className="mb-4 bg-orange-50 border-orange-200">
          <AlertTitle className="flex items-center"><Info className="h-4 w-4 mr-2" /> Not Registered</AlertTitle>
          <AlertDescription>
            Connected to WebRTC server but not registered with SIP. Please check your credentials.
          </AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {errorMessage}
        </div>
      )}

      {isCallActive && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <AlertTitle>Call Active</AlertTitle>
          <AlertDescription>
            Use the dialpad to send DTMF tones to the remote party.
          </AlertDescription>
        </Alert>
      )}

      <NumberInput
        number={number}
        onChange={setNumber}
        onClear={clearNumber}
        onBackspace={handleBackspace}
        disabled={isCallActive} // Disable editing number input during calls
      />

      <DialpadGrid onKeyPress={handleKeyPress} isCallActive={isCallActive} />

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
