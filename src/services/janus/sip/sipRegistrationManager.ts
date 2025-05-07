
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
    
    console.log(`SIP Registration: Attempting registration with ${cleanUsername}@${host}:${port} (attempt ${this.retryAttempts + 1})`);

    // Send registration request with simplified parameters for better compatibility with Asterisk
    this.sipState.getSipPlugin().send({
      message: {
        request: "register",
        username: cleanUsername,            // Just the username without SIP: prefix
        secret: password,                   // The password provided
        proxy: `sip:${host}:${port}`,       // Full proxy with sip: prefix and port
        refresh: true,                      // Enable registration refresh
        force_udp: port === "5060",         // Force UDP for standard SIP port 5060
        sips: false                         // Don't use SIPS protocol
      },
      success: () => {
        console.log(`SIP Registration: Request sent for ${cleanUsername}@${host}:${port}`);
        
        // Store current credentials for future reference
        this.sipState.setCurrentCredentials({ 
          username: cleanUsername, 
          password, 
          sipHost 
        });
        
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
      } else if (errorMsg.includes("401") || errorMsg.includes("407")) {
        enhancedErrorMsg += " - Authentication failed. Please check your username and password.";
      } else if (errorMsg.includes("403")) {
        enhancedErrorMsg += " - Access forbidden. You may not have permission to register with this server.";
      } else if (errorMsg.includes("504")) {
        enhancedErrorMsg += " - Server timeout. The SIP server did not respond in time.";
      }
      
      reject(new Error(enhancedErrorMsg));
    }
  }
}
