
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
      
      // Save username for display purposes
      this.sipState.setCurrentCredentials({ username: cleanUsername, password, sipHost });

      // Format SIP URI correctly - include the domain in the username field
      // This is the key change - include the host in the username field
      const fullUsername = `${cleanUsername}@${host}`;
      const sipUri = `sip:${fullUsername}`;

      console.log(`SIP Registration: Attempting registration for ${sipUri} via ${host}:${port}`);

      // Send registration with proper authentication parameters
      this.sipState.getSipPlugin().send({
        message: {
          request: "register",
          username: fullUsername, // Use username with domain
          display_name: cleanUsername, // Display name can be just the username part
          authuser: cleanUsername, // Auth username is typically just the username part
          secret: password,
          proxy: `sip:${host}:${port}`,
          register_ttl: 3600,
          force_tcp: false,
          sips: false
        },
        success: () => {
          console.log(`SIP Registration: Request sent for ${fullUsername} via ${host}:${port}`);
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
