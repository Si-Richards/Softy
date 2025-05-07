
import type { SipCredentials } from './types';
import { SipState } from './sipState';

export class SipRegistrationManager {
  constructor(private sipState: SipState) {}

  async register(username: string, password: string, sipHost: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.sipState.getSipPlugin()) {
        reject(new Error("SIP plugin not attached"));
        return;
      }

      // Format the SIP URI correctly for UDP transport on port 5060
      const sipUri = `sip:${username}@${sipHost}`;
      
      // For explicit UDP usage on port 5060
      const proxy = `sip:${sipHost};transport=udp`;
      
      console.log(`Attempting to register with SIP URI: ${sipUri} and proxy: ${proxy}`);
      
      this.sipState.setCurrentCredentials({ username, password, sipHost });

      this.sipState.getSipPlugin().send({
        message: {
          request: "register",
          username: sipUri,
          display_name: username,
          authuser: username,
          secret: password,
          proxy: proxy,
          // Add debugging to understand the registration process
          register_ttl: 300 // 5 minutes registration TTL for debugging
        },
        success: () => {
          console.log(`SIP registration request sent for ${username}@${sipHost}`);
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
}
