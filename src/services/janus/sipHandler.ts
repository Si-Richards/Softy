import type { SipCredentials, SipEventHandlers } from './sip/types';
import { SipState } from './sip/sipState';
import { SipEventHandler } from './sip/sipEventHandler';
import { SipCallManager } from './sip/sipCallManager';
import { SipRegistrationManager } from './sip/sipRegistrationManager';

export class JanusSipHandler {
  private sipState: SipState;
  private eventHandler: SipEventHandler;
  private callManager: SipCallManager;
  private registrationManager: SipRegistrationManager;

  constructor() {
    this.sipState = new SipState();
    this.callManager = new SipCallManager(this.sipState);
    this.eventHandler = new SipEventHandler(this.sipState, this.callManager);
    this.registrationManager = new SipRegistrationManager(this.sipState);
  }

  setSipPlugin(plugin: any) {
    this.sipState.setSipPlugin(plugin);
  }

  getSipPlugin() {
    return this.sipState.getSipPlugin();
  }

  isRegistered(): boolean {
    return this.sipState.isRegistered();
  }

  setRegistered(status: boolean) {
    this.sipState.setRegistered(status);
  }

  getCurrentCredentials(): SipCredentials | null {
    return this.sipState.getCurrentCredentials();
  }

  async register(username: string, password: string, sipHost: string): Promise<void> {
    // Ensure we want to maintain registration
    this.sipState.setKeepRegistered(true);
    return this.registrationManager.register(username, password, sipHost);
  }

  async unregister(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.sipState.getSipPlugin()) {
        resolve();
        return;
      }
      
      // Set keepRegistered to false to prevent automatic re-registration
      this.sipState.setKeepRegistered(false);
      
      // Clear any registration refresh interval
      this.registrationManager.clearRegistrationRefresh();

      this.sipState.getSipPlugin().send({
        message: { request: "unregister" },
        success: () => {
          console.log("Unregister request sent");
          this.sipState.setRegistered(false);
          this.sipState.setCurrentCredentials(null);
          resolve();
        },
        error: (error: any) => {
          console.error("Error unregistering:", error);
          // Still consider us unregistered even if there was an error
          this.sipState.setRegistered(false);
          this.sipState.setCurrentCredentials(null);
          reject(error);
        }
      });
    });
  }

  async call(uri: string, isVideoCall: boolean = false): Promise<void> {
    return this.callManager.call(uri, isVideoCall);
  }

  async acceptCall(jsep: any): Promise<void> {
    return this.callManager.acceptCall(jsep);
  }

  async hangup(): Promise<void> {
    return this.callManager.hangup();
  }

  handleSipMessage(msg: any, jsep: any, eventHandlers: SipEventHandlers): void {
    this.eventHandler.handleSipMessage(msg, jsep, eventHandlers);
  }
}
