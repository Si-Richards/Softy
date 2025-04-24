import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import VideoDisplay from "./dialpad/VideoDisplay";
import DialpadGrid from "./dialpad/DialpadGrid";
import NumberInput from "./dialpad/NumberInput";
import CallControls from "./dialpad/CallControls";
import { useJanusSetup } from "./dialpad/useJanusSetup";
import janusService from "@/services/JanusService";

const Dialpad = () => {
  const [number, setNumber] = useState("");
  const [muted, setMuted] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { isJanusConnected, errorMessage } = useJanusSetup();
  const voicemailNumber = "*97";

  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key;
      const validKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '#'];
      
      if (validKeys.includes(key)) {
        event.preventDefault();
        playDTMFTone(key);
        handleKeyPress(key);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const playDTMFTone = (key: string) => {
    if (!audioContext.current) {
      audioContext.current = new AudioContext();
    }

    const ctx = audioContext.current;
    const frequencies = getDTMFFrequencies(key);
    
    if (!frequencies) return;

    const oscillator1 = ctx.createOscillator();
    const oscillator2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator1.frequency.value = frequencies[0];
    oscillator2.frequency.value = frequencies[1];

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(ctx.destination);

    gainNode.gain.value = 0.1;
    oscillator1.start();
    oscillator2.start();

    setTimeout(() => {
      oscillator1.stop();
      oscillator2.stop();
    }, 100);
  };

  const getDTMFFrequencies = (key: string): [number, number] | null => {
    const frequencies: { [key: string]: [number, number] } = {
      '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
      '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
      '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
      '*': [941, 1209], '0': [941, 1336], '#': [941, 1477]
    };
    return frequencies[key] || null;
  };

  useEffect(() => {
    if (isCallActive) {
      const localStream = janusService.getLocalStream();
      const remoteStream = janusService.getRemoteStream();
      
      console.log("Local stream in Dialpad:", localStream);
      console.log("Remote stream in Dialpad:", remoteStream);
      
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    }
  }, [isCallActive]);

  const handleKeyPress = (key: string) => {
    setNumber((prev) => prev + key);
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
