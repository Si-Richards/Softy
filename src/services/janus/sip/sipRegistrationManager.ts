
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
      
      // Format SIP URI correctly
      const sipUri = `sip:${username}@${host}`;
      this.sipState.setCurrentCredentials({ username, password, sipHost });

      // Send registration with correct format
      this.sipState.getSipPlugin().send({
        message: {
          request: "register",
          username: sipUri,
          display_name: username,
          authuser: username,
          secret: password,
          proxy: `sip:${host}:${port}`, 
          // Make sure we're using proper SIP format with protocol
          force_tcp: false, // Try without forcing TCP
          sips: false // Use standard SIP, not secure SIP
        },
        success: () => {
          console.log(`SIP registration request sent for ${username}@${host}:${port}`);
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
