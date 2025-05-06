
// Types for SIP connection states and operations
import React from "react";

export type SipConnectionStatus = "idle" | "connecting" | "connected" | "failed";

export interface SipConnectionState {
  username: string;
  password: string;
  sipHost: string;
  isLoading: boolean;
  registrationStatus: SipConnectionStatus;
  errorMessage: string | null;
  progressValue: number;
  serverChecked: boolean;
}

export interface UseSipConnectionResult extends SipConnectionState {
  setUsername: (value: string) => void;
  setPassword: (value: string) => void;
  setSipHost: (value: string) => void;
  handleSave: () => Promise<void>;
  handleForgetCredentials: () => void;
}
