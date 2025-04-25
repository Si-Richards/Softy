
import React from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Volume2 } from "lucide-react";

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
            <Slider
              id="master-volume"
              min={0}
              max={100}
              step={1}
              value={[masterVolume]}
              onValueChange={(values) => onMasterVolumeChange(values[0])}
            />
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
