
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

  async call(uri: string, isVideoCall: boolean = false, audioOptions?: AudioCallOptions): Promise<void> {
    return this.callManager.call(uri, isVideoCall, audioOptions);
  }

  async acceptCall(jsep: any, isVideoCall: boolean = false, audioOptions?: AudioCallOptions): Promise<void> {
    return this.callManager.acceptCall(jsep, isVideoCall, audioOptions);
  }

  async hangup(): Promise<void> {
    return this.callManager.hangup();
  }

  handleSipMessage(msg: any, jsep: any, eventHandlers: SipEventHandlers): void {
    this.eventHandler.handleSipMessage(msg, jsep, eventHandlers);
  }
}
