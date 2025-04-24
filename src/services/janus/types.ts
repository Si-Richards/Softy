
export interface JanusOptions {
  server: string;
  apiSecret?: string;
  iceServers?: RTCIceServer[];
  success?: () => void;
  error?: (error: any) => void;
  destroyed?: () => void;
}

export interface SipCredentials {
  username: string;
  password: string;
  sipHost: string;
}

export interface EventHandlers {
  onIncomingCall: ((from: string) => void) | null;
  onCallConnected: (() => void) | null;
  onCallEnded: (() => void) | null;
  onError: ((error: string) => void) | null;
}

