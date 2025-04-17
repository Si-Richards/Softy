
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Volume2, Mic, Speaker } from "lucide-react";

const AudioSettings = () => {
  const [micVolume, setMicVolume] = useState(75);
  const [speakerVolume, setSpeakerVolume] = useState(50);
  
  // Mock devices
  const mockMicrophones = [
    { id: "mic1", name: "Built-in Microphone" },
    { id: "mic2", name: "Headset Microphone" },
    { id: "mic3", name: "USB Microphone" },
  ];
  
  const mockSpeakers = [
    { id: "spk1", name: "Built-in Speakers" },
    { id: "spk2", name: "Headset" },
    { id: "spk3", name: "External Speakers" },
  ];

  const mockRingtones = [
    { id: "ring1", name: "Default" },
    { id: "ring2", name: "Classic" },
    { id: "ring3", name: "Modern" },
    { id: "ring4", name: "Subtle" },
  ];

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <h2 className="text-xl font-semibold mb-6">Audio Settings</h2>
      
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center">
            <Mic className="w-5 h-5 mr-2 text-softphone-accent" />
            <h3 className="font-medium">Microphone</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="microphone">Input device</Label>
            <Select defaultValue="mic1">
              <SelectTrigger id="microphone">
                <SelectValue placeholder="Select microphone" />
              </SelectTrigger>
              <SelectContent>
                {mockMicrophones.map((mic) => (
                  <SelectItem key={mic.id} value={mic.id}>
                    {mic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="mic-volume">Input volume</Label>
              <span className="text-sm text-gray-500">{micVolume}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-gray-500" />
              <Slider
                id="mic-volume"
                min={0}
                max={100}
                step={1}
                value={[micVolume]}
                onValueChange={(value) => setMicVolume(value[0])}
                className="flex-1"
              />
              <Volume2 className="w-4 h-4 text-gray-500" />
            </div>
          </div>
          
          <Button variant="outline" size="sm" className="mt-2">
            Test Microphone
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <Speaker className="w-5 h-5 mr-2 text-softphone-accent" />
            <h3 className="font-medium">Speaker</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="speaker">Output device</Label>
            <Select defaultValue="spk1">
              <SelectTrigger id="speaker">
                <SelectValue placeholder="Select speaker" />
              </SelectTrigger>
              <SelectContent>
                {mockSpeakers.map((spk) => (
                  <SelectItem key={spk.id} value={spk.id}>
                    {spk.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="speaker-volume">Output volume</Label>
              <span className="text-sm text-gray-500">{speakerVolume}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-gray-500 opacity-50" />
              <Slider
                id="speaker-volume"
                min={0}
                max={100}
                step={1}
                value={[speakerVolume]}
                onValueChange={(value) => setSpeakerVolume(value[0])}
                className="flex-1"
              />
              <Volume2 className="w-4 h-4 text-gray-500" />
            </div>
          </div>
          
          <Button variant="outline" size="sm" className="mt-2">
            Play Test Sound
          </Button>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-medium">Ringtone</h3>
          <div className="space-y-2">
            <Label htmlFor="ringtone">Select ringtone</Label>
            <Select defaultValue="ring1">
              <SelectTrigger id="ringtone">
                <SelectValue placeholder="Select ringtone" />
              </SelectTrigger>
              <SelectContent>
                {mockRingtones.map((ring) => (
                  <SelectItem key={ring.id} value={ring.id}>
                    {ring.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioSettings;
