
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Volume2, Mic, Speaker } from "lucide-react";
import { useMediaDevices } from "@/hooks/useMediaDevices";

const AudioSettings = () => {
  const {
    audioInputs,
    audioOutputs,
    videoInputs,
    selectedAudioInput,
    selectedAudioOutput,
    selectedVideoInput,
    setSelectedAudioInput,
    setSelectedAudioOutput,
    setSelectedVideoInput,
  } = useMediaDevices();

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
            <Select value={selectedAudioInput} onValueChange={setSelectedAudioInput}>
              <SelectTrigger id="microphone">
                <SelectValue placeholder="Select microphone" />
              </SelectTrigger>
              <SelectContent>
                {audioInputs.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <Speaker className="w-5 h-5 mr-2 text-softphone-accent" />
            <h3 className="font-medium">Speaker</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="speaker">Output device</Label>
            <Select value={selectedAudioOutput} onValueChange={setSelectedAudioOutput}>
              <SelectTrigger id="speaker">
                <SelectValue placeholder="Select speaker" />
              </SelectTrigger>
              <SelectContent>
                {audioOutputs.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Speaker ${device.deviceId.slice(0, 5)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {videoInputs.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Camera</h3>
            <div className="space-y-2">
              <Label htmlFor="camera">Video device</Label>
              <Select value={selectedVideoInput} onValueChange={setSelectedVideoInput}>
                <SelectTrigger id="camera">
                  <SelectValue placeholder="Select camera" />
                </SelectTrigger>
                <SelectContent>
                  {videoInputs.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioSettings;
