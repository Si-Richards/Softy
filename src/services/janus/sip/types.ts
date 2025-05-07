

export interface SipCredentials {
  username: string;
  password: string;
  sipHost: string;
}

export interface SipEventHandlers {
  onIncomingCall?: (from: string, jsep?: any) => void;
  onCallConnected?: () => void;
  onCallEnded?: () => void;
  onError?: (error: string) => void;
}

export interface SipPluginMessage {
  result?: {
    event?: string;
    username?: string;
    code?: string;
  };
  error?: string;
}

// Added RTCIceServer interface for TypeScript type safety
export interface RTCIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
  // Use string type instead of RTCIceCredentialType which isn't recognized
  credentialType?: string; 
}

