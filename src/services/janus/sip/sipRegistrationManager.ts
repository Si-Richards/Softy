
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
      
      // Format username correctly (strip any 'sip:' prefix if present)
      const cleanUsername = username.startsWith('sip:') ? username.substring(4).split('@')[0] : username;
      
      // Format SIP URI correctly - this is the user's identity
      const sipUri = `sip:${cleanUsername}@${host}`;
      this.sipState.setCurrentCredentials({ username: cleanUsername, password, sipHost });

      console.log(`SIP Registration: Attempting registration for ${sipUri} via ${host}:${port}`);

      // Send registration with proper authentication parameters
      this.sipState.getSipPlugin().send({
        message: {
          request: "register",
          username: cleanUsername, // Use just the username for the register request
          display_name: cleanUsername,
          authuser: cleanUsername, // Authentication username without domain
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
