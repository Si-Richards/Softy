
import { useEffect } from 'react';
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
    if (janusService.isRegistered()) {
      setIsJanusConnected(true);
      setIsRegistered(true);
    }

    return () => {
      // Don't disconnect on unmount - we want to keep the connection active for the entire app session
      // We'll handle disconnection separately when the user logs out or the app closes
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
