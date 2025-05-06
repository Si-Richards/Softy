
import React from "react";
import AppLayout from "@/components/app/AppLayout";
import { useAppState } from "@/hooks/useAppState";

const Index = () => {
  const {
    activeTab,
    setActiveTab,
    connectionStatus,
    doNotDisturb,
    userPresence,
    incomingCall,
    handleAcceptCall,
    handleRejectCall,
    handleDoNotDisturbChange
  } = useAppState();

  return (
    <AppLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      connectionStatus={connectionStatus}
      doNotDisturb={doNotDisturb}
      userPresence={userPresence}
      handleDoNotDisturbChange={handleDoNotDisturbChange}
      incomingCall={incomingCall}
      handleAcceptCall={handleAcceptCall}
      handleRejectCall={handleRejectCall}
    />
  );
};

export default Index;
