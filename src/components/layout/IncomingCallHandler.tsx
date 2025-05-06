
import React from "react";
import IncomingCallDialog from "@/components/dialpad/IncomingCallDialog";
import { useJanusSetup } from "@/components/dialpad/useJanusSetup";

const IncomingCallHandler = () => {
  const { 
    incomingCall, 
    handleAcceptCall, 
    handleRejectCall
  } = useJanusSetup();
  
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
