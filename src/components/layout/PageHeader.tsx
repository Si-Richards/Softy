
import React from "react";
import { Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BellOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { DraggableDialogContent } from "@/components/ui/draggable-dialog";
import Dialpad from "@/components/Dialpad";

type UserPresence = "available" | "away" | "busy" | "offline";
type ConnectionStatus = "connected" | "disconnected" | "connecting";

interface PageHeaderProps {
  doNotDisturb: boolean;
  setDoNotDisturb: (state: boolean) => void;
  userPresence: UserPresence;
  connectionStatus: ConnectionStatus;
}

const PageHeader = ({ doNotDisturb, setDoNotDisturb, userPresence, connectionStatus }: PageHeaderProps) => {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "bg-softphone-success";
      case "connecting":
        return "bg-yellow-500";
      case "disconnected":
        return "bg-red-500";
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "disconnected":
        return "Disconnected";
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
  };

  return (
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
              {getStatusText()}
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
  );
};

export default PageHeader;
