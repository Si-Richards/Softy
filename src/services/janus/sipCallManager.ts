
import { SipState } from './sip/sipState';
import { formatE164Number } from './utils/phoneNumberUtils';
import { AudioCallOptions } from './sip/types';

export class SipCallManager {
  constructor(private sipState: SipState) {
    // Set up audio handler immediately
    this.setupAudioHandler();
  }

  async call(uri: string, audioOptions?: AudioCallOptions): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.sipState.getSipPlugin()) {
        reject(new Error("SIP plugin not attached"));
        return;
      }

      if (!this.sipState.isRegistered()) {
        reject(new Error("Not registered with SIP server"));
        return;
      }

      const formattedUri = formatE164Number(uri, this.sipState.getCurrentCredentials()?.sipHost);

      // Basic audio constraints
      const constraints = { audio: true, video: false };
      
      navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          console.log("📞 Got local media stream for call");
          
          this.sipState.getSipPlugin().createOffer({
            media: { audioSend: true, audioRecv: true, videoSend: false, videoRecv: false },
            success: (jsep: any) => {
              console.log("📞 Created offer JSEP");
              
              this.sipState.getSipPlugin().send({
                message: { request: "call", uri: formattedUri },
                jsep,
                success: () => {
                  console.log(`📞 Calling ${formattedUri}`);
                  resolve();
                },
                error: (error: any) => reject(new Error(`Call error: ${error}`))
              });
            },
            error: (error: any) => reject(new Error(`Offer error: ${error}`))
          });
        })
        .catch((error) => reject(new Error(`Media error: ${error}`)));
    });
  }

  async acceptCall(jsep: any, audioOptions?: AudioCallOptions): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.sipState.getSipPlugin()) {
        reject(new Error("SIP plugin not attached"));
        return;
      }

      const constraints = { audio: true, video: false };
      
      navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          console.log("📞 Got local media stream for accept");
          
          this.sipState.getSipPlugin().createAnswer({
            jsep: jsep,
            media: { audioSend: true, audioRecv: true, videoSend: false, videoRecv: false },
            success: (ourjsep: any) => {
              console.log("📞 Created answer JSEP");
              
              this.sipState.getSipPlugin().send({
                message: { request: "accept" },
                jsep: ourjsep,
                success: () => {
                  console.log("📞 Call accepted");
                  resolve();
                },
                error: (error: any) => reject(new Error(`Accept error: ${error}`))
              });
            },
            error: (error: any) => reject(new Error(`Answer error: ${error}`))
          });
        })
        .catch((error) => reject(new Error(`Media error: ${error}`)));
    });
  }

  /**
   * Set up the absolute simplest audio handler possible
   */
  private setupAudioHandler(): void {
    const sipPlugin = this.sipState.getSipPlugin();
    if (!sipPlugin?.webrtcStuff?.pc) {
      console.log("🔄 No peer connection yet, retrying audio handler setup in 50ms...");
      setTimeout(() => this.setupAudioHandler(), 50);
      return;
    }
    
    const pc = sipPlugin.webrtcStuff.pc;
    console.log("🎧 Setting up basic audio handler - IMMEDIATE");
    
    pc.ontrack = (event) => {
      console.log("🎵 TRACK RECEIVED:", event.track.kind, event.track.readyState, "at", new Date().toISOString());
      
      if (event.track.kind === 'audio' && event.streams?.[0]) {
        console.log("🎵 AUDIO TRACK - Creating element for stream:", event.streams[0].id);
        this.createAudioElement(event.streams[0]);
      }
    };
    
    console.log("✅ Audio handler active at", new Date().toISOString());
  }

  /**
   * Create the simplest possible audio element
   */
  private createAudioElement(stream: MediaStream): void {
    console.log("🎵 Creating audio element for stream:", stream.id);
    
    // Remove existing audio elements
    document.querySelectorAll('#callAudio').forEach(el => el.remove());
    
    const audio = document.createElement('audio');
    audio.id = 'callAudio';
    audio.autoplay = true;
    audio.controls = true;
    audio.volume = 1.0;
    audio.srcObject = stream;
    
    // Make it visible for debugging
    audio.style.position = 'fixed';
    audio.style.top = '100px';
    audio.style.right = '20px';
    audio.style.zIndex = '9999';
    audio.style.border = '2px solid red';
    
    document.body.appendChild(audio);
    console.log("✅ Audio element created and added to DOM");
    
    audio.play().catch(e => console.log("Autoplay blocked:", e.message));
  }


  async hangup(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.sipState.getSipPlugin()) {
        reject(new Error("SIP plugin not attached"));
        return;
      }

      this.sipState.getSipPlugin().send({
        message: { request: "hangup" },
        success: () => {
          console.log("Call hung up");
          resolve();
        },
        error: (error: any) => {
          reject(new Error(`Error hanging up: ${error}`));
        }
      });
    });
  }

  /**
   * Handles remote JSEP (JavaScript Session Establishment Protocol) objects
   * used in WebRTC signaling for SIP calls
   * @param jsep The remote JSEP object containing SDP information
   */
  handleRemoteJsep(jsep: any): void {
    if (!jsep) {
      console.warn("Received empty JSEP in handleRemoteJsep");
      return;
    }

    console.log("🎵 Handling remote JSEP:", jsep.type, "at", new Date().toISOString());
    
    // Ensure audio handler is set up BEFORE processing remote JSEP
    this.setupAudioHandler();
    
    const sipPlugin = this.sipState.getSipPlugin();
    if (!sipPlugin) {
      console.error("Cannot handle remote JSEP: SIP plugin not attached");
      return;
    }

    sipPlugin.handleRemoteJsep({
      jsep: jsep,
      success: () => {
        console.log("✅ Remote JSEP processed successfully at", new Date().toISOString());
        
        // Fallback: Check for existing streams if ontrack didn't fire
        setTimeout(() => {
          const pc = sipPlugin.webrtcStuff?.pc;
          if (pc && pc.getRemoteStreams) {
            const remoteStreams = pc.getRemoteStreams();
            console.log("🔍 Checking for existing remote streams:", remoteStreams.length);
            
            remoteStreams.forEach((stream, index) => {
              console.log(`🎵 Found existing remote stream ${index}:`, stream.id);
              if (stream.getAudioTracks().length > 0) {
                console.log("🎵 Creating audio element for existing stream");
                this.createAudioElement(stream);
              }
            });
          }
        }, 100);
      },
      error: (error: any) => {
        console.error(`❌ Error handling remote JSEP: ${error}`);
      }
    });
  }
}
