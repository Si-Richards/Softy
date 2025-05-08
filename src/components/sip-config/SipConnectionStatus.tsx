import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import type { SipConnectionStatus as SipConnectionStatusType } from "@/hooks/useSipConnection";
import { Info } from "lucide-react";

interface SipConnectionStatusProps {
  status: SipConnectionStatusType;
  errorMessage: string | null;
  progressValue: number;
  isLoading: boolean;
}

const SipConnectionStatus: React.FC<SipConnectionStatusProps> = ({
  status,
  errorMessage,
  progressValue,
  isLoading
}) => {
  // Get browser WebRTC information for diagnostics
  const getWebRTCInfo = () => {
    if (typeof window === 'undefined') return { supported: false };
    
    const rtcSupported = 'RTCPeerConnection' in window;
    const wsSupported = 'WebSocket' in window;
    
    return {
      supported: rtcSupported && wsSupported,
      rtcSupported,
      wsSupported
    };
  };
  
  const webRTCInfo = getWebRTCInfo();
  
  // Show detailed status messages based on connection state
  const getStatusDetails = () => {
    if (!webRTCInfo.supported) {
      return "Your browser doesn't fully support WebRTC required for SIP calls.";
    }
    
    switch(status) {
      case "connecting":
        return progressValue < 30 
          ? "Connecting to WebRTC gateway..." 
          : "Registering with SIP server...";
      case "connected":
        return "Your SIP account is active and ready for calls.";
      case "failed":
        return errorMessage || "Connection failed. Please check your settings.";
      default:
        return "Enter your SIP credentials and connect.";
    }
  };
  
  return (
    <>
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Registration Failed</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      {status === "connecting" && (
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs">
            <span>
              {progressValue < 30 
                ? "Connecting to WebRTC server..." 
                : progressValue < 60 
                  ? "Connected to WebRTC, connecting to SIP..." 
                  : "Registering with SIP server..."}
            </span>
            <span>{isLoading ? `${progressValue}%` : ""}</span>
          </div>
          <Progress value={progressValue} />
        </div>
      )}
      
      {status === "connected" && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <AlertTitle>Connected</AlertTitle>
          <AlertDescription>Successfully registered with SIP server</AlertDescription>
        </Alert>
      )}
      
      {/* Connection status info */}
      <div className="text-xs text-gray-500 flex items-center gap-1 mb-4">
        <Info size={14} />
        <span>Status: {getStatusDetails()}</span>
      </div>
      
      {/* Show WebRTC support warning if needed */}
      {!webRTCInfo.supported && (
        <Alert className="mb-4 bg-yellow-50 border-yellow-200">
          <AlertTitle>Browser Compatibility Warning</AlertTitle>
          <AlertDescription>
            Your browser doesn't fully support WebRTC features needed for SIP calls.
            {!webRTCInfo.rtcSupported && " WebRTC is not supported."}
            {!webRTCInfo.wsSupported && " WebSockets are not supported."}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default SipConnectionStatus;
