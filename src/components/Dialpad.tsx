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
import { Info, Users, Phone, Headphones, User, Mic, MicOff, ParkingMeter, ArrowRight } from "lucide-react";
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

  // Quick access shortcodes with the specified options
  const shortcodes = [
    { 
      name: "Call Group", 
      code: "*", 
      description: "Call a group of phones",
      placeholder: "<group number>",
      icon: <Users className="h-4 w-4" /> 
    },
    { 
      name: "Pickup Group", 
      code: "*0#", 
      description: "Intercept/Pickup group call",
      placeholder: "<pickup group ID>",
      icon: <Phone className="h-4 w-4" /> 
    },
    { 
      name: "Pickup Extension", 
      code: "**", 
      description: "Intercept/Pickup extension call",
      placeholder: "<seat/extension number>",
      icon: <Phone className="h-4 w-4" /> 
    },
    { 
      name: "Withhold Number", 
      code: "141", 
      description: "Withhold number prefix (per call)",
      placeholder: "<telephone number>",
      icon: <User className="h-4 w-4" /> 
    },
    { 
      name: "Call Monitoring", 
      code: "154,", 
      description: "Call Whisper, listen & whisper",
      placeholder: "<seat>,<password>",
      icon: <Headphones className="h-4 w-4" /> 
    },
    { 
      name: "Page Extension", 
      code: "*2#", 
      description: "One-way audio to extension",
      placeholder: "<seat/extension number>",
      icon: <Mic className="h-4 w-4" /> 
    },
    { 
      name: "Page Group", 
      code: "*3#", 
      description: "One-way audio to group",
      placeholder: "<call group>",
      icon: <Mic className="h-4 w-4" /> 
    },
    { 
      name: "Intercom", 
      code: "*4#", 
      description: "Two-way audio",
      placeholder: "<seat/extension number>",
      icon: <MicOff className="h-4 w-4" /> 
    },
    { 
      name: "Park Call", 
      code: "1900", 
      description: "Parks the current call",
      placeholder: "",
      icon: <ParkingMeter className="h-4 w-4" /> 
    },
    { 
      name: "Retrieve Call", 
      code: "", 
      description: "Retrieves a parked call",
      placeholder: "<parking reference>",
      icon: <ArrowRight className="h-4 w-4" /> 
    }
  ];

  const setShortcode = (code: string) => {
    setNumber(code);
    toast({
      title: `Shortcode ${code} set`,
      description: "Enter the remaining numbers and press call",
      duration: 3000,
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
      
      {/* Updated shortcode options with three columns */}
      {!isCallActive && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-600 mb-3">Quick Access</h3>
          <div className="grid grid-cols-3 gap-2">
            {shortcodes.map((item, index) => (
              <Button
                key={index}
                variant="outline"
                className="flex flex-col items-start justify-start h-auto min-h-[80px] p-2 border border-gray-200 rounded-md hover:bg-gray-50"
                onClick={() => setShortcode(item.code)}
                disabled={!isJanusConnected}
              >
                <div className="flex items-center gap-1 mb-1">
                  {item.icon}
                  <span className="text-xs font-medium">{item.name}</span>
                </div>
                <span className="text-xs text-gray-500 mb-1">{item.description}</span>
                <div className="text-xs font-mono bg-gray-100 rounded px-1">
                  {item.code}<span className="text-gray-400">{item.placeholder}</span>
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
