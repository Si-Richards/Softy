
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

      const sipUri = `sip:${username}@${sipHost}`;
      this.sipState.setCurrentCredentials({ username, password, sipHost });

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
