
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AudioEnhancementTab from "./sip-config/AudioEnhancementTab";
import VideoSettingsTab from "./sip-config/VideoSettingsTab";
import SystemLogsTab from "./sip-config/SystemLogsTab";
import AboutTab from "./sip-config/AboutTab";
import SipCredentialsTab from "./sip-config/SipCredentialsTab";
import { useSettings } from "@/hooks/useSettings";

const SIPConfig = () => {
  const { 
    audioSettings, 
    setAudioSettings,
    videoSettings,
    setVideoSettings 
  } = useSettings();

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
            noiseCancellation={audioSettings.noiseCancellation}
            setNoiseCancellation={(value) => 
              setAudioSettings(prev => ({ ...prev, noiseCancellation: value }))}
            echoSuppression={audioSettings.echoSuppression}
            setEchoSuppression={(value) => 
              setAudioSettings(prev => ({ ...prev, echoSuppression: value }))}
            autoGainControl={audioSettings.autoGainControl}
            setAutoGainControl={(value) => 
              setAudioSettings(prev => ({ ...prev, autoGainControl: value }))}
            highPassFilter={audioSettings.highPassFilter}
            setHighPassFilter={(value) => 
              setAudioSettings(prev => ({ ...prev, highPassFilter: value }))}
          />
        </TabsContent>
        <TabsContent value="video">
          <VideoSettingsTab
            videoEnabled={videoSettings.videoEnabled}
            setVideoEnabled={(value) => 
              setVideoSettings(prev => ({ ...prev, videoEnabled: value }))}
            hdVideo={videoSettings.hdVideo}
            setHdVideo={(value) => 
              setVideoSettings(prev => ({ ...prev, hdVideo: value }))}
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
