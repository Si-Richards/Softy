
import React from "react";
import { Button } from "@/components/ui/button";
import { VolumeIcon, RefreshCw } from "lucide-react";
import { AudioElementHandler } from "@/services/janus/utils/audioElementHandler";
import { useToast } from "@/hooks/use-toast";
import janusService from "@/services/JanusService";

const AudioCheckButton = ({ isCallActive }: { isCallActive: boolean }) => {
  const { toast } = useToast();
  
  const checkAudio = () => {
    if (!isCallActive) {
      toast({
        title: "No active call",
        description: "There is no active call to check audio for.",
        variant: "default",
      });
      return;
    }
    
    // Log the current audio state
    AudioElementHandler.logAudioState();
    
    // Get the remote stream from the service
    const remoteStream = janusService.getRemoteStream();
    
    if (!remoteStream) {
      toast({
        title: "No audio stream",
        description: "No remote audio stream detected.",
        variant: "destructive",
      });
      return;
    }
    
    // Log audio track information
    const tracks = remoteStream.getAudioTracks();
    console.log(`Remote stream has ${tracks.length} audio tracks`);
    tracks.forEach((track, idx) => {
      console.log(`Audio track ${idx}:`, {
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState
      });
      
      // Ensure track is enabled
      if (!track.enabled) {
        console.log("Re-enabling audio track");
        track.enabled = true;
      }
    });
    
    // Try to force audio playback
    AudioElementHandler.forcePlay()
      .then(() => {
        toast({
          title: "Audio check complete",
          description: "Audio playback has been restarted.",
          variant: "default",
        });
      })
      .catch(error => {
        toast({
          title: "Audio issue detected",
          description: "Could not restart audio. Please try interacting with the page.",
          variant: "destructive",
        });
        
        // Make audio element visible with controls for user interaction
        const audio = AudioElementHandler.getAudioElement();
        audio.controls = true;
        audio.style.display = 'block';
        audio.style.position = 'fixed';
        audio.style.bottom = '10px';
        audio.style.right = '10px';
        audio.style.zIndex = '1000';
      });
  };
  
  if (!isCallActive) return null;
  
  return (
    <Button 
      onClick={checkAudio}
      variant="outline" 
      size="sm"
      className="flex items-center gap-1"
    >
      <VolumeIcon className="h-4 w-4 mr-1" />
      <span>Check Audio</span>
      <RefreshCw className="h-3 w-3 ml-1" />
    </Button>
  );
};

export default AudioCheckButton;
