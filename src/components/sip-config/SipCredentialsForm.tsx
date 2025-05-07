
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
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
}

const SipCredentialsForm: React.FC<SipCredentialsFormProps> = ({
  username,
  setUsername,
  password,
  setPassword,
  handleSave,
  isDisabled,
  isReadOnly = false,
  buttonText
}) => {
  const [sipHost, setSipHost] = useState("hpbx.sipconvergence.co.uk:5060");
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  const handleDebugInfo = () => {
    if (typeof window !== "undefined") {
      console.log("WebRTC Browser Info:", {
        userAgent: navigator.userAgent,
        webrtcSupport: 'RTCPeerConnection' in window,
        webSocketSupport: 'WebSocket' in window
      });
      
      toast({
        title: "Debug Info",
        description: "WebRTC support info logged to console",
      });
    }
  };
  
  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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
          onChange={(e) => setPassword(e.target.value)}
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
          value={sipHost}
          onChange={(e) => setSipHost(e.target.value)}
          placeholder="SIP Server Address"
          disabled={isDisabled || isReadOnly}
          className={isReadOnly ? "bg-gray-100" : ""}
          readOnly={isReadOnly}
        />
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
          Check WebRTC Support
        </Button>
      </div>
    </form>
  );
};

export default SipCredentialsForm;
