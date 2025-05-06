
import type { SipCredentials } from './types';
import { SipState } from './sipState';

export class SipRegistrationManager {
  constructor(private sipState: SipState) {}

  async register(username: string, password: string, sipHost: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
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

      console.log(`SIP Registration: Attempting registration with ${sipIdentity}`);

      // Send registration request with proper SIP formatting
      this.sipState.getSipPlugin().send({
        message: {
          request: "register",
          username: sipIdentity,          // Full SIP identity with sip: prefix: sip:username@domain
          secret: password,
          proxy: `sip:${host}:${port}`,   // Add sip: prefix to proxy
          registrar: `sip:${host}`,       // Add separate registrar with sip: prefix
          contact_params: "transport=udp", // Add transport parameter for contact
          sips: false,                    // Use sip: not sips:
          refresh: true                   // Enable registration refresh
        },
        success: () => {
          console.log(`SIP Registration: Request sent for ${sipIdentity}`);
          resolve();
        },
        error: (error: any) => {
          const errorMsg = `SIP Registration Error: ${error}`;
          console.error(errorMsg);
          this.sipState.setRegistered(false);
          reject(new Error(errorMsg));
        }
      });
    });
  }
}
