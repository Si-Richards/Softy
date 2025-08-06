import { useEffect, useState } from 'react';
import janusService from "@/services/JanusService";
import { useIncomingCall } from '@/hooks/useIncomingCall';
import { useJanusInitialization } from '@/hooks/useJanusInitialization';

export const useJanusSetup = () => {
  const {
    incomingCall,
    handleAcceptCall,
    handleRejectCall,
    handleIncomingCall,
    handleCallEnded,
    notificationsEnabled
  } = useIncomingCall();

  const {
    isJanusConnected,
    isRegistered,
    errorMessage,
    initializeJanus,
    registerWithJanus,
    handleError,
    setIsJanusConnected,
    setIsRegistered
  } = useJanusInitialization();

  // Perform a connection status check on component mount and periodically
  useEffect(() => {
    // Set up Janus event handlers
    janusService.setOnIncomingCall(handleIncomingCall);

    janusService.setOnCallConnected(() => {
      // This is handled by useCallControls
    });

    janusService.setOnCallEnded(() => {
      // Call handleCallEnded from useIncomingCall to update history
      handleCallEnded();
    });

    janusService.setOnError(handleError);

    // Check if Janus is already initialized
    if (janusService.isJanusConnected()) {
      setIsJanusConnected(true);
      
      if (janusService.isRegistered()) {
        setIsRegistered(true);
      }
    }

    // Setup periodic check (every 10 seconds) for connection status
    const checkConnectionInterval = setInterval(() => {
      const connected = janusService.isJanusConnected();
      const registered = janusService.isRegistered();
      
      setIsJanusConnected(connected);
      setIsRegistered(registered);
      
      console.log("Connection status check: Janus connected:", connected, "SIP registered:", registered);
    }, 10000);

    return () => {
      clearInterval(checkConnectionInterval);
      // Don't disconnect on unmount - we want to keep the connection active for the entire app session
    };
  }, [handleIncomingCall, handleCallEnded, handleError, setIsJanusConnected, setIsRegistered]);

  return {
    isJanusConnected,
    isRegistered,
    errorMessage,
    incomingCall,
    handleAcceptCall,
    handleRejectCall,
    initializeJanus,
    registerWithJanus,
    janusService,
    notificationsEnabled
  };
};
