
import React, { useEffect } from "react";
import IncomingCallDialog from "@/components/dialpad/IncomingCallDialog";
import { useIncomingCall } from "@/hooks/useIncomingCall";
import { Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import janusService from "@/services/JanusService";

const IncomingCallHandler = () => {
  // Use the hook directly instead of getting it from useJanusSetup
  const { 
    incomingCall, 
    handleAcceptCall, 
    handleRejectCall,
    handleIncomingCall,  // Make sure we destructure this function
    notificationsEnabled
  } = useIncomingCall();
  
  const { toast } = useToast();
  
  // Register the incoming call handler with the Janus service
  useEffect(() => {
    janusService.setOnIncomingCall((from, jsep) => {
      console.log("IncomingCallHandler: Received incoming call from", from);
      if (from) {
        // Pass the incoming call to the hook
        handleIncomingCall(from, jsep);
      }
    });
    
    return () => {
      // Clean up by setting null handler
      janusService.setOnIncomingCall(null);
    };
  }, [handleIncomingCall]); // Add handleIncomingCall to the dependency array
  
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
  }, [incomingCall, notificationsEnabled, toast]);
  
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
