
import type { SipEventHandlers, SipPluginMessage } from './types';
import { SipState } from './sipState';
import { SipCallManager } from './sipCallManager';

export class SipEventHandler {
  constructor(private sipState: SipState, private callManager: SipCallManager) {}

  handleSipMessage(msg: any, jsep: any, eventHandlers: SipEventHandlers): void {
    if (!msg || !msg.result) {
      console.warn("Received empty or invalid SIP message");
      return;
    }

    const event = msg.result?.event;
    console.log(`SIP event received: ${event}`, msg.result);

    switch (event) {
      case 'registering':
        console.log("Registering with the SIP server");
        break;
        
      case 'registration_failed':
        const code = msg.result.code;
        const reason = msg.result.reason || 'Unknown reason';
        console.log(`Registration failed: ${JSON.stringify(msg.result)}`);
        this.sipState.setRegistered(false);
        
        if (eventHandlers.onError) {
          eventHandlers.onError(`SIP registration failed (${code}): ${reason}`);
        }
        break;
        
      case 'registered':
        console.log("Successfully registered with the SIP server");
        this.sipState.setRegistered(true);
        break;
        
      case 'calling':
        console.log("Call in progress...");
        break;
        
      case 'incomingcall':
        console.log(`Incoming call from: ${msg.result.username}`);
        if (eventHandlers.onIncomingCall) {
          eventHandlers.onIncomingCall(msg.result.username, jsep);
        }
        
        // Handle the incoming call offer
        if (jsep) {
          this.callManager.handleRemoteJsep(jsep);
        }
        break;
        
      case 'accepted':
        console.log("Call accepted");
        
        // If this is an answer to our offer, handle the JSEP answer
        if (jsep) {
          this.callManager.handleRemoteJsep(jsep);
        }
        break;
        
      case 'hangup':
        console.log(`Call hung up: ${msg.result.reason}`);
        this.sipState.setRegistered(true); // We're still registered after hangup
        
        if (eventHandlers.onCallEnded) {
          eventHandlers.onCallEnded();
        }
        break;
        
      default:
        console.log(`Unhandled SIP event: ${event}`, msg.result);
    }
  }
}
