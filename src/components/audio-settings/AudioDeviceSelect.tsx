
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface AudioDeviceSelectProps {
  label: string;
  icon: React.ReactNode;
  deviceId: string;
  devices: MediaDeviceInfo[];
  onDeviceChange: (deviceId: string) => void;
  onTest: () => void;
  testButtonLabel: string;
}

const AudioDeviceSelect = ({
  label,
  icon,
  deviceId,
  devices,
  onDeviceChange,
  onTest,
  testButtonLabel,
}: AudioDeviceSelectProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center">
        {icon}
        <h3 className="font-medium">{label}</h3>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor={label.toLowerCase()}>{label}</Label>
        <Select value={deviceId} onValueChange={onDeviceChange}>
          <SelectTrigger id={label.toLowerCase()}>
            <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {devices.map((device) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                {device.label || `${label} ${device.deviceId.slice(0, 5)}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          onClick={onTest}
          className="mt-2 w-full"
        >
          {testButtonLabel}
        </Button>
      </div>
    </div>
  );
};

export default AudioDeviceSelect;
