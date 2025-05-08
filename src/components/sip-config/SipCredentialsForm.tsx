
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { Info, Lock } from "lucide-react";

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
  const [internalSipHost, setInternalSipHost] = useState("hpbx.voicehost.co.uk:5060");
  const [isDebugMode, setIsDebugMode] = useState(false);

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

    // Enable extra debug logging in localStorage
    if (isDebugMode) {
      try {
        localStorage.setItem('janusDebugMode', 'true');
        console.log("🔍 DEBUG MODE ENABLED - Extra logging activated");
      } catch (error) {
        console.error("Error saving debug mode to localStorage:", error);
      }
    }

    // Save SIP host in localStorage
    try {
      localStorage.setItem('lastSipHost', hostToSave);
    } catch (error) {
      console.error("Error saving SIP host to localStorage:", error);
    }
    
    // Log connection attempt for debugging
    console.log(`🔄 Attempting connection with:`, {
      username,
      host: hostToSave,
      hasPassword: password ? 'Yes' : 'No',
      debugMode: isDebugMode
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
      
      console.log("🔍 WebRTC Browser Info:", browserInfo);
      
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
        <Label htmlFor="username">SIP Identity</Label>
        <div className="relative">
          <Input 
            id="username" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            placeholder="Enter your SIP identity (e.g., 16331*201)" 
            disabled={isDisabled || isReadOnly} 
            className={isReadOnly ? "bg-gray-100" : ""} 
            readOnly={isReadOnly} 
          />
          <div className="absolute right-3 top-2 text-gray-400">
            <span title="Your SIP username or extension">
              <Info size={16} className="hover:text-blue-500 cursor-help" />
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Format: extension (e.g., "16331*201") or full SIP URI (e.g., "16331*201@hpbx.voicehost.co.uk")
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Secret</Label>
        <div className="relative">
          <Input 
            id="password" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="Enter your SIP password/secret" 
            disabled={isDisabled || isReadOnly} 
            className={isReadOnly ? "bg-gray-100" : ""} 
            readOnly={isReadOnly} 
          />
          <div className="absolute right-3 top-2 text-gray-400">
            <Lock size={16} className="hover:text-blue-500" />
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="host">SIP Registrar</Label>
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
          Format: hostname:port (e.g., "hpbx.voicehost.co.uk:5060")
        </p>
      </div>
      
      {!isReadOnly && (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="debugMode"
            checked={isDebugMode}
            onChange={(e) => setIsDebugMode(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="debugMode" className="text-sm text-gray-700">
            Enable debug mode (extended logging)
          </label>
        </div>
      )}
      
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
