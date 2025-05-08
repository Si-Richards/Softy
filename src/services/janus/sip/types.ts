
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
  onRegistrationSuccess?: () => void;
  onRegistrationFailed?: (error: string, code?: string) => void;
}

export interface SipPluginMessage {
  result?: {
    event?: string;
    username?: string;
    code?: string;
    reason?: string;
    displayname?: string;
    call_id?: string;
    referrer?: string;
    srtp?: string;
    srtpProfile?: string;
  };
  error?: string;
  error_code?: number;
}

export interface SipRegistrationRequest {
  request: string;
  username: string;
  display_name?: string;
  secret?: string;
  ha1_secret?: boolean;
  authuser?: string | null;
  proxy?: string;
  outbound_proxy?: string;
  headers?: Record<string, string>;
  refresh?: boolean;
  register?: boolean; 
  contact_params?: string | null;
  master_id?: string;
  force_udp?: boolean;
  force_tcp?: boolean;
  sips?: boolean;
  rfc2543_cancel?: boolean;
  register_ttl?: number;
  transport?: string;
}
