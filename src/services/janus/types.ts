
export interface JanusOptions {
  server: string;
  apiSecret?: string;
  iceServers?: RTCIceServer[];
  debug?: string;
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
  onIncomingCall: ((from: string, jsep: any) => void) | null;
  onCallConnected: (() => void) | null;
  onCallEnded: (() => void) | null;
  onError: ((error: string) => void) | null;
}

// Update the SipEventHandlers interface to match JanusEventHandlers expected in JanusService.ts
export interface SipEventHandlers {
  onIncomingCall?: (from: string, jsep?: any) => void;
  onCallConnected?: () => void;
  onCallEnded?: () => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    Janus: any;
  }
}
