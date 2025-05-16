
import React from "react";
import QuickDial from "@/components/QuickDial";
import Dialpad from "@/components/Dialpad";
import CallHistory from "@/components/CallHistory";
import Contacts from "@/components/Contacts";
import Messages from "@/components/Messages";
import Voicemail from "@/components/Voicemail";
import Statistics from "@/components/Statistics";
import SIPConfig from "@/components/SIPConfig";

interface MainContentProps {
  activeTab: string;
}

const MainContent = ({
  activeTab
}: MainContentProps) => {
  const renderActiveTab = () => {
    switch (activeTab) {
      case "home":
        return <QuickDial />;
      case "dialpad":
        return <Dialpad />;
      case "history":
        return <CallHistory />;
      case "contacts":
        return <Contacts />;
      case "messages":
        return <Messages />;
      case "voicemail":
        return <Voicemail />;
      case "statistics":
        return <Statistics />;
      case "settings":
        return <SIPConfig />;
      default:
        return <QuickDial />;
    }
  };

  return <div className="flex-1 overflow-auto px-[5px]">
      {renderActiveTab()}
    </div>;
};

export default MainContent;
