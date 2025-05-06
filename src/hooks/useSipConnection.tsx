
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
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

  const { toast } = useToast();

  // Load stored credentials on mount
  useEffect(() => {
    try {
      const storedCredentials = localStorage.getItem('sipCredentials');
      if (storedCredentials) {
        const { username: storedUsername, password: storedPassword, sipHost: storedHost } = JSON.parse(storedCredentials);
        setUsername(storedUsername || "");
        setPassword(storedPassword || "");
        setSipHost(storedHost || "hpbx.voicehost.co.uk");
      }
    } catch (error) {
      console.error("Error loading stored credentials:", error);
    }
  }, []);

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

  const initializeJanusConnection = async () => {
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

  const performRegistration = async () => {
    try {
      console.log(`Attempting to register with username: ${username}, host: ${sipHost}`);
      
      // Pass credentials to the SIP registration service
      await janusService.register(username, password, sipHost);
      
      setProgressValue(80);
      
      // Check if registration was successful after a short delay
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
        }
      }, 5000); // Increased timeout to 5 seconds for more reliability
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
        console.log("Janus not connected, initializing...");
        await initializeJanusConnection();
      } else {
        console.log("Janus already connected, skipping initialization");
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

  const handleForgetCredentials = () => {
    // Remove stored credentials
    try {
      localStorage.removeItem('sipCredentials');
    } catch (error) {
      console.error("Error removing stored credentials:", error);
    }

    // Reset form state
    setUsername("");
    setPassword("");
    setSipHost("hpbx.voicehost.co.uk");
    setRegistrationStatus("idle");
    setErrorMessage(null);
    
    // Show toast notification
    toast({
      title: "Credentials Removed",
      description: "Your SIP credentials have been forgotten.",
    });

    // Disconnect from Janus if connected
    if (janusService.isJanusConnected()) {
      janusService.disconnect();
    }
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
    handleSave,
    handleForgetCredentials
  };
}
