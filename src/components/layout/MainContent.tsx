
import React from "react";
import QuickDial from "@/components/QuickDial";
import Dialpad from "@/components/Dialpad";
import CallHistory from "@/components/CallHistory";
import Contacts from "@/components/Contacts";
import Messages from "@/components/Messages";
import Voicemail from "@/components/Voicemail";
import Statistics from "@/components/Statistics";
import SIPConfig from "@/components/SIPConfig";

const MainContent = () => {
  // Use the URL hash to determine which tab is active
  const getActiveTab = () => {
    // Default to home if no hash is present
    if (!window.location.hash) {
      return "home";
    }
    
    // Remove the "#" character and return the rest
    return window.location.hash.substring(1);
  };
  
  const activeTab = getActiveTab();
  
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
