
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
  onError: ((error: string) => void) | null;
  onRegistrationSuccess: (() => void) | null;
  onRegistrationFailed: ((error: string) => void) | null;
}

declare global {
  interface Window {
    Janus: any;
  }
}
