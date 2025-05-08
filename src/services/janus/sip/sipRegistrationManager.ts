
import type { SipCredentials, SipRegistrationRequest } from './types';
import { SipState } from './sipState';

export class SipRegistrationManager {
  private retryAttempts = 0;
  private maxRetries = 3;
  private retryDelay = 2000;
  private registrationRequest: SipRegistrationRequest | null = null;
  private registrationTimer: number | null = null;

  constructor(private sipState: SipState) {}

  async register(username: string, password: string, sipHost: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Reset retry attempts for new registration requests
      this.retryAttempts = 0;
      
      // Clear any existing timer
      if (this.registrationTimer) {
        clearTimeout(this.registrationTimer);
        this.registrationTimer = null;
      }
      
      // Create registration request following Janus SIP demo format
      this.registrationRequest = this.createRegistrationRequest(username, password, sipHost);
      
      console.log("SIP Registration request created:", JSON.stringify(this.registrationRequest, null, 2));
      this.performRegistration(resolve, reject);
    });
  }

  private createRegistrationRequest(username: string, password: string, sipHost: string): SipRegistrationRequest {
    // Parse the username - check if it already has the full format (sip:user@domain)
    let user = username;
    let domain = sipHost;
    
    // Strip any 'sip:' prefix from the username if it exists
    if (user.startsWith("sip:")) {
      user = user.substring(4);
    }

    // Check if username contains @ which means it already has domain
    if (user.includes("@")) {
      const parts = user.split("@");
      user = parts[0];
      domain = parts[1].split(":")[0]; // Use domain from username, ignoring port
    }

    // Extract port from sipHost if present
    const hostParts = sipHost.split(":");
    const host = hostParts[0];
    const port = hostParts.length > 1 ? hostParts[1] : "5060";
    
    // Create SIP URI exactly as in the Janus SIP demo
    const identity = `sip:${user}@${host}`;
    const proxy = `sip:${host}:${port}`;
    
    console.log(`Creating registration with identity: ${identity}, proxy: ${proxy}, user: ${user}`);

    return {
      request: "register",
      username: identity,
      display_name: user,
      secret: password,
      proxy: proxy,
      // FIXED: Use ha1_secret as string "false" for plain text authentication
      ha1_secret: "false",
      authuser: user, // FIXED: Use username string instead of null
      refresh: true,
      register: true,
      contact_params: null,
      headers: {
        "User-Agent": "Janus SIP Plugin",
        "X-Janus-SIP-Client": "Lovable WebRTC"
      },
      master_id: undefined
    };
  }

  private performRegistration(
    resolve: () => void,
    reject: (error: Error) => void
  ): void {
    if (!this.sipState.getSipPlugin()) {
      const errorMsg = "SIP plugin not attached";
      console.error(`SIP Error: ${errorMsg}`);
      reject(new Error(errorMsg));
      return;
    }

    if (!this.registrationRequest) {
      reject(new Error("Registration request not created"));
      return;
    }
    
    console.log(`SIP Registration: Attempting registration with ${this.registrationRequest.username} (attempt ${this.retryAttempts + 1})`);

    // Debug: Log the plugin handle ID to compare with server logs
    const pluginHandleId = this.sipState.getSipPlugin().id;
    console.log(`SIP plugin handle ID: ${pluginHandleId}`);
    
    // Set a timeout to detect if server responds
    this.registrationTimer = window.setTimeout(() => {
      console.warn('SIP Registration request timed out after 30 seconds');
      // Only retry if we haven't exceeded max retries
      if (this.retryAttempts < this.maxRetries) {
        console.log(`Retrying registration (attempt ${this.retryAttempts + 1} of ${this.maxRetries})...`);
        this.retryAttempts++;
        this.performRegistration(resolve, reject);
      } else {
        reject(new Error("Registration request timed out. The SIP server is not responding."));
      }
    }, 30000);  // 30 seconds timeout

    // Send the registration request to Janus
    try {
      this.sipState.getSipPlugin().send({
        message: this.registrationRequest,
        success: () => {
          console.log(`SIP Registration: Request sent successfully for ${this.registrationRequest?.username}`);
          
          // Store current credentials for future reference
          if (this.registrationRequest) {
            const host = this.registrationRequest.proxy?.replace('sip:', '');
            this.sipState.setCurrentCredentials({ 
              username: this.registrationRequest.username, 
              password: this.registrationRequest.secret || '', 
              sipHost: host || ''
            });
          }
          
          resolve();
        },
        error: (error: any) => {
          // Clear the timer if we get an immediate error
          if (this.registrationTimer) {
            clearTimeout(this.registrationTimer);
            this.registrationTimer = null;
          }
          
          const errorMsg = `SIP Registration Error: ${error}`;
          console.error(errorMsg);
          this.sipState.setRegistered(false);
          this.handleRegistrationFailure(errorMsg, resolve, reject);
        }
      });
    } catch (error) {
      // Clear the timer if we get an exception
      if (this.registrationTimer) {
        clearTimeout(this.registrationTimer);
        this.registrationTimer = null;
      }
      
      console.error("Exception sending registration request:", error);
      reject(new Error(`Exception sending registration request: ${error}`));
    }
  }

  private handleRegistrationFailure(
    errorMsg: string,
    resolve: () => void,
    reject: (error: Error) => void
  ): void {
    // Check if we should retry
    if (this.retryAttempts < this.maxRetries) {
      this.retryAttempts++;
      const delay = this.retryDelay * this.retryAttempts;
      
      console.log(`SIP Registration: Will retry in ${delay}ms (attempt ${this.retryAttempts} of ${this.maxRetries})`);
      
      setTimeout(() => {
        console.log(`SIP Registration: Retrying registration, attempt ${this.retryAttempts}...`);
        this.performRegistration(resolve, reject);
      }, delay);
    } else {
      // We've exhausted our retries
      console.error(`Registration failed after ${this.maxRetries} attempts`);
      
      // Add more context for specific errors
      let enhancedErrorMsg = this.getEnhancedErrorMessage(errorMsg);
      reject(new Error(enhancedErrorMsg));
    }
  }
  
  private getEnhancedErrorMessage(errorMsg: string): string {
    if (errorMsg.includes('446')) {
      return `${errorMsg} - Username format error. Your username may be incorrectly formatted or contain invalid characters.`;
    } else if (errorMsg.includes('401') || errorMsg.includes('407')) {
      return `${errorMsg} - Authentication failed. Please check your username and password.`;
    } else if (errorMsg.includes('403')) {
      return `${errorMsg} - Access forbidden. Your account may be disabled or you don't have permission to register.`;
    } else if (errorMsg.includes('404')) {
      return `${errorMsg} - User not found. The username doesn't exist on this SIP server.`;
    } else if (errorMsg.includes('504')) {
      return `${errorMsg} - Server timeout. The SIP server did not respond in time.`;
    } else if (errorMsg.includes('timeout') || errorMsg.includes('Timeout')) {
      return `${errorMsg} - Connection timed out. Please check if the SIP server is reachable and the port is correct.`;
    }
    return errorMsg;
  }
}
