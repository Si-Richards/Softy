
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Video } from "lucide-react";

interface VideoSettingsTabProps {
  videoEnabled: boolean;
  setVideoEnabled: (b: boolean) => void;
  hdVideo: boolean;
  setHdVideo: (b: boolean) => void;
}

const VideoSettingsTab: React.FC<VideoSettingsTabProps> = ({
  videoEnabled,
  setVideoEnabled,
  hdVideo,
  setHdVideo,
}) => (
  <Card>
    <CardHeader>
      <CardTitle><Video className="inline-block mr-2" />Video Settings</CardTitle>
      <CardDescription>Configure video call preferences</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base" htmlFor="video-enabled">Enable Video</Label>
          <p className="text-sm text-gray-500">
            Allow video on calls.
          </p>
        </div>
        <Switch
          id="video-enabled"
          checked={videoEnabled}
          onCheckedChange={setVideoEnabled}
        />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base" htmlFor="hd-video">HD Video</Label>
          <p className="text-sm text-gray-500">
            Enable HD quality for video calls (higher bandwidth).
          </p>
        </div>
        <Switch
          id="hd-video"
          checked={hdVideo}
          onCheckedChange={setHdVideo}
          disabled={!videoEnabled}
        />
      </div>
    </CardContent>
  </Card>
);

export default VideoSettingsTab;
