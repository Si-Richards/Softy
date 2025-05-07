
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
      // Use port 443 for WebSocket connections
      server: 'wss://devrtc.voicehost.io:443/janus',
      apiSecret: 'overlord',
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
    // Make sure sipHost contains the UDP port 5060
    const hostParts = sipHost.split(':');
    const host = hostParts[0];
    const completeHost = hostParts.length > 1 ? sipHost : `${host}:5060`;
    
    console.log(`Attempting to register with username: ${username}, host: ${completeHost} (UDP)`);
    
    // Pass credentials to the SIP registration service
    await janusService.register(username, password, completeHost);
    
    setProgressValue(80);
    
    // Extended check for registration success with increased timeout
    return new Promise((resolve) => {
      // Start checking registration status repeatedly
      let checkCount = 0;
      const maxChecks = 10;
      const checkInterval = 1000; // 1 second
      
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
          console.warn("SIP Registration check failed after multiple attempts");
          setRegistrationStatus("failed");
          setIsLoading(false);
          setErrorMessage("Registration timed out. Please check your credentials and try again.");
          toast({
            title: "Registration Failed",
            description: "Registration timed out. Please check your credentials and try again.",
            variant: "destructive",
          });
          resolve(false);
        }
      };
      
      // Start the registration check loop
      setTimeout(checkRegistration, 1000);
    });
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
  
  // Add specific guidance for error code 446
  if (error.message && error.message.includes('446')) {
    errorMsg = `${errorMsg} Your username may be incorrectly formatted.`;
  }
  
  // Add specific guidance for Sofia SIP stack errors
  if (error.message && (error.message.includes('Missing session') || error.message.includes('Sofia stack'))) {
    errorMsg = "Server SIP stack not initialized. Please try again in a few moments.";
  }
  
  // Add guidance for UDP-specific issues
  if (error.message && error.message.includes('timeout')) {
    errorMsg = "Connection timed out. Make sure your SIP server accepts UDP connections on port 5060.";
  }
  
  console.error(errorMsg);
  setErrorMessage(errorMsg);
  toast({
    title: "Registration Failed",
    description: errorMsg,
    variant: "destructive",
  });
};
