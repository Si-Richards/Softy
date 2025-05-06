
import { useState, useEffect } from 'react';
import { useJanusSetup } from "@/components/dialpad/useJanusSetup";

type UserPresence = "available" | "away" | "busy" | "offline";
type ConnectionStatus = "connected" | "disconnected" | "connecting";

export const useAppState = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [doNotDisturb, setDoNotDisturb] = useState(false);
  const [userPresence, setUserPresence] = useState<UserPresence>("available");
  const [isDialpadOpen, setIsDialpadOpen] = useState(false);
  
  const { 
    incomingCall, 
    handleAcceptCall, 
    handleRejectCall,
    isJanusConnected
  } = useJanusSetup();
  
  useEffect(() => {
    if (isJanusConnected) {
      setConnectionStatus("connected");
    }
  }, [isJanusConnected]);

  useEffect(() => {
    if (incomingCall) {
      console.log("Index received incoming call:", incomingCall);
    }
  }, [incomingCall]);
  
  const handleDoNotDisturbChange = (checked: boolean) => {
    setDoNotDisturb(checked);
    // When enabling DND, we remember the previous presence state
    // but display the user as busy/DND to others
  };

  return {
    activeTab,
    setActiveTab,
    connectionStatus,
    setConnectionStatus,
    doNotDisturb,
    setDoNotDisturb,
    userPresence,
    setUserPresence,
    isDialpadOpen,
    setIsDialpadOpen,
    incomingCall,
    handleAcceptCall,
    handleRejectCall,
    handleDoNotDisturbChange
  };
};
