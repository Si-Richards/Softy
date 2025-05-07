
import type { SipCredentials } from './types';
import { SipState } from './sipState';

export class SipRegistrationManager {
  private retryAttempts = 0;
  private maxRetries = 5; // Increased from 3 to 5 for more attempts
  private retryDelay = 2000; // Increased from 1500 to 2000ms

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

    // Format host name correctly - ensure port is included
    let host = sipHost;
    let port = '5060'; // Default SIP port
    
    if (sipHost.includes(':')) {
      const hostParts = sipHost.split(':');
      host = hostParts[0];
      port = hostParts[1];
      console.log(`SIP Host parsed: host=${host}, port=${port}`);
    } else {
      console.log(`SIP Host doesn't include port, using default port ${port}`);
      // Append default port if not specified
      host = sipHost;
    }
    
    // Enhanced username formatting with multiple options
    // Try different username formats if registration fails
    const formattedUsername = this.formatUsername(username, host);
    
    console.log(`SIP Registration: Attempting registration with ${formattedUsername} at ${host}:${port} (attempt ${this.retryAttempts + 1})`);

    // Enhanced registration message with detailed options
    // Following Janus SIP demo structure for PJSIP compatibility
    const registrationRequest = {
      request: "register",
      username: formattedUsername, // Using formatted username
      display_name: username, // Add display name for caller ID
      secret: password,
      proxy: `sip:${host}:${port}`,
      ha1_secret: false,      // Use plain password, not HA1 hash
      authuser: undefined,    // Use the same as username
      refresh: true,          // Enable session refresh
      contact_params: undefined,
      force_udp: true,        // Force UDP for Asterisk compatibility
      force_tcp: false,       // Don't use TCP
      sips: false,            // Don't use SIPS protocol
      rfc2543_cancel: true,   // Use RFC2543 style CANCEL
      master_id: undefined,
      register_ttl: 180,      // Registration timeout in seconds
      transport: "udp"        // Explicitly set UDP transport
    };

    console.log("Sending SIP registration request:", JSON.stringify(registrationRequest));
    
    this.sipState.getSipPlugin().send({
      message: registrationRequest,
      success: () => {
        console.log(`SIP Registration: Request sent successfully for ${formattedUsername} at ${host}:${port}`);
        
        // Store current credentials for future reference
        this.sipState.setCurrentCredentials({ 
          username: formattedUsername, 
          password, 
          sipHost: `${host}:${port}`
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

  // New method to try different username formatting options
  private formatUsername(username: string, host: string): string {
    // Remove any 'sip:' prefix or existing domain if present
    const cleanUsername = username
      .replace(/^sip:/, '')
      .split('@')[0];
      
    // For initial registration attempts, use just the clean username
    if (this.retryAttempts === 0) {
      console.log(`Using clean username format: ${cleanUsername}`);
      return cleanUsername;
    }
    
    // For first retry, try with domain
    if (this.retryAttempts === 1) {
      const withDomain = `${cleanUsername}@${host}`;
      console.log(`Trying username with domain: ${withDomain}`);
      return withDomain;
    }
    
    // For second retry, try with sip: prefix
    if (this.retryAttempts === 2) {
      const withSip = `sip:${cleanUsername}@${host}`;
      console.log(`Trying username with SIP URI format: ${withSip}`);
      return withSip;
    }
    
    // Default back to clean username for other attempts
    return cleanUsername;
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
      console.log(`Retry will use different username format if applicable`);
      
      setTimeout(() => {
        console.log(`SIP Registration: Retrying registration, attempt ${this.retryAttempts}...`);
        this.performRegistration(username, password, sipHost, resolve, reject);
      }, delay);
    } else {
      // We've exhausted our retries
      console.error(`Registration failed after ${this.maxRetries} attempts`);
      let enhancedErrorMsg = errorMsg;
      
      // Add more context for specific errors
      if (errorMsg.includes('446')) {
        enhancedErrorMsg += " - Username format error. Your username may be incorrectly formatted or contain invalid characters.";
      } else if (errorMsg.includes('401') || errorMsg.includes('407')) {
        enhancedErrorMsg += " - Authentication failed. Please check your username and password.";
      } else if (errorMsg.includes('403')) {
        enhancedErrorMsg += " - Access forbidden. Your account may be disabled or you don't have permission to register.";
      } else if (errorMsg.includes('404')) {
        enhancedErrorMsg += " - User not found. The username doesn't exist on this SIP server.";
      } else if (errorMsg.includes('504')) {
        enhancedErrorMsg += " - Server timeout. The SIP server did not respond in time.";
      } else if (errorMsg.includes('timeout') || errorMsg.includes('Timeout')) {
        enhancedErrorMsg += " - Connection timed out. Please check if the SIP server is reachable and the port is correct.";
      } else if (errorMsg.includes('Missing session') || errorMsg.includes('Sofia stack')) {
        enhancedErrorMsg += " - SIP server error: The server's SIP stack is not ready. Please try again in a few moments.";
      } else if (errorMsg.includes('transport')) {
        enhancedErrorMsg += " - Transport error: There was a problem with the UDP connection to the SIP server.";
      }
      
      reject(new Error(enhancedErrorMsg));
    }
  }
}
