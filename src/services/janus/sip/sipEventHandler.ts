
import type { SipEventHandlers, SipPluginMessage } from './types';
import { SipState } from './sipState';
import { SipCallManager } from './sipCallManager';

export class SipEventHandler {
  constructor(
    private sipState: SipState,
    private sipCallManager: SipCallManager
  ) {}

  handleSipMessage(msg: SipPluginMessage, jsep: any, eventHandlers: SipEventHandlers): void {
    if (!this.sipState.getSipPlugin()) return;

    const result = msg.result;
    if (result) {
      if (result.event) {
        this.handleEvent(result.event, result, jsep, eventHandlers);
      }
    }

    if (msg.error) {
      console.error("SIP error:", msg.error);
      if (eventHandlers.onError) {
        eventHandlers.onError(`SIP error: ${msg.error}`);
      }
    }

    if (jsep) {
      console.log("Handling SIP jsep", jsep);
      this.sipState.getSipPlugin().handleRemoteJsep({ jsep });
    }
  }

  private handleEvent(
    event: string,
    result: SipPluginMessage['result'],
    jsep: any,
    eventHandlers: SipEventHandlers
  ): void {
    switch (event) {
      case "registered":
        console.log("Successfully registered with the SIP server");
        this.sipState.setRegistered(true);
        break;
      case "registering":
        console.log("Registering with the SIP server");
        break;
      case "registration_failed":
        console.log("Registration failed:", result);
        this.sipState.setRegistered(false);
        if (eventHandlers.onError) {
          eventHandlers.onError(`SIP registration failed: ${result.code || "Unknown error"}`);
        }
        break;
      case "calling":
        console.log("Calling...");
        break;
      case "incomingcall": {
        const username = result.username || "Unknown caller";
        console.log("Incoming call from", username);
        if (eventHandlers.onIncomingCall) {
          eventHandlers.onIncomingCall(username);
        }
        if (jsep) {
          this.sipCallManager.acceptCall(jsep);
        }
        break;
      }
      case "accepted":
        console.log("Call accepted");
        if (jsep) {
          this.sipState.getSipPlugin().handleRemoteJsep({ jsep });
        }
        break;
      case "hangup":
        console.log("Call hung up");
        if (eventHandlers.onCallEnded) {
          eventHandlers.onCallEnded();
        }
        break;
    }
  }
}
