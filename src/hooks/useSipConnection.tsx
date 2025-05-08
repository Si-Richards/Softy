
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import janusService from "@/services/JanusService";

export type SipConnectionStatus = "idle" | "connecting" | "connected" | "failed";

export interface UseSipConnectionResult {
  username: string;
  setUsername: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  sipHost: string;
  setSipHost: (value: string) => void;
  isLoading: boolean;
  registrationStatus: SipConnectionStatus;
  errorMessage: string | null;
  handleSave: () => Promise<void>;
  handleForgetCredentials: () => void;
}

export function useSipConnection(): UseSipConnectionResult {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [sipHost, setSipHost] = useState("hpbx.voicehost.co.uk:5060");
  const [isLoading, setIsLoading] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<SipConnectionStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Function to save credentials and connect
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
    setErrorMessage(null);

    try {
      // Initialize Janus if not already connected
      if (!janusService.isJanusConnected()) {
        console.log("Initializing Janus connection...");
        await janusService.initialize({
          server: 'wss://devrtc.voicehost.io:443/janus',
          apiSecret: 'overlord',
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
          ],
          success: () => {
            console.log("Janus initialized successfully");
          },
          error: (error) => {
            console.error("Janus initialization error:", error);
            throw new Error(`Connection error: ${error}`);
          }
        });
      }

      // Set up event handlers
      janusService.setOnRegistrationSuccess(() => {
        console.log("SIP Registration successful");
        setRegistrationStatus("connected");
        setIsLoading(false);
        
        // Save credentials to localStorage
        try {
          localStorage.setItem('sipCredentials', JSON.stringify({ 
            username, 
            password, 
            sipHost
          }));
        } catch (error) {
          console.error("Error saving credentials:", error);
        }
        
        toast({
          title: "Registration Successful",
          description: "SIP credentials saved and connected",
        });
      });
      
      janusService.setOnRegistrationFailed((error) => {
        console.error("SIP registration failed:", error);
        setRegistrationStatus("failed");
        setIsLoading(false);
        setErrorMessage(error);
        toast({
          title: "Registration Failed",
          description: error,
          variant: "destructive",
        });
      });
      
      janusService.setOnError((error) => {
        console.error("SIP error:", error);
        setRegistrationStatus("failed");
        setIsLoading(false);
        setErrorMessage(error);
        toast({
          title: "SIP Error",
          description: error,
          variant: "destructive",
        });
      });
      
      // Register with SIP server
      await janusService.register(username, password, sipHost);
      
    } catch (error: any) {
      console.error("Registration error:", error);
      setRegistrationStatus("failed");
      setIsLoading(false);
      setErrorMessage(error.message || String(error));
      toast({
        title: "Registration Error",
        description: error.message || String(error),
        variant: "destructive",
      });
    }
  };

  // Function to forget credentials
  const handleForgetCredentials = () => {
    try {
      localStorage.removeItem('sipCredentials');
    } catch (error) {
      console.error("Error removing stored credentials:", error);
    }

    setUsername("");
    setPassword("");
    setSipHost("hpbx.voicehost.co.uk:5060");
    setRegistrationStatus("idle");
    setErrorMessage(null);
    
    // Disconnect from Janus
    if (janusService.isJanusConnected()) {
      janusService.disconnect();
    }
    
    toast({
      title: "Credentials Removed",
      description: "Your SIP credentials have been forgotten",
    });
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
    handleSave,
    handleForgetCredentials
  };
}
