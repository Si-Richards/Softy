
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import userInteractionService from "@/services/UserInteractionService";

interface AudioStatusProps {
  isCallActive: boolean;
}

const AudioStatus: React.FC<AudioStatusProps> = ({ isCallActive }) => {
  const [needsInteraction, setNeedsInteraction] = useState(false);

  // Simple user interaction check
  useEffect(() => {
    if (isCallActive && !userInteractionService.userHasInteracted()) {
      setNeedsInteraction(true);
    } else {
      setNeedsInteraction(false);
    }
  }, [isCallActive]);

  // Simple play handler - just triggers user interaction
  const handlePlayAudio = async () => {
    console.log("🎵 User clicked play audio - registering interaction");
    
    // Register user interaction
    userInteractionService.forceInteractionState(true);
    setNeedsInteraction(false);
    
    // Try to find and play the remote audio element created by SipCallManager
    const audio = document.getElementById("remoteAudio") as HTMLAudioElement;
    if (audio) {
      try {
        await audio.play();
        console.log("🎵 Audio element played successfully");
      } catch (error) {
        console.log("🎵 Audio play failed, showing controls:", error);
        audio.controls = true;
        audio.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9999;
          border: 2px solid red;
          border-radius: 8px;
          background: white;
          padding: 10px;
        `;
      }
    }
  };

  // Show user interaction prompt if needed
  if (isCallActive && needsInteraction) {
    return (
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
        <p className="mb-3 text-sm">Click to enable audio playback</p>
        <Button 
          onClick={handlePlayAudio}
          className="bg-softphone-accent hover:bg-softphone-accent/90 text-white"
        >
          <Play className="mr-1 h-4 w-4" /> Enable Audio
        </Button>
      </div>
    );
  }

  // Simple call status
  if (isCallActive) {
    return (
      <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <span className="text-sm text-gray-700">Audio Call Active</span>
      </div>
    );
  }

  return null;
};

export default AudioStatus;
