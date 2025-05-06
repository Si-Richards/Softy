
import type { SipCredentials } from './types';
import { SipState } from './sipState';

export class SipRegistrationManager {
  private retryAttempts = 0;
  private maxRetries = 3;
  private retryDelay = 1500; // 1.5 seconds

  constructor(private sipState: SipState) {}

  async register(username: string, password: string, sipHost: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Reset retry attempts for new registration requests
      this.retryAttempts = 0;
      this.performRegistration(username, password, sipHost, resolve, reject);
    });
  }

  private performRegistration(
    username: string, 
    password: string, 
    sipHost: string, 
    resolve: () => void,
    reject: (error: Error) => void
  ): void {
    if (!this.sipState.getSipPlugin()) {
      const errorMsg = "SIP plugin not attached";
      console.error(`SIP Error: ${errorMsg}`);
      reject(new Error(errorMsg));
      return;
    }

    // Format host name correctly - remove port if included in sipHost
    const hostParts = sipHost.split(':');
    const host = hostParts[0];
    const port = hostParts.length > 1 ? hostParts[1] : '5060';
    
    // Format username correctly - handle special characters
    const cleanUsername = username
      .replace(/^sip:/, '')  // Remove any 'sip:' prefix if present
      .split('@')[0];        // Remove any domain part if present
    
    // Properly format the SIP identity with the sip: prefix
    const sipIdentity = `sip:${cleanUsername}@${host}`;
    
    // Save username for display purposes
    this.sipState.setCurrentCredentials({ username: cleanUsername, password, sipHost });

    console.log(`SIP Registration: Attempting registration with ${sipIdentity} (attempt ${this.retryAttempts + 1})`);

    // Send registration request with proper SIP formatting and additional parameters to help Sofia SIP stack
    this.sipState.getSipPlugin().send({
      message: {
        request: "register",
        username: sipIdentity,          // Full SIP identity with sip: prefix: sip:username@domain
        secret: password,
        proxy: `sip:${host}:${port}`,   // Add sip: prefix to proxy
        registrar: `sip:${host}`,       // Add separate registrar with sip: prefix
        authuser: cleanUsername,        // Explicitly provide authuser for authentication
        display_name: cleanUsername,    // Set display name
        user_agent: "VoiceHost Softphone", // Set user agent
        sips: false,                    // Use sip: not sips:
        refresh: true,                  // Enable registration refresh
        register_ttl: 120               // 2-minute registration refresh time
      },
      success: () => {
        console.log(`SIP Registration: Request sent for ${sipIdentity}`);
        resolve();
      },
      error: (error: any) => {
        const errorMsg = `SIP Registration Error: ${error}`;
        console.error(errorMsg);
        this.sipState.setRegistered(false);
        this.handleRegistrationFailure(username, password, sipHost, errorMsg, resolve, reject);
      }
    });
  }

  private handleRegistrationFailure(
    username: string,
    password: string,
    sipHost: string,
    errorMsg: string,
    resolve: () => void,
    reject: (error: Error) => void
  ): void {
    // Check if we should retry
    if (this.retryAttempts < this.maxRetries) {
      this.retryAttempts++;
      const delay = this.retryDelay * this.retryAttempts; // Increasing delay with each retry
      
      console.log(`SIP Registration: Will retry in ${delay}ms (attempt ${this.retryAttempts} of ${this.maxRetries})`);
      
      setTimeout(() => {
        console.log(`SIP Registration: Retrying registration...`);
        this.performRegistration(username, password, sipHost, resolve, reject);
      }, delay);
    } else {
      // We've exhausted our retries
      let enhancedErrorMsg = errorMsg;
      
      // Add more context for specific errors
      if (errorMsg.includes("Missing session") || errorMsg.includes("Sofia stack")) {
        enhancedErrorMsg += " - Server may not have initialized the SIP stack properly. Please try again in a few moments.";
      }
      
      reject(new Error(enhancedErrorMsg));
    }
  }
}
