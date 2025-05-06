
import { SipState } from './sipState';
import { SipCallManager } from './sipCallManager';
import { SipPluginMessage, SipEventHandlers } from './types';

export class SipEventHandler {
  constructor(
    private sipState: SipState,
    private callManager: SipCallManager
  ) {}

  handleSipMessage(msg: SipPluginMessage, jsep: any, eventHandlers: SipEventHandlers): void {
    console.log("SIP Message received:", JSON.stringify(msg, null, 2));
    
    if (msg.error) {
      console.error(`SIP Error: ${msg.error}`);
      if (eventHandlers.onError) {
        eventHandlers.onError(`SIP error: ${msg.error}`);
      }
      return;
    }

    if (!msg.result) {
      return;
    }

    const result = msg.result;
    const event = result.event;

    switch (event) {
      case "registration_failed": {
        console.error(`SIP Registration failed: ${result.code || "Unknown error"}`);
        
        // Add specific error handling for common SIP registration errors
        if (result.code === "446") {
          console.error(`Username format should include the full SIP address with sip: prefix: sip:username@domain`);
          
          if (eventHandlers.onError) {
            eventHandlers.onError(`SIP registration failed: Invalid user address (Code: 446). Please use the correct format.`);
          }
        } else {
          if (eventHandlers.onError) {
            eventHandlers.onError(`SIP registration failed: ${result.code || "Unknown error"}`);
          }
        }
        
        this.sipState.setRegistered(false);
        break;
      }

      case "registered": {
        console.log("SIP registration successful");
        this.sipState.setRegistered(true);
        break;
      }

      case "registration_progress": {
        console.log("SIP registration process starting");
        break;
      }

      case "incomingcall": {
        // Handle incoming call
        console.log("Incoming SIP call");
        if (eventHandlers.onIncomingCall && result.username) {
          eventHandlers.onIncomingCall(result.username, jsep);
        }
        break;
      }

      case "accepted": {
        // Call accepted
        console.log("SIP call accepted");
        if (eventHandlers.onCallConnected) {
          eventHandlers.onCallConnected();
        }
        break;
      }

      case "hangup": {
        // Call ended
        console.log("SIP call ended");
        if (eventHandlers.onCallEnded) {
          eventHandlers.onCallEnded();
        }
        break;
      }

      default:
        console.log(`Unhandled SIP event: ${event}`);
    }

    // Handle JSep if provided
    if (jsep) {
      this.callManager.handleRemoteJsep(jsep);
    }
  }
}
