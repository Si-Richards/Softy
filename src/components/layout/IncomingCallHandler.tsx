
import React, { useEffect } from "react";
import IncomingCallDialog from "@/components/dialpad/IncomingCallDialog";
import { useJanusSetup } from "@/components/dialpad/useJanusSetup";
import { Bell } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const IncomingCallHandler = () => {
  const { 
    incomingCall, 
    handleAcceptCall, 
    handleRejectCall,
    notificationsEnabled
  } = useJanusSetup();
  
  // Show notification permission reminder if not enabled
  useEffect(() => {
    if (incomingCall && !notificationsEnabled) {
      toast({
        title: "Enable Notifications",
        description: "Allow notifications to be alerted of incoming calls when browser is minimized",
        action: (
          <div className="flex items-center">
            <Bell className="mr-2 h-4 w-4" />
          </div>
        ),
        duration: 5000,
      });
    }
  }, [incomingCall, notificationsEnabled]);
  
  if (!incomingCall) return null;

  return (
    <IncomingCallDialog
      isOpen={!!incomingCall}
      callerNumber={incomingCall.from}
      onAccept={handleAcceptCall}
      onReject={handleRejectCall}
    />
  );
};

export default IncomingCallHandler;
