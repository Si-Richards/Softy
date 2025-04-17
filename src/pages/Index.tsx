
import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Dialpad from "@/components/Dialpad";
import CallHistory from "@/components/CallHistory";
import Contacts from "@/components/Contacts";
import AudioSettings from "@/components/AudioSettings";
import SIPConfig from "@/components/SIPConfig";
import CallStatus from "@/components/CallStatus";
import Messages from "@/components/Messages";
import { cn } from "@/lib/utils";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dialpad");
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("disconnected");

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dialpad":
        return <Dialpad />;
      case "history":
        return <CallHistory />;
      case "contacts":
        return <Contacts />;
      case "messages":
        return <Messages />;
      case "audio":
        return <AudioSettings />;
      case "settings":
        return <SIPConfig />;
      default:
        return <Dialpad />;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "bg-softphone-success";
      case "connecting":
        return "bg-yellow-500";
      case "disconnected":
        return "bg-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Main Application Container */}
      <div className="w-full max-w-5xl mx-auto my-8 bg-white rounded-xl shadow-lg overflow-hidden flex">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold text-softphone-dark">SIP Softphone</h1>
              
              <div className="flex items-center space-x-2">
                <div className={cn("h-2.5 w-2.5 rounded-full", getStatusColor())}></div>
                <span className="text-sm font-medium text-gray-600">
                  {connectionStatus === "connected" ? "Connected" : 
                   connectionStatus === "connecting" ? "Connecting..." : "Disconnected"}
                </span>
              </div>
            </div>
          </header>
          
          {/* Active Tab Content */}
          <div className="flex-1 overflow-auto">
            {renderActiveTab()}
          </div>
          
          {/* Footer Status Bar */}
          <footer className="p-3 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <CallStatus status="idle" />
              <span className="text-xs text-gray-500">Ready to make calls</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Index;
