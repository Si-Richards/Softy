
import { SipState } from './sipState';
import { SipCallManager } from './sipCallManager';
import { SipPluginMessage, SipEventHandlers } from './types';

export class SipEventHandler {
  constructor(
    private sipState: SipState,
    private callManager: SipCallManager
  ) {}

  handleSipMessage(msg: SipPluginMessage, jsep: any, eventHandlers: SipEventHandlers): void {
    console.log("⭐ SIP Message received:", JSON.stringify(msg, null, 2));
    
    if (msg.error) {
      console.error(`❌ SIP Error: ${msg.error} (code: ${msg.error_code})`);
      this.handleSipError(msg.error, msg.error_code, eventHandlers);
      return;
    }

    if (!msg.result) {
      console.warn("⚠️ Received SIP message without result");
      return;
    }

    const result = msg.result;
    const event = result.event;

    switch (event) {
      case "registering": {
        console.log("🔄 SIP: Registration process starting");
        // Don't set registered true here yet, wait for "registered" event
        break;
      }

      case "registered": {
        console.log("✅ SIP: Registration successful");
        this.sipState.setRegistered(true);
        
        // Notify anyone listening for registration success
        if (eventHandlers.onRegistrationSuccess) {
          eventHandlers.onRegistrationSuccess();
        }
        break;
      }

      case "registration_failed": {
        console.error(`❌ SIP: Registration failed: ${result.code || "Unknown error"} - ${result.reason || "No reason provided"}`);
        
        this.handleRegistrationFailure(result.code, result.reason, eventHandlers);
        this.sipState.setRegistered(false);
        break;
      }

      case "incomingcall": {
        // Handle incoming call
        console.log("📞 SIP: Incoming call detected");
        if (eventHandlers.onIncomingCall && result.username) {
          eventHandlers.onIncomingCall(result.username, jsep);
        }
        break;
      }

      case "accepted": {
        // Call accepted
        console.log("✅ SIP: Call accepted");
        if (eventHandlers.onCallConnected) {
          eventHandlers.onCallConnected();
        }
        break;
      }

      case "hangup": {
        // Call ended
        console.log("🔚 SIP: Call ended");
        if (eventHandlers.onCallEnded) {
          eventHandlers.onCallEnded();
        }
        break;
      }

      default:
        console.log(`ℹ️ SIP: Unhandled event: ${event}`, result);
    }

    // Handle JSep if provided
    if (jsep) {
      console.log("🔧 SIP: Received JSEP", jsep);
      this.callManager.handleRemoteJsep(jsep);
    }
  }

  private handleSipError(error: string, errorCode: number | undefined, eventHandlers: SipEventHandlers): void {
    // Enhanced error handling with descriptive messages
    let enhancedError = `SIP Error: ${error}`;

    if (errorCode) {
      enhancedError += ` (Code: ${errorCode})`;
    }

    if (error.includes("Missing session") || error.includes("Sofia stack")) {
      enhancedError = "Server SIP stack not initialized. Please try again in a few moments.";
    } else if (error.includes("Unauthorized")) {
      enhancedError = "Authentication failed: Please check your credentials.";
    } else if (error.includes("Request Timeout")) {
      enhancedError = "Request timed out: SIP server may be experiencing connectivity issues.";
    } else if (error.includes("Not Found")) {
      enhancedError = "SIP account not found. Please verify your username.";
    }

    console.error(`❌ ${enhancedError}`);

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
        case "423":
          errorMessage = "Registration interval too brief. Try again later.";
          break;
        case "446":
          errorMessage = "Username contains invalid characters or format.";
          break;
        case "480":
          errorMessage = "SIP user temporarily unavailable.";
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
    
    console.error(`❌ ${errorMessage}`);
    
    // Use the dedicated registration failed handler if available
    if (eventHandlers.onRegistrationFailed) {
      eventHandlers.onRegistrationFailed(errorMessage, code);
    } else if (eventHandlers.onError) {
      // Fall back to general error handler
      eventHandlers.onError(errorMessage);
    }
  }
}
