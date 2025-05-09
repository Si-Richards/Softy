
import { useEffect, useState } from 'react';
import janusService from "@/services/JanusService";
import { useIncomingCall } from '@/hooks/useIncomingCall';
import { useJanusInitialization } from '@/hooks/useJanusInitialization';
import audioService from '@/services/AudioService';

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
      // Ensure audio service is ready for the call
      const remoteStream = janusService.getRemoteStream();
      if (remoteStream) {
        console.log("Call connected, ensuring audio service has the stream");
        audioService.attachStream(remoteStream);
      }
    });

    janusService.setOnCallEnded(() => {
      // Call handleCallEnded from useIncomingCall to update history
      handleCallEnded();
      
      // Clean up audio service when call ends
      audioService.detachStream();
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
      
      // Log more detailed status including audio track info
      if (connected) {
        const hasAudioTracks = janusService.hasAudioTracks();
        const audioTracks = janusService.getAudioTracks();
        
        console.log("Connection status check:", {
          janusConnected: connected,
          sipRegistered: registered,
          hasAudioTracks,
          audioTrackCount: audioTracks.length,
          audioTracksActive: audioTracks.filter(t => t.readyState === 'live' && !t.muted).length
        });
      }
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
