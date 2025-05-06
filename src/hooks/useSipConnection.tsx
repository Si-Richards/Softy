
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import janusService from "@/services/JanusService";

export type SipConnectionStatus = "idle" | "connecting" | "connected" | "failed";

export function useSipConnection() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [sipHost, setSipHost] = useState("hpbx.voicehost.co.uk");
  const [isLoading, setIsLoading] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<SipConnectionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState(0);
  const [serverChecked, setServerChecked] = useState(false);

  useEffect(() => {
    // Set up error handler
    janusService.setOnError((error) => {
      console.error("SIP Error in handler:", error);
      setErrorMessage(error);
      setRegistrationStatus("failed");
      setIsLoading(false);
      toast({
        title: "Registration Error",
        description: error,
        variant: "destructive",
      });
    });

    // Check if already registered
    if (janusService.isRegistered()) {
      setRegistrationStatus("connected");
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

    // Cleanup when component unmounts
    return () => {
      // Clear error handler
      janusService.setOnError(() => {});
      // Clear interval
      if (interval) clearInterval(interval);
    };
  }, [registrationStatus]);

  const initializeJanusConnection = async () => {
    try {
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
          throw new Error(`Connection error: ${error}`);
        }
      });
    } catch (error) {
      setServerChecked(false);
      throw error;
    }
  };

  const performRegistration = async () => {
    try {
      console.log(`Attempting to register with username: ${username}, host: ${sipHost}`);
      
      // Pass credentials to the SIP registration service
      await janusService.register(username, password, sipHost);
      
      setProgressValue(80);
      
      // Check if registration was successful after a short delay
      setTimeout(() => {
        if (janusService.isRegistered()) {
          setRegistrationStatus("connected");
          setProgressValue(100);
          setIsLoading(false);
          toast({
            title: "Registration Successful",
            description: "SIP credentials saved and connected",
          });
        } else {
          // If not registered after a delay, show an error
          setRegistrationStatus("failed");
          setIsLoading(false);
          setErrorMessage("Registration timed out. Please check your credentials and try again.");
        }
      }, 3000);
    } catch (error) {
      throw error;
    }
  };

  const handleRegistrationError = (error: any) => {
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
        await initializeJanusConnection();
      } else {
        setProgressValue(30);
        setServerChecked(true);
      }

      // If server check was successful, proceed with registration
      if (serverChecked) {
        await performRegistration();
      }
    } catch (error: any) {
      handleRegistrationError(error);
    }
  };

  return {
    username,
    setUsername,
    password,
    setPassword,
    sipHost,
    isLoading,
    registrationStatus,
    errorMessage,
    progressValue,
    handleSave
  };
}
