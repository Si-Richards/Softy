import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import DialpadGrid from "./dialpad/DialpadGrid";
import NumberInput from "./dialpad/NumberInput";
import CallControls from "./dialpad/CallControls";
import { useJanusSetup } from "./dialpad/useJanusSetup";
import { useDTMFTone } from "@/hooks/useDTMFTone";
import { useSendDTMF } from "@/hooks/useSendDTMF";
import { useKeypadInput } from "@/hooks/useKeypadInput";
import { useAudioStreams } from "@/hooks/useAudioStreams";
import { useCallControls } from "@/hooks/useCallControls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Phone } from "lucide-react";
import AudioStatus from "./dialpad/AudioStatus";
import AudioCheckButton from "./dialpad/AudioCheckButton";
import { AudioElementHandler } from "@/services/janus/utils/audioElementHandler";
import QuickAccessPanel from "./dialpad/QuickAccessPanel";

const Dialpad = () => {
  const [number, setNumber] = useState("");
  const {
    toast
  } = useToast();
  const {
    isJanusConnected,
    isRegistered,
    errorMessage
  } = useJanusSetup();
  const {
    playDTMFTone
  } = useDTMFTone();
  const {
    sendDTMFTone
  } = useSendDTMF();
  const voicemailNumber = "1571"; // Updated voicemail number
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const {
    isCallActive,
    muted,
    handleCall,
    toggleMute
  } = useCallControls();

  // Hook for handling audio streams
  useAudioStreams(isCallActive);

  // Effect for setting up audio element
  useEffect(() => {
    if (isCallActive) {
      // Ensure the audio element is properly set up
      const audioElement = AudioElementHandler.getAudioElement();

      // Monitor audio status during call
      const audioCheckInterval = setInterval(() => {
        if (isCallActive) {
          AudioElementHandler.logAudioState();
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
      setNumber(prev => prev + key);
      playDTMFTone(key);
    }
  };
  
  const handleBackspace = () => {
    if (!isCallActive) {
      setNumber(prev => prev.slice(0, -1));
    }
  };
  
  useKeypadInput(addDigitToNumber);
  
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
      description: "Connecting to voicemail service..."
    });
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 relative">
      <div className="flex justify-between items-center mb-4">
        <AudioStatus isCallActive={isCallActive} />
        <AudioCheckButton isCallActive={isCallActive} />
      </div>

      {!isJanusConnected && <Alert className="mb-4 bg-yellow-50 border-yellow-200">
          <AlertTitle className="flex items-center"><Info className="h-4 w-4 mr-2" /> Not Connected</AlertTitle>
          <AlertDescription>
            WebRTC connection is not established. Please go to Settings and connect your SIP account.
          </AlertDescription>
        </Alert>}

      {isJanusConnected && !isRegistered && <Alert className="mb-4 bg-orange-50 border-orange-200">
          <AlertTitle className="flex items-center"><Info className="h-4 w-4 mr-2" /> Not Registered</AlertTitle>
          <AlertDescription>
            Connected to WebRTC server but not registered with SIP. Please check your credentials.
          </AlertDescription>
        </Alert>}

      {errorMessage && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {errorMessage}
        </div>}

      {isCallActive && <Alert className="mb-4 bg-green-50 border-green-200">
          <AlertTitle>Call Active</AlertTitle>
          <AlertDescription>
            Use the dialpad to send DTMF tones to the remote party.
            {/* Added note about audio troubleshooting */}
            {isCallActive && <div className="mt-2 text-xs text-green-700">
              Can't hear audio? Click the "Check Audio" button above.
            </div>}
          </AlertDescription>
        </Alert>}

      <NumberInput 
        number={number} 
        onChange={setNumber} 
        onClear={clearNumber} 
        onBackspace={handleBackspace} 
        disabled={isCallActive} 
      />

      <DialpadGrid onKeyPress={handleKeyPress} isCallActive={isCallActive} />

      <CallControls 
        isCallActive={isCallActive} 
        muted={muted} 
        number={number} 
        onCall={() => handleCall(number, isJanusConnected)} 
        onToggleMute={toggleMute} 
        onCallVoicemail={callVoicemail} 
      />
      
      {/* Quick access panel */}
      <QuickAccessPanel 
        isCallActive={isCallActive}
        setNumber={setNumber}
        isJanusConnected={isJanusConnected}
      />
    </div>
  );
};

export default Dialpad;
