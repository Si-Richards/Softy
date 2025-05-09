
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AudioEnhancementTab from "./sip-config/AudioEnhancementTab";
import AudioVolumeSettings from "./sip-config/AudioVolumeSettings";
import SystemLogsTab from "./sip-config/SystemLogsTab";
import AboutTab from "./sip-config/AboutTab";
import SipCredentialsTab from "./sip-config/SipCredentialsTab";
import { useSettings } from "@/hooks/useSettings";
import AudioSettings from "@/components/AudioSettings";

interface SIPConfigProps {
  activeTab?: string;
}

const SIPConfig: React.FC<SIPConfigProps> = ({ activeTab = "settings" }) => {
  const [currentTab, setCurrentTab] = useState("sip");
  const { audioSettings, setAudioSettings } = useSettings();

  useEffect(() => {
    // If devices tab was selected in the sidebar, switch to the devices tab
    if (activeTab === "devices") {
      setCurrentTab("devices");
    }
  }, [activeTab]);

  const handleMasterVolumeChange = (value: number) => {
    setAudioSettings(prev => ({ ...prev, masterVolume: value }));
  };

  const handleRingtoneVolumeChange = (value: number) => {
    setAudioSettings(prev => ({ ...prev, ringtoneVolume: value }));
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-6">Settings</h2>
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="sip">SIP</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>
        <TabsContent value="sip">
          <SipCredentialsTab />
        </TabsContent>
        <TabsContent value="audio">
          <div className="space-y-8">
            <AudioVolumeSettings 
              masterVolume={audioSettings.masterVolume || 100}
              ringtoneVolume={audioSettings.ringtoneVolume || 100}
              onMasterVolumeChange={handleMasterVolumeChange}
              onRingtoneVolumeChange={handleRingtoneVolumeChange}
            />
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
          </div>
        </TabsContent>
        <TabsContent value="devices">
          <AudioSettings />
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
