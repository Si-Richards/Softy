
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
    reason?: string;  // Added missing reason property
  };
  error?: string;
}
