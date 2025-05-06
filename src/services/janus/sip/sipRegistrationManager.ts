import type { SipCredentials } from './types';
import { SipState } from './sipState';

export class SipRegistrationManager {
  private registrationRefreshInterval: number | null = null;
  
  constructor(private sipState: SipState) {}

  async register(username: string, password: string, sipHost: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.sipState.getSipPlugin()) {
        reject(new Error("SIP plugin not attached"));
        return;
      }

      const sipUri = `sip:${username}@${sipHost}`;
      this.sipState.setCurrentCredentials({ username, password, sipHost });
      this.sipState.setKeepRegistered(true);

      this.sipState.getSipPlugin().send({
        message: {
          request: "register",
          username: sipUri,
          display_name: username,
          authuser: username,
          secret: password,
          proxy: `sip:${sipHost}`
        },
        success: () => {
          console.log(`SIP registration request sent for ${username}@${sipHost}`);
          
          // Set up a registration refresh interval (every 50 seconds)
          // This helps maintain the registration with the SIP server
          this.setupRegistrationRefresh(username, password, sipHost);
          
          resolve();
        },
        error: (error: any) => {
          const errorMsg = `Error sending SIP registration: ${error}`;
          this.sipState.setRegistered(false);
          reject(new Error(errorMsg));
        }
      });
    });
  }

  private setupRegistrationRefresh(username: string, password: string, sipHost: string): void {
    // Clear any existing interval
    if (this.registrationRefreshInterval) {
      clearInterval(this.registrationRefreshInterval);
    }

    // Set up a new refresh interval (50 seconds)
    // Most SIP registrars have a timeout of 60 seconds, so we refresh before that
    this.registrationRefreshInterval = window.setInterval(() => {
      if (this.sipState.getKeepRegistered() && this.sipState.getSipPlugin()) {
        console.log("Refreshing SIP registration...");
        
        const sipUri = `sip:${username}@${sipHost}`;
        
        this.sipState.getSipPlugin().send({
          message: {
            request: "register",
            username: sipUri,
            display_name: username,
            authuser: username,
            secret: password,
            proxy: `sip:${sipHost}`
          },
          success: () => {
            console.log("SIP registration refresh sent successfully");
          },
          error: (error: any) => {
            console.error("Error refreshing SIP registration:", error);
          }
        });
      } else if (!this.sipState.getKeepRegistered()) {
        // If we're not supposed to keep registered, clear the interval
        this.clearRegistrationRefresh();
      }
    }, 50000); // 50 seconds
  }

  clearRegistrationRefresh(): void {
    if (this.registrationRefreshInterval) {
      clearInterval(this.registrationRefreshInterval);
      this.registrationRefreshInterval = null;
    }
  }
}
