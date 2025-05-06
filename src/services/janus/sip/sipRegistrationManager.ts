
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
      
      // Full SIP identity should include domain
      const sipIdentity = `${cleanUsername}@${host}`;
      
      // Save username for display purposes
      this.sipState.setCurrentCredentials({ username: cleanUsername, password, sipHost });

      console.log(`SIP Registration: Attempting registration for sip:${sipIdentity} via ${host}:${port}`);

      // Send registration request with proper formatting
      this.sipState.getSipPlugin().send({
        message: {
          request: "register",
          username: sipIdentity,     // Full SIP identity: username@domain
          display_name: cleanUsername, // Just the username for display
          authuser: cleanUsername,   // Auth username without domain
          secret: password,
          proxy: `sip:${host}:${port}`,
          register_ttl: 3600,
          force_tcp: false,
          sips: false
        },
        success: () => {
          console.log(`SIP Registration: Request sent for ${sipIdentity} via ${host}:${port}`);
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
