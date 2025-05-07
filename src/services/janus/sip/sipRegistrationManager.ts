
import type { SipCredentials, SipRegistrationRequest } from './types';
import { SipState } from './sipState';

export class SipRegistrationManager {
  private retryAttempts = 0;
  private maxRetries = 3;
  private retryDelay = 2000;
  private registrationRequest: SipRegistrationRequest | null = null;

  constructor(private sipState: SipState) {}

  async register(username: string, password: string, sipHost: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Reset retry attempts for new registration requests
      this.retryAttempts = 0;
      
      // Create registration request following Janus SIP demo format
      this.registrationRequest = this.createRegistrationRequest(username, password, sipHost);
      
      console.log("Registration request:", JSON.stringify(this.registrationRequest, null, 2));
      this.performRegistration(resolve, reject);
    });
  }

  private createRegistrationRequest(username: string, password: string, sipHost: string): SipRegistrationRequest {
    // Format host name correctly
    let host = sipHost;
    let port = '5060'; // Default SIP port
    
    if (sipHost.includes(':')) {
      const hostParts = sipHost.split(':');
      host = hostParts[0];
      port = hostParts[1];
    }

    // Clean username (remove any existing sip: prefix or domain)
    const cleanUsername = username.replace(/^sip:/, '').split('@')[0];
    
    // Follow the exact format from Janus SIP demo
    return {
      request: "register",
      username: cleanUsername, 
      display_name: cleanUsername,
      secret: password,
      proxy: `sip:${host}:${port}`,
      ha1_secret: false,
      authuser: undefined,
      refresh: true,
      register: true, // Explicitly set register flag
      contact_params: undefined,
      headers: {
        "User-Agent": "Janus SIP Plugin",
        "X-Janus-SIP-Client": "Lovable WebRTC"
      },
      force_udp: true,
      force_tcp: false,
      sips: false,
      rfc2543_cancel: true,
      register_ttl: 60,
      transport: "udp"
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
        const errorMsg = `SIP Registration Error: ${error}`;
        console.error(errorMsg);
        this.sipState.setRegistered(false);
        this.handleRegistrationFailure(errorMsg, resolve, reject);
      }
    });
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
        
        // Try with a different username format on each retry
        if (this.registrationRequest) {
          // First retry: Try with domain
          if (this.retryAttempts === 1 && this.registrationRequest.proxy) {
            const domain = this.registrationRequest.proxy.replace('sip:', '');
            this.registrationRequest.username = `${this.registrationRequest.username}@${domain.split(':')[0]}`;
            console.log(`Retry with username format: ${this.registrationRequest.username}`);
          }
          
          // Second retry: Try with sip: prefix
          else if (this.retryAttempts === 2 && this.registrationRequest.proxy) {
            const domain = this.registrationRequest.proxy.replace('sip:', '').split(':')[0];
            this.registrationRequest.username = `sip:${this.registrationRequest.username.split('@')[0]}@${domain}`;
            console.log(`Retry with username format: ${this.registrationRequest.username}`);
          }
        }
        
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
