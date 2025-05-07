import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AudioEnhancementTab from "./sip-config/AudioEnhancementTab";
import VideoSettingsTab from "./sip-config/VideoSettingsTab";
import SystemLogsTab from "./sip-config/SystemLogsTab";
import AboutTab from "./sip-config/AboutTab";
import SipCredentialsTab from "./sip-config/SipCredentialsTab";

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
      <Tabs defaultValue="sip">
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="sip">SIP</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
          <TabsTrigger value="video">Video</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>
        <TabsContent value="sip">
          <SipCredentialsTab />
        </TabsContent>
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
