
import type { EventHandlers, SipEventHandlers } from "./types";

export class JanusEventHandlers implements EventHandlers, SipEventHandlers {
  onIncomingCall: ((from: string, jsep: any) => void) | null = null;
  onCallConnected: (() => void) | null = null;
  onCallEnded: (() => void) | null = null;
  onError: ((error: string) => void) | null = null;
  onRegistrationSuccess: (() => void) | null = null;
  onRegistrationFailed: ((error: string, code?: string) => void) | null = null;

  setOnIncomingCall(callback: (from: string, jsep: any) => void): void {
    console.log("Setting onIncomingCall handler");
    this.onIncomingCall = callback;
  }

  setOnCallConnected(callback: () => void): void {
    console.log("Setting onCallConnected handler");
    this.onCallConnected = callback;
  }

  setOnCallEnded(callback: () => void): void {
    console.log("Setting onCallEnded handler");
    this.onCallEnded = callback;
  }

  setOnError(callback: (error: string) => void): void {
    console.log("Setting onError handler");
    this.onError = callback;
  }
  
  setOnRegistrationSuccess(callback: () => void): void {
    console.log("Setting onRegistrationSuccess handler");
    this.onRegistrationSuccess = callback;
  }
  
  setOnRegistrationFailed(callback: (error: string, code?: string) => void): void {
    console.log("Setting onRegistrationFailed handler");
    this.onRegistrationFailed = callback;
  }
}
