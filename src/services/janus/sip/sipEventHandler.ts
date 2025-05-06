
import type { SipEventHandlers, SipPluginMessage } from './types';
import { SipState } from './sipState';
import { SipCallManager } from './sipCallManager';

export class SipEventHandler {
  constructor(private sipState: SipState, private callManager: SipCallManager) {}

  handleSipMessage(msg: any, jsep: any, eventHandlers: SipEventHandlers): void {
    // Better validation with detailed logging
    if (!msg) {
      console.warn("Received empty SIP message");
      return;
    }

    // Debug the complete message
    console.log("SIP Message received:", JSON.stringify(msg, null, 2));

    // Special handling for SIP error messages
    if (msg.error) {
      console.error(`SIP Error: ${msg.error} (Code: ${msg.error_code || 'unknown'})`);
      
      // Special handling for specific error codes
      if (msg.error_code === 446) {
        console.error(`Invalid user address error detected. This typically means the username format is not accepted by the server.`);
        console.error(`Username format should typically be a plain username without special URL encoding.`);
      }
      
      this.sipState.setRegistered(false);
      
      if (eventHandlers.onError) {
        eventHandlers.onError(`SIP error: ${msg.error} (Code: ${msg.error_code || 'unknown'})`);
      }
      return;
    }

    // Handle normal SIP events
    if (msg.result) {
      const event = msg.result.event;
      console.log(`SIP event received: ${event}`, JSON.stringify(msg.result, null, 2));

      switch (event) {
        case 'registering':
          console.log("Registering with the SIP server");
          break;
          
        case 'registration_failed':
          const code = msg.result.code || 'unknown';
          const reason = msg.result.reason || 'Unknown reason';
          console.error(`Registration failed: Code ${code} - ${reason}`);
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
          console.log(`Incoming call from: ${msg.result.username || 'unknown'}`);
          if (eventHandlers.onIncomingCall) {
            eventHandlers.onIncomingCall(msg.result.username || 'unknown', jsep);
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
          console.log(`Call hung up: ${msg.result.reason || 'Call ended'}`);
          this.sipState.setRegistered(true); // We're still registered after hangup
          
          if (eventHandlers.onCallEnded) {
            eventHandlers.onCallEnded();
          }
          break;
          
        default:
          console.log(`Unhandled SIP event: ${event}`, JSON.stringify(msg.result, null, 2));
      }
    } else {
      // Log any other messages that don't follow the expected format
      console.log("Received non-standard SIP message:", JSON.stringify(msg, null, 2));
    }
  }
}
