
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
    // Ensure SIP host format is correct (with port)
    const hostParts = sipHost.split(':');
    const host = hostParts[0];
    const port = hostParts.length > 1 ? hostParts[1] : '5060';
    const completeHost = `${host}:${port}`;
    
    console.log(`Attempting to register with username: ${username}, host: ${completeHost} (UDP)`);
    console.log(`SIP transport: UDP, port: ${port}`);
    
    // Test SIP server connectivity before registration attempt
    try {
      await testSipServerConnectivity(host, port);
    } catch (error) {
      console.warn(`SIP server connectivity test warning: ${error}`);
      // Continue with registration despite warning
    }
    
    // Pass credentials to the SIP registration service
    await janusService.register(username, password, completeHost);
    
    setProgressValue(80);
    
    // Extended check for registration success with increased timeout
    return new Promise((resolve) => {
      // Start checking registration status repeatedly
      let checkCount = 0;
      const maxChecks = 15; // Increased from 10 to 15
      const checkInterval = 2000; // Increased from 1000 to 2000ms
      
      const checkRegistration = () => {
        checkCount++;
        console.log(`Checking registration status (attempt ${checkCount}/${maxChecks})...`);
        
        if (janusService.isRegistered()) {
          console.log("SIP Registration confirmed successful");
          setRegistrationStatus("connected");
          setProgressValue(100);
          setIsLoading(false);
          
          // Save credentials to localStorage
          try {
            localStorage.setItem('sipCredentials', JSON.stringify({ 
              username, 
              password, 
              sipHost: completeHost 
            }));
            console.log("Credentials saved to localStorage");
          } catch (error) {
            console.error("Error saving credentials:", error);
          }
          
          toast({
            title: "Registration Successful",
            description: "SIP credentials saved and connected",
          });
          
          resolve(true);
          return;
        }
        
        // Continue checking if we haven't exceeded max attempts
        if (checkCount < maxChecks) {
          setTimeout(checkRegistration, checkInterval);
        } else {
          // Registration failed after all attempts
          console.warn(`SIP Registration check failed after ${maxChecks} attempts`);
          setRegistrationStatus("failed");
          setIsLoading(false);
          setErrorMessage(`Registration timed out after ${maxChecks * checkInterval/1000} seconds. Please check your credentials and try again.`);
          toast({
            title: "Registration Failed",
            description: "Registration timed out. Please check your credentials and try again.",
            variant: "destructive",
          });
          resolve(false);
        }
      };
      
      // Start the registration check loop
      setTimeout(checkRegistration, 2000); // Increased from 1000 to 2000ms
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Test SIP server connectivity before attempting registration
 * This helps diagnose network-related issues early
 */
const testSipServerConnectivity = async (host: string, port: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log(`Testing connectivity to SIP server ${host}:${port}...`);
    
    // In a browser environment, we can't directly ping the server
    // Instead, we'll use the WebRTC connection status as a proxy
    if (!janusService.isJanusConnected()) {
      reject(new Error("WebRTC server not connected, cannot test SIP server"));
      return;
    }
    
    // We're relying on the WebRTC server being connected as an indication
    // that the network is generally working
    console.log("WebRTC connection is active, network appears to be working");
    console.log(`SIP server will be contacted via the WebRTC gateway at ${host}:${port}`);
    resolve();
  });
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
  
  console.error(errorMsg);
  setErrorMessage(errorMsg);
  toast({
    title: "Registration Failed",
    description: errorMsg,
    variant: "destructive",
  });
};
