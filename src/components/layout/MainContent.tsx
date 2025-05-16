
import React, { useEffect } from "react";
import Dialpad from "@/components/Dialpad";
import CallHistory from "@/components/CallHistory";
import Contacts from "@/components/Contacts";
import Messages from "@/components/Messages";
import Statistics from "@/components/Statistics";
import Voicemail from "@/components/Voicemail";
import AudioSettings from "@/components/AudioSettings";
import SIPConfig from "@/components/SIPConfig";
import ShortCodes from "@/components/ShortCodes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MainContentProps {
  doNotDisturb: boolean;
  setDoNotDisturb: (value: boolean) => void;
  userPresence: "available" | "away" | "busy" | "offline";
  connectionStatus: "connected" | "disconnected" | "connecting";
}

const MainContent = ({ doNotDisturb, setDoNotDisturb, userPresence, connectionStatus }: MainContentProps) => {
  const [activeTab, setActiveTab] = React.useState("dialpad");
  
  // Extract tab from URL hash (e.g., #contacts)
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash && ["dialpad", "contacts", "history", "messages", "statistics", "voicemail", "audio", "settings", "shortcodes"].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);
  
  // Update URL hash when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.location.hash = value;
  };

  return (
    <div className="flex-1 p-4">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-4 overflow-x-auto w-full justify-start">
          <TabsTrigger value="dialpad">Dialpad</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="history">Call History</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="voicemail">Voicemail</TabsTrigger>
          <TabsTrigger value="shortcodes">Short Codes</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="dialpad">
          <Dialpad />
        </TabsContent>
        <TabsContent value="contacts">
          <Contacts />
        </TabsContent>
        <TabsContent value="history">
          <CallHistory />
        </TabsContent>
        <TabsContent value="messages">
          <Messages />
        </TabsContent>
        <TabsContent value="statistics">
          <Statistics />
        </TabsContent>
        <TabsContent value="voicemail">
          <Voicemail />
        </TabsContent>
        <TabsContent value="shortcodes">
          <ShortCodes />
        </TabsContent>
        <TabsContent value="audio">
          <AudioSettings />
        </TabsContent>
        <TabsContent value="settings">
          <SIPConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MainContent;
