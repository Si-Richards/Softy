
import React from "react";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { DraggableDialogContent } from "@/components/ui/draggable-dialog";
import Dialpad from "@/components/Dialpad";

interface PageHeaderProps {
  doNotDisturb: boolean;
  setDoNotDisturb: (state: boolean) => void;
  userPresence: "available" | "away" | "busy" | "offline";
  connectionStatus: "connected" | "disconnected" | "connecting";
}

const PageHeader = ({ doNotDisturb, setDoNotDisturb, userPresence, connectionStatus }: PageHeaderProps) => {
  return (
    <header className="p-4 border-b">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-softphone-dark">My Company</h1>
        
        <div className="flex items-center space-x-4">
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
