import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { FileCog, Mic, Shield, Volume2, Video } from "lucide-react";
import AudioEnhancementTab from "./sip-config/AudioEnhancementTab";
import VideoSettingsTab from "./sip-config/VideoSettingsTab";
import SystemLogsTab from "./sip-config/SystemLogsTab";
import AboutTab from "./sip-config/AboutTab";

const SIPConfig = () => {
  const [noiseCancellation, setNoiseCancellation] = useState(true);
  const [echoSuppression, setEchoSuppression] = useState(true);
  const [autoGainControl, setAutoGainControl] = useState(true);
  const [highPassFilter, setHighPassFilter] = useState(false);

  const [videoEnabled, setVideoEnabled] = useState(true);
  const [hdVideo, setHdVideo] = useState(false);

  return (
    <div className="w-full max-w-lg mx-auto p-6">
      <h2 className="text-xl font-semibold mb-6">Settings</h2>
      <Tabs defaultValue="audio">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="audio">Audio Enhancement</TabsTrigger>
          <TabsTrigger value="video">Video Settings</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>
        <TabsContent value="audio">
          <AudioEnhancementTab
            noiseCancellation={noiseCancellation}
            setNoiseCancellation={setNoiseCancellation}
            echoSuppression={echoSuppression}
            setEchoSuppression={setEchoSuppression}
            autoGainControl={autoGainControl}
            setAutoGainControl={setAutoGainControl}
            highPassFilter={highPassFilter}
            setHighPassFilter={setHighPassFilter}
          />
        </TabsContent>
        <TabsContent value="video">
          <VideoSettingsTab
            videoEnabled={videoEnabled}
            setVideoEnabled={setVideoEnabled}
            hdVideo={hdVideo}
            setHdVideo={setHdVideo}
          />
        </TabsContent>
        <TabsContent value="logs">
          <SystemLogsTab />
        </TabsContent>
        <TabsContent value="about">
          <AboutTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SIPConfig;
