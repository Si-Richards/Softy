
export interface SipCredentials {
  username: string;
  password: string;
  sipHost: string;
}

export interface SipEventHandlers {
  onIncomingCall?: (from: string) => void;
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
