
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, X, Mic, MicOff, Video, Voicemail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import janusService from "@/services/JanusService";

const Dialpad = () => {
  const [number, setNumber] = useState("");
  const [muted, setMuted] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isJanusConnected, setIsJanusConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const voicemailNumber = "*97";

  const dialpadButtons = [
    "1", "2", "3",
    "4", "5", "6",
    "7", "8", "9",
    "*", "0", "#"
  ];

  useEffect(() => {
    // Set up Janus event handlers
    janusService.setOnIncomingCall((from) => {
      toast({
        title: "Incoming Call",
        description: `Call from ${from}`,
      });
    });

    janusService.setOnCallConnected(() => {
      toast({
        title: "Call Connected",
        description: "You are now connected",
      });
      
      // Attach remote stream to video element
      if (remoteVideoRef.current && janusService.getRemoteStream()) {
        remoteVideoRef.current.srcObject = janusService.getRemoteStream();
      }
    });

    janusService.setOnCallEnded(() => {
      setIsCallActive(false);
      setIsVideoEnabled(false);
      toast({
        title: "Call Ended",
        description: "The call has ended",
      });
    });

    janusService.setOnError((error) => {
      setErrorMessage(error);
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    });

    // Initialize Janus (you would replace this URL with your actual Janus server)
    // This is commented out since we don't have an actual Janus server to connect to in this example
    // initializeJanus();

    // Clean up on component unmount
    return () => {
      if (isJanusConnected) {
        janusService.disconnect();
      }
    };
  }, [toast]);

  const initializeJanus = async () => {
    try {
      await janusService.initialize({
        server: 'wss://devrtc.voicehost.io:443/janus',
        apiSecret: 'overlord',
        success: () => {
          setIsJanusConnected(true);
          toast({
            title: "WebRTC Ready",
            description: "Connected to Janus WebRTC server",
          });
          
          // Register with a random username
          registerWithJanus();
        },
        error: (error) => {
          console.error("Janus initialization error:", error);
          setErrorMessage("Failed to connect to WebRTC server");
        }
      });
    } catch (error) {
      console.error("Janus initialization error:", error);
      setErrorMessage("Failed to connect to WebRTC server");
    }
  };

  const registerWithJanus = async () => {
    try {
      // Register with a random username
      const username = "user_" + Math.floor(Math.random() * 10000);
      await janusService.register(username);
      
      // Set local stream if available
      if (localVideoRef.current && janusService.getLocalStream()) {
        localVideoRef.current.srcObject = janusService.getLocalStream();
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage("Failed to register with WebRTC server");
    }
  };

  const handleKeyPress = (key: string) => {
    setNumber((prev) => prev + key);
  };

  const clearNumber = () => {
    setNumber("");
  };

  const backspace = () => {
    setNumber((prev) => prev.slice(0, -1));
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
        // Fallback to simulate a call when Janus is not connected
        setIsCallActive(true);
        toast({
          title: "Simulated Call",
          description: "WebRTC server not connected. This is a simulated call.",
        });
      }
    }
  };

  const toggleMute = () => {
    setMuted(!muted);
    
    // Mute/unmute audio tracks in the local stream
    if (janusService.getLocalStream()) {
      janusService.getLocalStream()?.getAudioTracks().forEach(track => {
        track.enabled = muted; // We're toggling, so use the current state before it changes
      });
    }
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    
    // Enable/disable video tracks in the local stream
    if (janusService.getLocalStream()) {
      janusService.getLocalStream()?.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled; // We're toggling, so use the current state before it changes
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

  return (
    <div className="w-full max-w-md mx-auto p-6">
      {/* Video Elements - Hidden when not in a video call */}
      {isVideoEnabled && isCallActive && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="aspect-video bg-gray-800 rounded overflow-hidden">
            <video 
              ref={localVideoRef} 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="aspect-video bg-gray-800 rounded overflow-hidden">
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {errorMessage}
        </div>
      )}

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
