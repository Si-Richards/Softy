import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useCallHistory } from "@/hooks/useCallHistory";
import janusService from "@/services/JanusService";

export const useIncomingCall = () => {
  const [incomingCall, setIncomingCall] = useState<{ from: string; jsep: any } | null>(null);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const { toast } = useToast();
  const { addCallToHistory } = useCallHistory();

  const handleIncomingCall = useCallback((from: string, jsep: any) => {
    console.log(`Incoming call from ${from} with JSEP:`, jsep);
    setIncomingCall({ from, jsep });
    
    // Record the incoming call
    const incomingTime = new Date();
    setCallStartTime(incomingTime);
  }, [setIncomingCall, setCallStartTime]);

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

  // Reset call data when call ends
  const handleCallEnded = useCallback(() => {
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
  }, [incomingCall, callStartTime, addCallToHistory]);

  return {
    incomingCall,
    handleAcceptCall,
    handleRejectCall,
    handleIncomingCall,
    handleCallEnded
  };
};
