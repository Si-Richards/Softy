import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import janusService from "@/services/JanusService";
import { useCallHistory } from "@/hooks/useCallHistory";

export const useJanusSetup = () => {
  const [isJanusConnected, setIsJanusConnected] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ from: string; jsep: any } | null>(null);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const { toast } = useToast();
  const { addCallToHistory } = useCallHistory();

  useEffect(() => {
    // Set up Janus event handlers
    janusService.setOnIncomingCall((from, jsep) => {
      console.log(`Incoming call from ${from} with JSEP:`, jsep);
      setIncomingCall({ from, jsep });
      
      // Record the incoming call
      const incomingTime = new Date();
      setCallStartTime(incomingTime);
    });

    janusService.setOnCallConnected(() => {
      toast({
        title: "Call Connected",
        description: "You are now connected",
      });
    });

    janusService.setOnCallEnded(() => {
      toast({
        title: "Call Ended",
        description: "The call has ended",
      });
      
      // If we had an incoming call that ended, log it to history
      if (incomingCall && callStartTime) {
        const now = new Date();
        const durationMs = now.getTime() - callStartTime.getTime();
        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        addCallToHistory({
          number: incomingCall.from,
          name: incomingCall.from, // In a real app, this would be looked up from contacts
          time: callStartTime,
          duration: durationStr,
          type: "incoming",
          status: "completed"
        });
        
        setIncomingCall(null);
        setCallStartTime(null);
      }
    });

    janusService.setOnError((error) => {
      setErrorMessage(error);
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    });

    // Check if Janus is already initialized
    if (janusService.isRegistered()) {
      setIsJanusConnected(true);
      setIsRegistered(true);
    }

    return () => {
      // Don't disconnect on unmount - we want to keep the connection active for the entire app session
      // We'll handle disconnection separately when the user logs out or the app closes
    };
  }, [toast, addCallToHistory]);

  const handleAcceptCall = useCallback(async () => {
    if (incomingCall?.jsep) {
      try {
        console.log("Accepting incoming call with JSEP:", incomingCall.jsep);
        await janusService.acceptCall(incomingCall.jsep);
        toast({
          title: "Call Accepted",
          description: "You have accepted the call",
        });
        // We keep the incomingCall data until the call is ended
      } catch (error) {
        console.error("Error accepting call:", error);
        toast({
          title: "Error",
          description: "Failed to accept the call",
          variant: "destructive",
        });
      }
    } else {
      console.error("No incoming call JSEP available");
      toast({
        title: "Error",
        description: "Cannot accept call: missing call data",
        variant: "destructive",
      });
    }
  }, [incomingCall, toast]);

  const handleRejectCall = useCallback(() => {
    console.log("Rejecting incoming call");
    
    // Log the missed call to history
    if (incomingCall && callStartTime) {
      addCallToHistory({
        number: incomingCall.from,
        name: incomingCall.from, // In a real app, this would be looked up from contacts
        time: callStartTime,
        duration: "-",
        type: "incoming",
        status: "missed"
      });
    }
    
    janusService.hangup();
    setIncomingCall(null);
    setCallStartTime(null);
    
    toast({
      title: "Call Rejected",
      description: "You have rejected the call",
    });
  }, [toast, incomingCall, callStartTime, addCallToHistory]);

  const initializeJanus = async (username?: string, password?: string, host?: string) => {
    try {
      setErrorMessage(null);
      
      await janusService.initialize({
        server: 'wss://devrtc.voicehost.io:443/janus',
        apiSecret: 'overlord',
        success: () => {
          setIsJanusConnected(true);
          toast({
            title: "WebRTC Ready",
            description: "Connected to Janus WebRTC server",
          });
          
          // If credentials are provided, attempt to register
          if (username && password && host) {
            registerWithJanus(username, password, host);
          }
        },
        error: (error) => {
          console.error("Janus initialization error:", error);
          setErrorMessage("Failed to connect to WebRTC server");
        }
      });
    } catch (error) {
      console.error("Janus initialization error:", error);
      setErrorMessage("Failed to connect to WebRTC server");
    }
  };

  const registerWithJanus = async (username: string, password: string, host: string) => {
    try {
      if (!isJanusConnected) {
        await initializeJanus(username, password, host);
        return;
      }
      
      await janusService.register(username, password, host);
      setIsRegistered(true);
      toast({
        title: "SIP Registration Successful",
        description: "You are now registered with the SIP server",
      });
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage("Failed to register with SIP server");
      toast({
        title: "Registration Failed",
        description: "Failed to register with SIP server",
        variant: "destructive",
      });
    }
  };

  return {
    isJanusConnected,
    isRegistered,
    errorMessage,
    incomingCall,
    handleAcceptCall,
    handleRejectCall,
    initializeJanus,
    registerWithJanus,
    janusService
  };
};
