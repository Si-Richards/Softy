
import janusService from "@/services/JanusService";
import { toast } from "@/hooks/use-toast";
import { SipConnectionStatus } from "./sipConnectionTypes";
import React from "react";

/**
 * Initialize Janus WebRTC connection
 */
export const initializeJanusConnection = async (
  setProgressValue: (value: number) => void,
  setServerChecked: (value: boolean) => void
): Promise<void> => {
  try {
    console.log("Initializing Janus connection...");
    
    // Initialize Janus with proper WebSocket URL and detailed debug logging
    await janusService.initialize({
      // Use port 443 for WebSocket connections - secure WebSockets
      server: 'wss://devrtc.voicehost.io:443/janus',
      apiSecret: 'overlord',
      // Add multiple STUN servers for better NAT traversal (based on Janus demo)
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun.voip.eutelia.it:3478' }
      ],
      debug: "all", // Enable full debugging
      success: () => {
        console.log("Janus initialized successfully");
        setProgressValue(30);
        setServerChecked(true);
      },
      error: (error) => {
        console.error("Janus initialization error:", error);
        throw new Error(`Connection error: ${error}`);
      }
    });
  } catch (error) {
    setServerChecked(false);
    throw error;
  }
};

/**
 * Perform SIP registration with provided credentials
 */
export const performRegistration = async (
  username: string,
  password: string,
  sipHost: string,
  setProgressValue: (value: number) => void,
  setRegistrationStatus: React.Dispatch<React.SetStateAction<SipConnectionStatus>>,
  setIsLoading: (loading: boolean) => void,
  setErrorMessage: (error: string | null) => void
): Promise<boolean> => {
  try {
    // Format credentials following Janus SIP demo approach
    console.log(`Attempting to register with username: ${username}, host: ${sipHost}`);
    
    // Register for the registration success event
    console.log("Setting up registration success handler");
    janusService.setOnRegistrationSuccess(() => {
      console.log("✅ SIP Registration confirmed successful via callback");
      setRegistrationStatus("connected");
      setProgressValue(100);
      setIsLoading(false);
      
      // Save credentials to localStorage
      try {
        localStorage.setItem('sipCredentials', JSON.stringify({ 
          username, 
          password, 
          sipHost
        }));
        console.log("Credentials saved to localStorage");
      } catch (error) {
        console.error("Error saving credentials:", error);
      }
      
      toast({
        title: "Registration Successful",
        description: "SIP credentials saved and connected",
      });
    });
    
    // Set up error handler for registration
    console.log("Setting up error handler");
    janusService.setOnError((error) => {
      console.error("⚠️ SIP registration error:", error);
      setRegistrationStatus("failed");
      setIsLoading(false);
      setErrorMessage(error);
      toast({
        title: "Registration Failed",
        description: error,
        variant: "destructive",
      });
    });
    
    // Pass credentials to the SIP registration service
    console.log("Sending registration request to Janus");
    await janusService.register(username, password, sipHost);
    setProgressValue(80);
    
    // Set a timeout for registration (we'll let the success handler change the status if it succeeds)
    setTimeout(() => {
      if (!janusService.isRegistered()) {
        console.warn("⚠️ SIP Registration check failed after timeout");
        setRegistrationStatus("failed");
        setIsLoading(false);
        setErrorMessage("Registration timed out. Please check your credentials and try again.");
        toast({
          title: "Registration Failed",
          description: "Registration timed out. Please check your credentials and try again.",
          variant: "destructive",
        });
        return false;
      }
    }, 30000); // Give it 30 seconds to register
    
    return true;
  } catch (error) {
    throw error;
  }
};

/**
 * Handle registration errors with user-friendly messages
 */
export const handleRegistrationError = (
  error: any,
  setRegistrationStatus: React.Dispatch<React.SetStateAction<SipConnectionStatus>>,
  setIsLoading: (loading: boolean) => void,
  setErrorMessage: (error: string | null) => void
): void => {
  setRegistrationStatus("failed");
  setIsLoading(false);
  
  // Enhanced error message for specific errors
  let errorMsg = `Registration error: ${error.message || error}`;
  
  // Add specific guidance for common errors
  if (error.message) {
    if (error.message.includes('446')) {
      errorMsg = `Username format error (446): Your username may be incorrectly formatted or contain invalid characters.`;
    } else if (error.message.includes('401') || error.message.includes('407')) {
      errorMsg = `Authentication failed (${error.message.includes('401') ? '401' : '407'}): Please verify your username and password are correct.`;
    } else if (error.message.includes('403')) {
      errorMsg = `Access forbidden (403): Your account may be disabled or you don't have permission to register.`;
    } else if (error.message.includes('404')) {
      errorMsg = `User not found (404): The username doesn't exist on this SIP server.`;
    } else if (error.message.includes('408') || error.message.includes('504')) {
      errorMsg = `Server timeout (${error.message.includes('408') ? '408' : '504'}): The SIP server did not respond in time.`;
    } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      errorMsg = `Connection timeout: The SIP server did not respond. Please check your network and the server address.`;
    } else if (error.message.includes('Missing session') || error.message.includes('Sofia stack')) {
      errorMsg = `SIP server error: The server's SIP stack is not ready. Please try again in a few moments.`;
    } else if (error.message.includes('transport')) {
      errorMsg = `Transport error: There was a problem with the UDP connection to the SIP server.`;
    }
  }
  
  console.error("❌", errorMsg);
  setErrorMessage(errorMsg);
  toast({
    title: "Registration Failed",
    description: errorMsg,
    variant: "destructive",
  });
};
