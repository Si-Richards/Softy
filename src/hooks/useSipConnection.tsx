
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import janusService from "@/services/JanusService";
import { SipConnectionStatus, UseSipConnectionResult } from "./sip/sipConnectionTypes";
import { 
  initializeJanusConnection, 
  performRegistration, 
  handleRegistrationError 
} from "./sip/sipConnectionInit";
import { 
  loadStoredCredentials, 
  forgetCredentials 
} from "./sip/sipCredentialsManager";

export type { SipConnectionStatus } from "./sip/sipConnectionTypes";

export function useSipConnection(): UseSipConnectionResult {
  // Load initial credentials from localStorage
  const storedCreds = loadStoredCredentials();
  
  // State management
  const [username, setUsername] = useState(storedCreds.username);
  const [password, setPassword] = useState(storedCreds.password);
  const [sipHost, setSipHost] = useState(storedCreds.sipHost);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<SipConnectionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState(0);
  const [serverChecked, setServerChecked] = useState(false);

  const { toast } = useToast();

  // Check registration status on mount and periodically
  useEffect(() => {
    // Set up error handler
    const errorHandler = (error: string) => {
      console.error("SIP Error in handler:", error);
      setErrorMessage(error);
      setRegistrationStatus("failed");
      setIsLoading(false);
      toast({
        title: "Registration Error",
        description: error,
        variant: "destructive",
      });
    };
    
    janusService.setOnError(errorHandler);

    // Check if already registered on mount
    if (janusService.isRegistered()) {
      console.log("SIP Registration detected on component mount");
      setRegistrationStatus("connected");
      setProgressValue(100);
    }

    // Progress animation for a better UX
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (registrationStatus === "connecting") {
      let progress = 0;
      interval = setInterval(() => {
        progress += 5;
        if (progress > 95) {
          progress = 95; // Cap at 95% until we get confirmation
        }
        setProgressValue(progress);
      }, 200);
    } else {
      setProgressValue(registrationStatus === "connected" ? 100 : 0);
    }

    // Setup periodic check for registration status
    const statusCheckInterval = setInterval(() => {
      if (janusService.isRegistered()) {
        setRegistrationStatus("connected");
      } else if (janusService.isJanusConnected() && registrationStatus === "connected") {
        // We were connected but now we're not
        setRegistrationStatus("failed");
        setErrorMessage("SIP registration lost. Please reconnect.");
        toast({
          title: "Registration Lost",
          description: "SIP registration has been lost. Please reconnect.",
          variant: "destructive",
        });
      }
    }, 10000); // Check every 10 seconds

    // Cleanup when component unmounts
    return () => {
      if (interval) clearInterval(interval);
      clearInterval(statusCheckInterval);
    };
  }, [registrationStatus, toast]);

  // Main function to save credentials and connect
  const handleSave = async () => {
    // Form validation
    if (!username || !password) {
      toast({
        title: "Validation Error",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setRegistrationStatus("connecting");
    setProgressValue(10);
    setErrorMessage(null);

    try {
      // Check if Janus is already connected or connect to it
      if (!janusService.isJanusConnected()) {
        console.log("Janus not connected, initializing...");
        await initializeJanusConnection(setProgressValue, setServerChecked);
      } else {
        console.log("Janus already connected, skipping initialization");
        setProgressValue(30);
        setServerChecked(true);
      }

      // If server check was successful, proceed with registration
      if (serverChecked) {
        await performRegistration(
          username, 
          password, 
          sipHost, 
          setProgressValue, 
          setRegistrationStatus, 
          setIsLoading, 
          setErrorMessage
        );
      }
    } catch (error: any) {
      handleRegistrationError(
        error, 
        setRegistrationStatus, 
        setIsLoading, 
        setErrorMessage
      );
    }
  };

  // Function to forget credentials and reset
  const handleForgetCredentials = () => {
    forgetCredentials(
      setUsername, 
      setPassword, 
      setSipHost, 
      setRegistrationStatus, 
      setErrorMessage
    );
  };

  return {
    username,
    setUsername,
    password,
    setPassword,
    sipHost,
    setSipHost,
    isLoading,
    registrationStatus,
    errorMessage,
    progressValue,
    serverChecked,
    handleSave,
    handleForgetCredentials
  };
}
