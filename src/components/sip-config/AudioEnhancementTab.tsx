
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

interface AudioEnhancementTabProps {
  noiseCancellation: boolean;
  setNoiseCancellation: (b: boolean) => void;
  echoSuppression: boolean;
  setEchoSuppression: (b: boolean) => void;
  autoGainControl: boolean;
  setAutoGainControl: (b: boolean) => void;
  highPassFilter: boolean;
  setHighPassFilter: (b: boolean) => void;
}

const AudioEnhancementTab: React.FC<AudioEnhancementTabProps> = ({
  noiseCancellation,
  setNoiseCancellation,
  echoSuppression,
  setEchoSuppression,
  autoGainControl,
  setAutoGainControl,
  highPassFilter,
  setHighPassFilter,
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Audio Enhancement</CardTitle>
      <CardDescription>Configure audio processing settings</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base" htmlFor="noise-cancellation">Noise Cancellation</Label>
          <p className="text-sm text-gray-500">
            Reduce background noise during calls
          </p>
        </div>
        <Switch 
          id="noise-cancellation" 
          checked={noiseCancellation} 
          onCheckedChange={setNoiseCancellation} 
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base" htmlFor="echo-suppression">Echo Suppression</Label>
          <p className="text-sm text-gray-500">
            Prevent audio echo during calls
          </p>
        </div>
        <Switch 
          id="echo-suppression" 
          checked={echoSuppression} 
          onCheckedChange={setEchoSuppression} 
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base" htmlFor="gain-control">Auto Gain Control</Label>
          <p className="text-sm text-gray-500">
            Automatically adjust microphone sensitivity
          </p>
        </div>
        <Switch 
          id="gain-control" 
          checked={autoGainControl} 
          onCheckedChange={setAutoGainControl} 
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base" htmlFor="high-pass">High Pass Filter</Label>
          <p className="text-sm text-gray-500">
            Remove low frequency noise
          </p>
        </div>
        <Switch 
          id="high-pass" 
          checked={highPassFilter} 
          onCheckedChange={setHighPassFilter} 
        />
      </div>
      
      <div className="space-y-2 pt-4">
        <Label htmlFor="noise-level">Noise Reduction Level</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Low</span>
          <Slider
            id="noise-level"
            defaultValue={[3]}
            max={5}
            min={1}
            step={1}
            className="flex-1"
          />
          <span className="text-sm text-gray-500">High</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default AudioEnhancementTab;
