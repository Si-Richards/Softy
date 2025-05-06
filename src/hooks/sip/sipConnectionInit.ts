
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
    
    // Initialize Janus first with detailed debug logging
    await janusService.initialize({
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
    console.log(`Attempting to register with username: ${username}, host: ${sipHost}`);
    
    // Pass credentials to the SIP registration service
    await janusService.register(username, password, sipHost);
    
    setProgressValue(80);
    
    // Check if registration was successful after a short delay
    return new Promise((resolve) => {
      setTimeout(() => {
        if (janusService.isRegistered()) {
          console.log("SIP Registration confirmed successful");
          setRegistrationStatus("connected");
          setProgressValue(100);
          setIsLoading(false);
          
          // Save credentials to localStorage
          try {
            localStorage.setItem('sipCredentials', JSON.stringify({ username, password, sipHost }));
          } catch (error) {
            console.error("Error saving credentials:", error);
          }
          
          toast({
            title: "Registration Successful",
            description: "SIP credentials saved and connected",
          });
          
          resolve(true);
        } else {
          // If not registered after a delay, show an error
          console.warn("SIP Registration check failed after timeout");
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
      }, 5000); // 5 seconds timeout for more reliability
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
  
  console.error(errorMsg);
  setErrorMessage(errorMsg);
  toast({
    title: "Registration Failed",
    description: errorMsg,
    variant: "destructive",
  });
};
