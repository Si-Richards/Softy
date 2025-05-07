
import type { EventHandlers } from './types';

export class JanusEventHandlers implements EventHandlers {
  onIncomingCall: ((from: string) => void) | null = null;
  onCallConnected: (() => void) | null = null;
  onCallEnded: (() => void) | null = null;
  onError: ((error: string) => void) | null = null;

  setOnIncomingCall(callback: (from: string) => void): void {
    this.onIncomingCall = callback;
  }

  setOnCallConnected(callback: () => void): void {
    this.onCallConnected = callback;
  }

  setOnCallEnded(callback: () => void): void {
    this.onCallEnded = callback;
  }

  setOnError(callback: (error: string) => void): void {
    this.onError = callback;
  }
}

