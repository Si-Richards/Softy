
import type { SipCredentials, SipEventHandlers, AudioCallOptions } from './sip/types';
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
    return this.registrationManager.register(username, password, sipHost);
  }

  async call(uri: string, audioOptions?: AudioCallOptions): Promise<void> {
    return this.callManager.call(uri, audioOptions);
  }

  async acceptCall(jsep: any, audioOptions?: AudioCallOptions): Promise<void> {
    return this.callManager.acceptCall(jsep, audioOptions);
  }

  async hangup(): Promise<void> {
    return this.callManager.hangup();
  }
  
  async sendDTMF(digit: string): Promise<void> {
    if (!this.getSipPlugin()) {
      throw new Error("SIP plugin not attached");
    }
    
    if (!digit.match(/^[0-9*#]$/)) {
      throw new Error("Invalid DTMF character. Must be 0-9, *, or #");
    }
    
    return new Promise<void>((resolve, reject) => {
      const message = {
        request: "dtmf_info",
        digit: digit
      };
      
      this.getSipPlugin().send({
        message: message,
        success: () => {
          console.log(`DTMF tone ${digit} sent successfully`);
          resolve();
        },
        error: (error: any) => {
          console.error(`Error sending DTMF tone ${digit}:`, error);
          reject(new Error(`Failed to send DTMF: ${error}`));
        }
      });
    });
  }

  handleSipMessage(msg: any, jsep: any, eventHandlers: SipEventHandlers): void {
    this.eventHandler.handleSipMessage(msg, jsep, eventHandlers);
  }
}
