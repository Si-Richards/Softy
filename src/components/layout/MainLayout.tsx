
import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import PageHeader from "./PageHeader";
import MainContent from "./MainContent";
import MobileDialpadDrawer from "./MobileDialpadDrawer";
import IncomingCallHandler from "./IncomingCallHandler";
import { useJanusSetup } from "@/components/dialpad/useJanusSetup";

// Define user presence type
type UserPresence = "available" | "away" | "busy" | "offline";

const MainLayout = () => {
  // State management
  const [activeTab, setActiveTab] = useState("home");
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("disconnected");
  const [doNotDisturb, setDoNotDisturb] = useState(false);
  const [userPresence, setUserPresence] = useState<UserPresence>("available");
  
  // Get Janus connection status
  const { isJanusConnected, isRegistered } = useJanusSetup();
  
  // Update connection status when Janus connection changes
  useEffect(() => {
    console.log("MainLayout: isJanusConnected =", isJanusConnected, "isRegistered =", isRegistered);
    
    if (isJanusConnected) {
      if (isRegistered) {
        setConnectionStatus("connected");
      } else {
        // Connected to WebRTC server but not registered with SIP
        setConnectionStatus("connecting");
      }
    } else {
      setConnectionStatus("disconnected");
    }
  }, [isJanusConnected, isRegistered]);

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

      {/* Mobile and call handling elements */}
      <MobileDialpadDrawer />
      <IncomingCallHandler />
    </div>
  );
};

export default MainLayout;
