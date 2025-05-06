
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
      this.handleSipError(msg.error, eventHandlers);
      return;
    }

    if (!msg.result) {
      return;
    }

    const result = msg.result;
    const event = result.event;

    switch (event) {
      case "registration_failed": {
        console.error(`SIP Registration failed: ${result.code || "Unknown error"} - ${result.reason || "No reason provided"}`);
        
        this.handleRegistrationFailure(result.code, result.reason, eventHandlers);
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

  private handleSipError(error: string, eventHandlers: SipEventHandlers): void {
    // Enhanced error handling with descriptive messages
    let enhancedError = error;

    if (error.includes("Missing session") || error.includes("Sofia stack")) {
      enhancedError = "Server SIP stack not initialized. Please try again in a few moments.";
    } else if (error.includes("Unauthorized")) {
      enhancedError = "Authentication failed: Please check your credentials.";
    } else if (error.includes("Request Timeout")) {
      enhancedError = "Request timed out: SIP server may be experiencing connectivity issues.";
    } else if (error.includes("Not Found")) {
      enhancedError = "SIP account not found. Please verify your username.";
    }

    if (eventHandlers.onError) {
      eventHandlers.onError(enhancedError);
    }
  }

  private handleRegistrationFailure(code: string | undefined, reason: string | undefined, eventHandlers: SipEventHandlers): void {
    let errorMessage = "SIP registration failed";
    
    // Handle specific registration error codes
    if (code) {
      switch (code) {
        case "401":
        case "407":
          errorMessage = "Authentication failed: Please check your credentials.";
          break;
        case "403":
          errorMessage = "Registration forbidden: Your account may be disabled.";
          break;
        case "404":
          errorMessage = "SIP account not found. Please verify your username.";
          break;
        case "408":
          errorMessage = "Registration request timed out. Server may be unreachable.";
          break;
        case "499":
          errorMessage = "Server SIP stack not initialized. Please try again in a few moments.";
          break;
        default:
          errorMessage = `Registration failed with code ${code}${reason ? ': ' + reason : ''}`;
      }
    } else if (reason) {
      errorMessage = `Registration failed: ${reason}`;
    }
    
    if (eventHandlers.onError) {
      eventHandlers.onError(errorMessage);
    }
  }
}
