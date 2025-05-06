
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

    // Only handle jsep separately if it's not already handled in an event
    // This prevents calling handleRemoteJsep multiple times for the same jsep object
    if (jsep && !result?.event) {
      console.log("Handling SIP jsep separately", jsep);
      this.sipState.getSipPlugin().handleRemoteJsep({ jsep });
    }
  }

  private handleEvent(
    event: string,
    result: SipPluginMessage['result'],
    jsep: any,
    eventHandlers: SipEventHandlers
  ): void {
    console.log(`SIP event received: ${event}`, result);
    
    switch (event) {
      case "registered":
        console.log("Successfully registered with the SIP server");
        this.sipState.setRegistered(true);
        break;
      case "registering":
        console.log("Registering with the SIP server");
        break;
      case "unregistered":
        console.log("Unregistered from the SIP server", result);
        // Only set as unregistered if this was intentional
        if (!this.sipState.getKeepRegistered()) {
          this.sipState.setRegistered(false);
        } else {
          // If we want to stay registered, attempt to re-register
          console.log("Attempting to re-register...");
          const credentials = this.sipState.getCurrentCredentials();
          if (credentials) {
            setTimeout(() => {
              const plugin = this.sipState.getSipPlugin();
              if (plugin) {
                this.reRegister(credentials.username, credentials.password, credentials.sipHost);
              }
            }, 3000); // Wait 3 seconds before trying to re-register
          }
        }
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
        
        // Don't handle jsep here as we'll need it in the accept method
        if (jsep) {
          console.log("Processing incoming call jsep:", jsep);
        }
        
        if (eventHandlers.onIncomingCall) {
          // Pass both username and jsep to the callback
          eventHandlers.onIncomingCall(username, jsep);
        }
        break;
      }
      case "accepted":
        console.log("Call accepted");
        if (jsep) {
          console.log("Processing accepted call jsep:", jsep);
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

  private reRegister(username: string, password: string, sipHost: string): void {
    const sipPlugin = this.sipState.getSipPlugin();
    if (!sipPlugin) return;
    
    const sipUri = `sip:${username}@${sipHost}`;
    
    sipPlugin.send({
      message: {
        request: "register",
        username: sipUri,
        display_name: username,
        authuser: username,
        secret: password,
        proxy: `sip:${sipHost}`
      },
      success: () => {
        console.log(`SIP re-registration request sent for ${username}@${sipHost}`);
      },
      error: (error: any) => {
        console.error(`Error sending SIP re-registration: ${error}`);
      }
    });
  }
}
