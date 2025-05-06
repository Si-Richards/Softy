
import React from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/app/Header";
import MainContent from "@/components/app/MainContent";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Phone } from "lucide-react";
import Dialpad from "@/components/Dialpad";
import IncomingCallDialog from "@/components/dialpad/IncomingCallDialog";

interface AppLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  connectionStatus: "connected" | "disconnected" | "connecting";
  doNotDisturb: boolean;
  userPresence: "available" | "away" | "busy" | "offline";
  handleDoNotDisturbChange: (checked: boolean) => void;
  incomingCall: { from: string; jsep: any } | null;
  handleAcceptCall: () => void;
  handleRejectCall: () => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  setActiveTab,
  connectionStatus,
  doNotDisturb,
  userPresence,
  handleDoNotDisturbChange,
  incomingCall,
  handleAcceptCall,
  handleRejectCall,
}) => {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className="w-full max-w-5xl mx-auto my-8 bg-white rounded-xl shadow-lg overflow-hidden flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="flex-1 flex flex-col">
          <Header
            connectionStatus={connectionStatus}
            userPresence={userPresence}
            doNotDisturb={doNotDisturb}
            onDoNotDisturbChange={handleDoNotDisturbChange}
          />
          
          <MainContent activeTab={activeTab} />
        </div>
      </div>

      <Drawer>
        <DrawerTrigger className="fixed bottom-6 right-6 md:hidden z-50 bg-softphone-primary text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg">
          <Phone className="h-6 w-6" />
        </DrawerTrigger>
        <DrawerContent className="p-4">
          <Dialpad />
        </DrawerContent>
      </Drawer>

      {incomingCall && (
        <IncomingCallDialog
          isOpen={!!incomingCall}
          callerNumber={incomingCall.from}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}
    </div>
  );
};

export default AppLayout;
