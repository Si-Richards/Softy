
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

interface SipCredentialsFormProps {
  username: string;
  setUsername: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  handleSave: () => void;
  isDisabled: boolean;
  isReadOnly?: boolean;
  buttonText: string;
  sipHost?: string;
  setSipHost?: (value: string) => void;
}

const SipCredentialsForm: React.FC<SipCredentialsFormProps> = ({
  username,
  setUsername,
  password,
  setPassword,
  handleSave,
  isDisabled,
  isReadOnly = false,
  buttonText,
  sipHost: externalSipHost,
  setSipHost: setExternalSipHost
}) => {
  const [internalSipHost, setInternalSipHost] = useState("hpbx.sipconvergence.co.uk:5060");

  // Sync internal state with external prop if provided
  useEffect(() => {
    if (externalSipHost) {
      // Ensure the host has port information
      const hostParts = externalSipHost.split(':');
      if (hostParts.length === 1) {
        // No port specified, add default port
        setInternalSipHost(`${externalSipHost}:5060`);
      } else {
        setInternalSipHost(externalSipHost);
      }
    }
  }, [externalSipHost]);

  // Handle SIP host changes
  const handleSipHostChange = (value: string) => {
    setInternalSipHost(value);
    if (setExternalSipHost) {
      setExternalSipHost(value);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate SIP host format
    let hostToSave = internalSipHost;
    if (!hostToSave.includes(':')) {
      hostToSave = `${hostToSave}:5060`;
      setInternalSipHost(hostToSave);
      if (setExternalSipHost) {
        setExternalSipHost(hostToSave);
      }
    }

    // Save SIP host in localStorage
    try {
      localStorage.setItem('lastSipHost', hostToSave);
    } catch (error) {
      console.error("Error saving SIP host to localStorage:", error);
    }
    
    // Log connection attempt for debugging
    console.log(`Attempting connection with:`, {
      username,
      host: hostToSave,
      hasPassword: password ? 'Yes' : 'No'
    });
    
    handleSave();
  };

  const handleDebugInfo = () => {
    if (typeof window !== "undefined") {
      const rtcSupport = 'RTCPeerConnection' in window;
      const wsSupport = 'WebSocket' in window;
      const udpSupport = 'RTCIceCandidate' in window; // Simplified check for UDP support
      
      const browserInfo = {
        userAgent: navigator.userAgent,
        webrtcSupport: rtcSupport,
        webSocketSupport: wsSupport,
        udpSupport: udpSupport,
        platform: navigator.platform,
        // Check for WebRTC capabilities without using getCapabilities
        rtcCapabilities: RTCPeerConnection ? 'Supported' : 'Not supported'
      };
      
      console.log("WebRTC Browser Info:", browserInfo);
      
      toast({
        title: "SIP Connectivity Debug Info",
        description: `WebRTC: ${rtcSupport ? '✅' : '❌'}, WebSockets: ${wsSupport ? '✅' : '❌'}, UDP: ${udpSupport ? '✅' : '❌'}`
      });
      
      // Check network status
      const online = navigator.onLine;
      console.log(`Network status: ${online ? 'Online' : 'Offline'}`);
      if (!online) {
        toast({
          title: "Network Issue Detected",
          description: "You appear to be offline. SIP requires an internet connection.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input 
          id="username" 
          value={username} 
          onChange={e => setUsername(e.target.value)} 
          placeholder="Enter your SIP username" 
          disabled={isDisabled || isReadOnly} 
          className={isReadOnly ? "bg-gray-100" : ""} 
          readOnly={isReadOnly} 
        />
        <p className="text-xs text-gray-500">
          Enter only your SIP username (e.g., "101" or "extension")
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input 
          id="password" 
          type="password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          placeholder="Enter your SIP password" 
          disabled={isDisabled || isReadOnly} 
          className={isReadOnly ? "bg-gray-100" : ""} 
          readOnly={isReadOnly} 
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="host">SIP Host</Label>
        <Input 
          id="host" 
          value={internalSipHost} 
          onChange={e => handleSipHostChange(e.target.value)} 
          placeholder="SIP Server Address" 
          disabled={isDisabled || isReadOnly} 
          className={isReadOnly ? "bg-gray-100" : ""} 
          readOnly={isReadOnly} 
        />
        <p className="text-xs text-gray-500">
          Format: hostname:port (e.g., "hpbx.sipconvergence.co.uk:5060")
        </p>
      </div>
      
      <div className="pt-4 flex gap-2 flex-wrap">
        <Button 
          type="submit" 
          disabled={isDisabled || !username || !password} 
          className="w-full sm:w-auto"
        >
          {buttonText}
        </Button>
        
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleDebugInfo} 
          className="w-full sm:w-auto"
        >
          Check WebRTC Status
        </Button>
      </div>
    </form>
  );
};

export default SipCredentialsForm;
