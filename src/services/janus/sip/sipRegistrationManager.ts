
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

      // Format host name correctly - remove port if included in sipHost
      const hostParts = sipHost.split(':');
      const host = hostParts[0];
      const port = hostParts.length > 1 ? hostParts[1] : '5060';
      
      // Format username correctly (strip any 'sip:' prefix if present)
      const cleanUsername = username.startsWith('sip:') ? username.substring(4).split('@')[0] : username;
      
      // Format SIP URI correctly - this is the user's identity
      const sipUri = `sip:${cleanUsername}@${host}`;
      this.sipState.setCurrentCredentials({ username: cleanUsername, password, sipHost });

      console.log(`Attempting SIP registration for ${sipUri} via ${host}:${port}`);

      // Send registration with correct format - using proper SIP protocol parameters
      this.sipState.getSipPlugin().send({
        message: {
          request: "register",
          username: sipUri, // Full SIP URI for identity
          display_name: cleanUsername,
          authuser: cleanUsername, // Authentication username should be clean without domain
          secret: password,
          proxy: `sip:${host}:${port}`, // Properly formatted proxy address
          register_ttl: 3600, // Registration time to live in seconds
          force_tcp: false, // Let the protocol be determined automatically
          sips: false // Not using secure SIP by default
        },
        success: () => {
          console.log(`SIP registration request sent for ${cleanUsername}@${host}:${port}`);
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
