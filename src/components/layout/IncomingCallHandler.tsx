
import React, { useEffect, useRef } from "react";
import IncomingCallDialog from "@/components/dialpad/IncomingCallDialog";
import { useIncomingCall } from "@/hooks/useIncomingCall";
import { Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import janusService from "@/services/JanusService";

const IncomingCallHandler = () => {
  // Track if we've already set up the handler
  const handlerSetupRef = useRef(false);
  
  const { 
    incomingCall, 
    handleAcceptCall, 
    handleRejectCall,
    handleIncomingCall,
    notificationsEnabled
  } = useIncomingCall();
  
  const { toast } = useToast();
  
  // Register the incoming call handler with the Janus service - but only once
  useEffect(() => {
    // Only set up the handler if it hasn't been set up before
    if (!handlerSetupRef.current) {
      console.log("IncomingCallHandler: Setting up incoming call handler (first time)");
      janusService.setOnIncomingCall((from, jsep) => {
        console.log("IncomingCallHandler: Received incoming call from", from);
        if (from) {
          // Pass the incoming call to the hook
          handleIncomingCall(from, jsep);
        }
      });
      
      // Mark that we've set up the handler
      handlerSetupRef.current = true;
    }
    
    return () => {
      // We don't want to remove the handler on every unmount
      // Only if the component is fully unmounted from the application
      if (handlerSetupRef.current && !document.body.contains(document.getElementById('incoming-call-handler'))) {
        console.log("IncomingCallHandler: Cleaning up incoming call handler");
        janusService.setOnIncomingCall(null);
        handlerSetupRef.current = false;
      }
    };
  }, [handleIncomingCall]);
  
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
    <div id="incoming-call-handler">
      <IncomingCallDialog
        isOpen={!!incomingCall}
        callerNumber={incomingCall.from}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />
    </div>
  );
};

export default IncomingCallHandler;
