
import type { SipCredentials } from './types';

export class SipState {
  private sipPlugin: any = null;
  private registered: boolean = false;
  private currentCredentials: SipCredentials | null = null;
  private keepRegistered: boolean = true; // Default to keeping registered

  setSipPlugin(plugin: any) {
    this.sipPlugin = plugin;
  }

  getSipPlugin() {
    return this.sipPlugin;
  }

  isRegistered(): boolean {
    return this.registered;
  }

  setRegistered(status: boolean) {
    this.registered = status;
  }

  getCurrentCredentials(): SipCredentials | null {
    return this.currentCredentials;
  }

  setCurrentCredentials(credentials: SipCredentials | null) {
    this.currentCredentials = credentials;
  }

  getKeepRegistered(): boolean {
    return this.keepRegistered;
  }

  setKeepRegistered(keep: boolean): void {
    this.keepRegistered = keep;
  }
}
