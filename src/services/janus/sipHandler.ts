
import type { SipCredentials, SipEventHandlers, AudioCallOptions } from './sip/types';
import { SipState } from './sip/sipState';
import { SipEventHandler } from './sip/sipEventHandler';
import { SipCallManager } from './sip/sipCallManager';
import { SipRegistrationManager } from './sip/sipRegistrationManager';

export class JanusSipHandler {
  private sipState: SipState;
  private eventHandler: SipEventHandler;
  private callManager: SipCallManager;
  private registrationManager: SipRegistrationManager;

  constructor() {
    this.sipState = new SipState();
    this.callManager = new SipCallManager(this.sipState);
    this.eventHandler = new SipEventHandler(this.sipState, this.callManager);
    this.registrationManager = new SipRegistrationManager(this.sipState);
  }

  setSipPlugin(plugin: any) {
    this.sipState.setSipPlugin(plugin);
  }

  getSipPlugin() {
    return this.sipState.getSipPlugin();
  }

  isRegistered(): boolean {
    return this.sipState.isRegistered();
  }

  setRegistered(status: boolean) {
    this.sipState.setRegistered(status);
  }

  getCurrentCredentials(): SipCredentials | null {
    return this.sipState.getCurrentCredentials();
  }

  async register(username: string, password: string, sipHost: string): Promise<void> {
    return this.registrationManager.register(username, password, sipHost);
  }

  async call(uri: string, audioOptions?: AudioCallOptions): Promise<void> {
    return this.callManager.call(uri, audioOptions);
  }

  async acceptCall(jsep: any, audioOptions?: AudioCallOptions): Promise<void> {
    return this.callManager.acceptCall(jsep, audioOptions);
  }

  async hangup(): Promise<void> {
    return this.callManager.hangup();
  }
  
  async sendDTMF(digit: string): Promise<void> {
    if (!this.getSipPlugin()) {
      throw new Error("SIP plugin not attached");
    }
    
    if (!digit.match(/^[0-9*#]$/)) {
      throw new Error("Invalid DTMF character. Must be 0-9, *, or #");
    }
    
    return new Promise<void>((resolve, reject) => {
      const message = {
        request: "dtmf_info",
        digit: digit
      };
      
      this.getSipPlugin().send({
        message: message,
        success: () => {
          console.log(`DTMF tone ${digit} sent successfully`);
          resolve();
        },
        error: (error: any) => {
          console.error(`Error sending DTMF tone ${digit}:`, error);
          reject(new Error(`Failed to send DTMF: ${error}`));
        }
      });
    });
  }

  handleSipMessage(msg: any, jsep: any, eventHandlers: SipEventHandlers): void {
    // Add additional logging for SIP messages similar to the demo
    if (msg && msg.result) {
      const result = msg.result;
      if (result.event === "registered") {
        console.log(`Successfully registered as ${result.username}!`);
      } else if (result.event === "calling") {
        console.log("Waiting for the peer to answer...");
      } else if (result.event === "incomingcall") {
        console.log(`Incoming call from ${result.username}!`);
      } else if (result.event === "accepted") {
        console.log(`Call accepted: ${result.username}`);
      } else if (result.event === "hangup") {
        console.log(`Call hung up (${result.code} to ${result.reason})!`);
      }
    }
    
    this.eventHandler.handleSipMessage(msg, jsep, eventHandlers);
    
    // Handle remote JSEP if present (important from the demo)
    if (jsep) {
      console.log("Received SDP:", jsep);
      this.callManager.handleRemoteJsep(jsep);
    }
  }
  
  // New method to monitor media similar to the demo
  monitorMedia(): void {
    const sipPlugin = this.getSipPlugin();
    if (!sipPlugin || !sipPlugin.webrtcStuff || !sipPlugin.webrtcStuff.pc) {
      return;
    }
    
    const pc = sipPlugin.webrtcStuff.pc;
    
    // Log the state of transceivers (as seen in the demo)
    if (pc.getTransceivers) {
      pc.getTransceivers().forEach(transceiver => {
        if (transceiver.receiver && transceiver.receiver.track) {
          const track = transceiver.receiver.track;
          console.log(`Receiving ${track.kind} track:`, {
            id: track.id,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState
          });
        }
      });
    }
    
    // Check for active streams
    const audio = document.getElementById("remoteAudio") as HTMLAudioElement;
    if (audio && audio.srcObject) {
      const stream = audio.srcObject as MediaStream;
      console.log("Active remote stream:", {
        id: stream.id,
        active: stream.active,
        audioTracks: stream.getAudioTracks().length
      });
    }
  }
}
