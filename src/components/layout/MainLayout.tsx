
import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import PageHeader from "./PageHeader";
import MainContent from "./MainContent";
import MobileDialpadDrawer from "./MobileDialpadDrawer";
import IncomingCallHandler from "./IncomingCallHandler";
import { useJanusSetup } from "@/components/dialpad/useJanusSetup";

type UserPresence = "available" | "away" | "busy" | "offline";

const MainLayout = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("disconnected");
  const [doNotDisturb, setDoNotDisturb] = useState(false);
  const [userPresence, setUserPresence] = useState<UserPresence>("available");
  
  const { isJanusConnected } = useJanusSetup();
  
  useEffect(() => {
    if (isJanusConnected) {
      setConnectionStatus("connected");
    }
  }, [isJanusConnected]);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className="w-full max-w-5xl mx-auto my-8 bg-white rounded-xl shadow-lg overflow-hidden flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="flex-1 flex flex-col">
          <PageHeader 
            doNotDisturb={doNotDisturb}
            setDoNotDisturb={setDoNotDisturb}
            userPresence={userPresence}
            connectionStatus={connectionStatus}
          />
          
          <MainContent activeTab={activeTab} />
        </div>
      </div>

      <MobileDialpadDrawer />
      <IncomingCallHandler />
    </div>
  );
};

export default MainLayout;
