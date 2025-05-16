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
import { Info, MessageSquare, User, Settings, PhoneCall } from "lucide-react";
import AudioStatus from "./dialpad/AudioStatus";
import AudioCheckButton from "./dialpad/AudioCheckButton";
import { AudioElementHandler } from "@/services/janus/utils/audioElementHandler";
import { Button } from "@/components/ui/button";

const Dialpad = () => {
  const [number, setNumber] = useState("");
  const { toast } = useToast();
  const { isJanusConnected, isRegistered, errorMessage } = useJanusSetup();
  const { playDTMFTone } = useDTMFTone();
  const { sendDTMFTone } = useSendDTMF();
  const voicemailNumber = "1571"; // Updated voicemail number
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  
  const {
    isCallActive,
    muted,
    handleCall,
    toggleMute,
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

  // Quick access shortcodes
  const shortcodes = [
    { name: "Voicemail", number: "1571", icon: <MessageSquare className="h-4 w-4" /> },
    { name: "Support", number: "5000", icon: <User className="h-4 w-4" /> },
    { name: "Conference", number: "8000", icon: <PhoneCall className="h-4 w-4" /> },
    { name: "Settings", number: "9999", icon: <Settings className="h-4 w-4" /> },
  ];

  const callShortcode = (code: string) => {
    setNumber(code);
    handleCall(code, isJanusConnected);
    toast({
      title: `Calling ${code}`,
      description: `Connecting to shortcode service...`,
    });
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <AudioStatus isCallActive={isCallActive} />
        <AudioCheckButton isCallActive={isCallActive} />
      </div>

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
            {/* Added note about audio troubleshooting */}
            {isCallActive && <div className="mt-2 text-xs text-green-700">
              Can't hear audio? Click the "Check Audio" button above.
            </div>}
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
        number={number}
        onCall={() => handleCall(number, isJanusConnected)}
        onToggleMute={toggleMute}
        onCallVoicemail={callVoicemail}
      />
      
      {/* Shortcode options */}
      {!isCallActive && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-600 mb-3">Quick Access</h3>
          <div className="grid grid-cols-2 gap-3">
            {shortcodes.map((code) => (
              <Button
                key={code.number}
                variant="outline"
                className="flex justify-start items-center gap-2 py-2 border border-gray-200 rounded-md hover:bg-gray-50"
                onClick={() => callShortcode(code.number)}
                disabled={!isJanusConnected}
              >
                {code.icon}
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{code.name}</span>
                  <span className="text-xs text-gray-500">{code.number}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dialpad;
