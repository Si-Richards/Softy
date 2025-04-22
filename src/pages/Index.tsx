
import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Dialpad from "@/components/Dialpad";
import CallHistory from "@/components/CallHistory";
import Contacts from "@/components/Contacts";
import AudioSettings from "@/components/AudioSettings";
import SIPConfig from "@/components/SIPConfig";
import CallStatus from "@/components/CallStatus";
import Messages from "@/components/Messages";
import Statistics from "@/components/Statistics";
import Voicemail from "@/components/Voicemail";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BellOff, X, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { DraggableDialogContent } from "@/components/ui/draggable-dialog";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import QuickDial from "@/components/QuickDial";

type UserPresence = "available" | "away" | "busy" | "offline";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("disconnected");
  const [doNotDisturb, setDoNotDisturb] = useState(false);
  const [userPresence, setUserPresence] = useState<UserPresence>("available");
  const [isDialpadOpen, setIsDialpadOpen] = useState(false);

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
      case "audio":
        return <AudioSettings />;
      case "settings":
        return <SIPConfig />;
      default:
        return <QuickDial />;
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

  const getPresenceColor = () => {
    if (doNotDisturb) return "bg-softphone-error";
    
    switch (userPresence) {
      case "available":
        return "bg-softphone-success";
      case "busy":
        return "bg-softphone-error";
      case "away":
        return "bg-yellow-500";
      case "offline":
        return "bg-gray-400";
    }
  };

  const getPresenceText = () => {
    if (doNotDisturb) return "Do Not Disturb";
    return userPresence.charAt(0).toUpperCase() + userPresence.slice(1);
  };

  const handleDoNotDisturbChange = (checked: boolean) => {
    setDoNotDisturb(checked);
    // When enabling DND, we remember the previous presence state
    // but display the user as busy/DND to others
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className="w-full max-w-5xl mx-auto my-8 bg-white rounded-xl shadow-lg overflow-hidden flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="flex-1 flex flex-col">
          <header className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold text-softphone-dark">My Company</h1>
              
              <div className="flex items-center space-x-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-2">
                        <div className={cn("h-3 w-3 rounded-full", getPresenceColor())}></div>
                        <span className="text-sm font-medium text-gray-600">
                          {getPresenceText()}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Your current presence status</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <div className="flex items-center space-x-2">
                  <Switch 
                    id="dnd-mode" 
                    checked={doNotDisturb} 
                    onCheckedChange={handleDoNotDisturbChange}
                  />
                  <Label htmlFor="dnd-mode" className="flex items-center gap-1 text-sm cursor-pointer">
                    <BellOff className={cn("h-4 w-4", doNotDisturb ? "text-softphone-error" : "text-gray-400")} />
                    DND
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <div className={cn("h-2.5 w-2.5 rounded-full", getStatusColor())}></div>
                  <span className="text-sm font-medium text-gray-600">
                    {connectionStatus === "connected" ? "Connected" : 
                     connectionStatus === "connecting" ? "Connecting..." : "Disconnected"}
                  </span>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="rounded-full bg-softphone-primary">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DraggableDialogContent className="sm:max-w-md">
                    <Dialpad />
                  </DraggableDialogContent>
                </Dialog>
              </div>
            </div>
          </header>
          
          <div className="flex-1 overflow-auto">
            {renderActiveTab()}
          </div>
          
          <footer className="p-3 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <CallStatus status="idle" />
              <span className="text-xs text-gray-500">Ready to make calls</span>
            </div>
          </footer>
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
    </div>
  );
};

export default Index;
