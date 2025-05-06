
import janusService from "@/services/JanusService";
import { toast } from "@/hooks/use-toast";
import { SipConnectionStatus } from "./sipConnectionTypes";

/**
 * Load previously stored SIP credentials
 */
export const loadStoredCredentials = (): { 
  username: string; 
  password: string; 
  sipHost: string 
} => {
  const defaultValues = {
    username: "",
    password: "",
    sipHost: "hpbx.voicehost.co.uk"
  };
  
  try {
    const storedCredentials = localStorage.getItem('sipCredentials');
    if (storedCredentials) {
      const { username, password, sipHost } = JSON.parse(storedCredentials);
      return {
        username: username || defaultValues.username,
        password: password || defaultValues.password,
        sipHost: sipHost || defaultValues.sipHost
      };
    }
  } catch (error) {
    console.error("Error loading stored credentials:", error);
  }
  
  return defaultValues;
};

/**
 * Remove stored credentials and reset SIP connection
 */
export const forgetCredentials = (
  setUsername: (value: string) => void,
  setPassword: (value: string) => void,
  setSipHost: (value: string) => void,
  setRegistrationStatus: React.Dispatch<React.SetStateAction<SipConnectionStatus>>,
  setErrorMessage: (error: string | null) => void
): void => {
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
