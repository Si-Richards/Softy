
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
        .replace(/^sip:/, '') // Remove any 'sip:' prefix
        .split('@')[0];       // Remove any domain part
      
      // Do NOT encode special characters - the SIP server expects raw characters
      // The previous version was encoding * as %2a which caused errors
      
      // Save username for display purposes
      this.sipState.setCurrentCredentials({ username: cleanUsername, password, sipHost });

      // Format SIP URI correctly - use original characters for the actual request
      const sipUri = `sip:${cleanUsername}@${host}`;

      console.log(`SIP Registration: Attempting registration for ${sipUri} via ${host}:${port}`);

      // Send registration with proper authentication parameters
      this.sipState.getSipPlugin().send({
        message: {
          request: "register",
          username: cleanUsername, // Use clean username without encoding special characters
          display_name: cleanUsername,
          authuser: cleanUsername, // Authentication username without encoding
          secret: password,
          proxy: `sip:${host}:${port}`,
          register_ttl: 3600,
          force_tcp: false,
          sips: false
        },
        success: () => {
          console.log(`SIP Registration: Request sent for ${cleanUsername}@${host}:${port}`);
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
