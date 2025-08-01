
import type { SipCredentials } from './types';

export class SipState {
  private sipPlugin: any = null;
  private registered: boolean = false;
  private currentCredentials: SipCredentials | null = null;
  private registrationInProgress: boolean = false;
  private sessionId: string | null = null;

  setSipPlugin(plugin: any) {
    this.sipPlugin = plugin;
    this.sessionId = plugin?.id || null;
  }

  getSipPlugin() {
    return this.sipPlugin;
  }

  isRegistered(): boolean {
    return this.registered;
  }

  setRegistered(status: boolean) {
    this.registered = status;
    if (!status) {
      this.registrationInProgress = false;
    }
  }

  getCurrentCredentials(): SipCredentials | null {
    return this.currentCredentials;
  }

  setCurrentCredentials(credentials: SipCredentials | null) {
    this.currentCredentials = credentials;
  }

  isRegistrationInProgress(): boolean {
    return this.registrationInProgress;
  }

  setRegistrationInProgress(status: boolean) {
    this.registrationInProgress = status;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  reset() {
    this.sipPlugin = null;
    this.registered = false;
    this.currentCredentials = null;
    this.registrationInProgress = false;
    this.sessionId = null;
  }

  needsReregistration(credentials: SipCredentials): boolean {
    if (!this.registered || this.registrationInProgress) {
      return false;
    }
    
    const current = this.currentCredentials;
    if (!current) {
      return true;
    }
    
    return current.username !== credentials.username ||
           current.password !== credentials.password ||
           current.sipHost !== credentials.sipHost;
  }
}
