
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VideoDeviceSelectProps {
  devices: MediaDeviceInfo[];
  selectedDevice: string;
  onDeviceChange: (deviceId: string) => void;
}

const VideoDeviceSelect = ({ devices, selectedDevice, onDeviceChange }: VideoDeviceSelectProps) => {
  if (devices.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Camera</h3>
      <div className="space-y-2">
        <Label htmlFor="camera">Video device</Label>
        <Select value={selectedDevice} onValueChange={onDeviceChange}>
          <SelectTrigger id="camera">
            <SelectValue placeholder="Select camera" />
          </SelectTrigger>
          <SelectContent>
            {devices.map((device) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default VideoDeviceSelect;
