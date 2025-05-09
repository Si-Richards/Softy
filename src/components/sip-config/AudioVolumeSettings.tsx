
import React, { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Volume2 } from "lucide-react";
import audioVolumeManager from "@/services/AudioVolumeManager";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import audioService from "@/services/AudioService";

interface AudioVolumeSettingsProps {
  masterVolume: number;
  ringtoneVolume: number;
  onMasterVolumeChange: (value: number) => void;
  onRingtoneVolumeChange: (value: number) => void;
}

const AudioVolumeSettings = ({
  masterVolume,
  ringtoneVolume,
  onMasterVolumeChange,
  onRingtoneVolumeChange,
}: AudioVolumeSettingsProps) => {
  // Initialize the audio volume manager on component mount
  useEffect(() => {
    audioVolumeManager.initialize();
  }, []);
  
  // Update the AudioVolumeManager when settings change
  useEffect(() => {
    audioVolumeManager.setMasterVolume(masterVolume);
  }, [masterVolume]);
  
  useEffect(() => {
    audioVolumeManager.setRingtoneVolume(ringtoneVolume);
  }, [ringtoneVolume]);
  
  // Play a test sound to verify audio output
  const playTestSound = () => {
    // Create a simple oscillator for a test tone
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime); // Low volume
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start();
      
      // Stop after 0.5 second
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 500);
    } catch (error) {
      console.error("Error playing test sound:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center">
          <Volume2 className="w-5 h-5 mr-2 text-softphone-accent" />
          <h3 className="font-medium">Volume Controls</h3>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="master-volume">Master Volume</Label>
              <span className="text-sm text-gray-500">{masterVolume}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <Slider
                id="master-volume"
                min={0}
                max={100}
                step={1}
                value={[masterVolume]}
                onValueChange={(values) => onMasterVolumeChange(values[0])}
                className="flex-1"
              />
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 w-8 p-0 flex items-center justify-center"
                onClick={playTestSound}
                title="Play test sound"
              >
                <Play className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="ringtone-volume">Ringtone Volume</Label>
              <span className="text-sm text-gray-500">{ringtoneVolume}%</span>
            </div>
            <Slider
              id="ringtone-volume"
              min={0}
              max={100}
              step={1}
              value={[ringtoneVolume]}
              onValueChange={(values) => onRingtoneVolumeChange(values[0])}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioVolumeSettings;
