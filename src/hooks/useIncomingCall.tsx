import { useState, useCallback, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useCallHistory } from "@/hooks/useCallHistory";
import janusService from "@/services/JanusService";
import { PhoneIncoming, BellRing } from "lucide-react";
import { AudioCallOptions } from '@/services/janus/sip/types';

export const useIncomingCall = () => {
  const [incomingCall, setIncomingCall] = useState<{ from: string; jsep: any } | null>(null);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const { toast } = useToast();
  const { addCallToHistory } = useCallHistory();
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);

  // Check and request notification permissions on component mount
  useEffect(() => {
    const checkNotificationPermission = async () => {
      // Check if the browser supports notifications
      if (!("Notification" in window)) {
        console.log("This browser does not support desktop notifications");
        return;
      }

      // Check if permission is already granted
      if (Notification.permission === "granted") {
        setNotificationsEnabled(true);
        return;
      }

      // Otherwise, request permission
      if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        setNotificationsEnabled(permission === "granted");
      }
    };

    checkNotificationPermission();
  }, []);

  const showNativeNotification = useCallback((title: string, body: string) => {
    if (!notificationsEnabled) return;
    
    try {
      const notification = new Notification(title, {
        body: body,
        icon: "/favicon.ico", // Use your app's icon
        tag: "incoming-call", // Tag to replace previous notifications
        requireInteraction: true // Keeps notification visible until user interacts with it
      });
      
      // Handle notification clicks
      notification.onclick = () => {
        window.focus(); // Focus the window when notification is clicked
        notification.close();
      };
      
      // Automatically close after 30 seconds (in case user doesn't interact)
      setTimeout(() => notification.close(), 30000);
    } catch (error) {
      console.error("Error showing native notification:", error);
    }
  }, [notificationsEnabled]);

  const handleIncomingCall = useCallback((from: string, jsep: any) => {
    console.log(`Incoming call from ${from} with JSEP:`, jsep);
    setIncomingCall({ from, jsep });
    
    // Record the incoming call
    const incomingTime = new Date();
    setCallStartTime(incomingTime);
    
    // Show in-app toast notification
    toast({
      title: "Incoming Call",
      description: `Call from ${from}`,
      duration: 10000, // 10 seconds
      action: (
        <div className="flex items-center">
          <PhoneIncoming className="mr-2 h-4 w-4" />
        </div>
      )
    });
    
    // Show native browser notification
    showNativeNotification("Incoming Call", `Call from ${from}`);
  }, [setIncomingCall, setCallStartTime, toast, showNativeNotification]);

  const getAudioOptions = (): AudioCallOptions => {
    // Get stored audio settings
    let audioSettings: any = {};
    try {
      const storedSettings = localStorage.getItem('audioSettings');
      if (storedSettings) {
        audioSettings = JSON.parse(storedSettings);
      }
    } catch (error) {
      console.error("Error parsing audio settings:", error);
    }
    
    // Get selected devices
    const audioInput = localStorage.getItem('selectedAudioInput');
    const audioOutput = localStorage.getItem('selectedAudioOutput');
    
    return {
      audioInput,
      audioOutput,
      echoCancellation: audioSettings.echoSuppression,
      noiseSuppression: audioSettings.noiseCancellation,
      autoGainControl: audioSettings.autoGainControl
    };
  };

  const handleAcceptCall = useCallback(async () => {
    if (incomingCall?.jsep) {
      try {
        console.log("Accepting incoming call with JSEP:", incomingCall.jsep);
        
        // Get audio options with selected audio devices
        const audioOptions = getAudioOptions();
        console.log("Using audio options for incoming call:", audioOptions);
        
        // Determine if this is a video call based on the SDP
        const isVideoCall = incomingCall.jsep.sdp.includes("m=video");
        
        await janusService.acceptCall(incomingCall.jsep, isVideoCall, audioOptions);
        toast({
          title: "Call Accepted",
          description: "You have accepted the call",
        });
        
        // Apply audio output device if supported
        const savedAudioOutput = audioOptions.audioOutput;
        if (savedAudioOutput) {
          setTimeout(() => {
            const remoteStream = janusService.getRemoteStream();
            if (remoteStream) {
              let audioElement = document.querySelector('audio#remoteAudio') as HTMLAudioElement;
              if (!audioElement) {
                audioElement = document.createElement('audio');
                audioElement.id = 'remoteAudio';
                audioElement.autoplay = true;
                document.body.appendChild(audioElement);
              }
              
              // Set the stream to the audio element
              audioElement.srcObject = remoteStream;
              
              // Set the audio output device if the browser supports it
              if ('setSinkId' in HTMLAudioElement.prototype) {
                (audioElement as any).setSinkId(savedAudioOutput)
                  .then(() => console.log("Audio output set to:", savedAudioOutput))
                  .catch((e: any) => console.error("Error setting audio output:", e));
              }
            }
          }, 500); // Small delay to ensure stream is available
        }
        
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
    handleCallEnded,
    notificationsEnabled
  };
};
