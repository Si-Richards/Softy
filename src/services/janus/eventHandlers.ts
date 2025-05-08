
import type { EventHandlers } from "./types";

export class JanusEventHandlers implements EventHandlers {
  onError: ((error: string) => void) | null = null;
  onRegistrationSuccess: (() => void) | null = null;
  onRegistrationFailed: ((error: string) => void) | null = null;

  setOnError(callback: (error: string) => void): void {
    console.log("Setting onError handler");
    this.onError = callback;
  }
  
  setOnRegistrationSuccess(callback: () => void): void {
    console.log("Setting onRegistrationSuccess handler");
    this.onRegistrationSuccess = callback;
  }
  
  setOnRegistrationFailed(callback: (error: string) => void): void {
    console.log("Setting onRegistrationFailed handler");
    this.onRegistrationFailed = callback;
  }
}
