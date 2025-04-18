import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, X, Mic, MicOff, Video, Voicemail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dialpad = () => {
  const [number, setNumber] = useState("");
  const [muted, setMuted] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);

  const dialpadButtons = [
    "1", "2", "3",
    "4", "5", "6",
    "7", "8", "9",
    "*", "0", "#"
  ];

  const handleKeyPress = (key: string) => {
    setNumber((prev) => prev + key);
  };

  const clearNumber = () => {
    setNumber("");
  };

  const backspace = () => {
    setNumber((prev) => prev.slice(0, -1));
  };

  const handleCall = () => {
    if (isCallActive) {
      setIsCallActive(false);
      setIsVideoEnabled(false);
    } else if (number) {
      setIsCallActive(true);
    }
  };

  const toggleMute = () => {
    setMuted(!muted);
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
  };

  const { toast } = useToast();
  const voicemailNumber = "*97";

  const callVoicemail = () => {
    setNumber(voicemailNumber);
    setIsCallActive(true);
    toast({
      title: "Calling voicemail",
      description: "Connecting to voicemail service...",
    });
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="mb-4 relative">
        <Input
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          className="text-2xl py-6 px-4 text-center font-medium"
          placeholder="Enter number"
        />
        {number && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
            onClick={clearNumber}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {dialpadButtons.map((btn) => (
          <Button
            key={btn}
            variant="outline"
            className="h-14 text-xl font-semibold hover:bg-softphone-accent hover:text-white"
            onClick={() => handleKeyPress(btn)}
          >
            {btn}
          </Button>
        ))}
      </div>

      <div className="flex justify-center space-x-4">
        <Button
          size="lg"
          className={`rounded-full w-16 h-16 ${
            isCallActive ? "bg-softphone-error hover:bg-red-600" : "bg-softphone-success hover:bg-green-600"
          }`}
          onClick={handleCall}
        >
          <Phone className={`h-6 w-6 ${isCallActive ? "rotate-135" : ""}`} />
        </Button>
        
        {isCallActive ? (
          <>
            <Button
              size="lg"
              variant={muted ? "destructive" : "outline"}
              className="rounded-full w-16 h-16"
              onClick={toggleMute}
            >
              {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
            
            <Button
              size="lg"
              variant={isVideoEnabled ? "default" : "outline"}
              className={`rounded-full w-16 h-16 ${isVideoEnabled ? "bg-softphone-accent" : ""}`}
              onClick={toggleVideo}
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
              onClick={callVoicemail}
            >
              <Voicemail className="h-6 w-6" />
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="rounded-full w-16 h-16 border-softphone-accent text-softphone-accent hover:bg-softphone-accent hover:text-white"
              onClick={() => {
                if (number) {
                  setIsCallActive(true);
                  setIsVideoEnabled(true);
                }
              }}
            >
              <Video className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Dialpad;
