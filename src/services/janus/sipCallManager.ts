
import { SipState } from './sip/sipState';
import { MediaConfigHandler } from './mediaConfig';
import { formatE164Number } from './utils/phoneNumberUtils';
import { AudioCallOptions } from './sip/types';

export class SipCallManager {
  private mediaConfig: MediaConfigHandler;

  constructor(private sipState: SipState) {
    this.mediaConfig = new MediaConfigHandler();
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

      // Format the number properly in E.164 format with SIP URI
      const formattedUri = formatE164Number(uri, this.sipState.getCurrentCredentials()?.sipHost);

      // Get the configured audio devices from localStorage or options param
      const constraints = this.mediaConfig.getCallMediaConstraints(audioOptions);

      console.log("Getting user media with constraints:", JSON.stringify(constraints));
      
      navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          console.log("Got local media stream:", stream);
          console.log("Audio tracks:", stream.getAudioTracks().length);
          
          // Log audio track settings
          stream.getAudioTracks().forEach((track, idx) => {
            console.log(`Audio track ${idx} settings:`, track.getSettings());
          });
          
          // Ensure audio tracks are enabled
          stream.getAudioTracks().forEach(track => {
            console.log("Audio track enabled:", track.enabled);
            track.enabled = true;
          });

          // Configure SDP constraints based on Janus SIP demo
          const sdpConstraints = {
            'mandatory': {
              'OfferToReceiveAudio': true,
              'OfferToReceiveVideo': false
            }
          };

          // Follow exact createOffer structure from Janus SIP demo
          this.sipState.getSipPlugin().createOffer({
            media: {
              audioSend: true, audioRecv: true,
              videoSend: false, videoRecv: false,
              data: false
            },
            simulcast: false,
            success: (jsep: any) => {
              console.log("Created offer with JSEP:", jsep);
              
              // Set up ontrack handler before sending (critical timing)
              this.setupPeerConnectionHandlers();
              
              // Match call request from Janus SIP demo
              const message = {
                request: "call",
                uri: formattedUri,
                headers: {
                  "User-Agent": "Janus SIP Plugin",
                  "X-Janus-SIP-Client": "Lovable WebRTC"
                },
                autoaccept: false,
                srtp: "sdes_optional",
            };

              this.sipState.getSipPlugin().send({
                message,
                jsep,
                success: () => {
                  console.log(`Calling ${formattedUri}`);
                  resolve();
                },
                error: (error: any) => {
                  reject(new Error(`Error calling: ${error}`));
                }
              });
            },
            error: (error: any) => {
              reject(new Error(`WebRTC error: ${error}`));
            }
          });
        })
        .catch((error) => {
          reject(new Error(`Media error: ${error}`));
        });
    });
  }

  async acceptCall(jsep: any, audioOptions?: AudioCallOptions): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.sipState.getSipPlugin()) {
        reject(new Error("SIP plugin not attached"));
        return;
      }

      console.log("SipCallManager: Accepting call with JSEP:", jsep);
      
      // Get media constraints for answering calls with selected audio device
      const constraints = this.mediaConfig.getCallMediaConstraints(audioOptions);
      
      console.log("Accepting call with constraints:", JSON.stringify(constraints));
      
      navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          console.log("Got local media stream for accepting call:", stream);
          
          // Log audio track settings
          stream.getAudioTracks().forEach((track, idx) => {
            console.log(`Audio track ${idx} settings:`, track.getSettings());
          });
          
          // Ensure audio tracks are enabled
          stream.getAudioTracks().forEach(track => {
            track.enabled = true;
          });
          
          // Match createAnswer from Janus SIP demo
          this.sipState.getSipPlugin().createAnswer({
            jsep: jsep,
            media: { 
              audioSend: true, audioRecv: true,
              videoSend: false, videoRecv: false,
              data: false
            },
            success: (ourjsep: any) => {
              console.log("Created answer with JSEP:", ourjsep);
              
              // Set up ontrack handler before sending (critical timing)
              this.setupPeerConnectionHandlers();
              
              const message = { 
                request: "accept",
                headers: {
                  "User-Agent": "Janus SIP Plugin",
                  "X-Janus-SIP-Client": "Lovable WebRTC"
                }
              };
              this.sipState.getSipPlugin().send({
                message,
                jsep: ourjsep,
                success: () => {
                  console.log("Call accepted successfully");
                  resolve();
                },
                error: (error: any) => {
                  console.error(`Error accepting call: ${error}`);
                  reject(new Error(`Error accepting call: ${error}`));
                }
              });
            },
            error: (error: any) => {
              console.error(`WebRTC error when creating answer: ${error}`);
              reject(new Error(`WebRTC error: ${error}`));
            }
          });
        })
        .catch((error) => {
          console.error(`Media error when accepting call: ${error}`);
          reject(new Error(`Media error when accepting call: ${error}`));
        });
    });
  }

  /**
   * Ultra simple audio setup - just assign stream to audio element
   */
  private setupPeerConnectionHandlers(): void {
    const sipPlugin = this.sipState.getSipPlugin();
    if (!sipPlugin?.webrtcStuff?.pc) {
      console.error("❌ No peer connection available");
      return;
    }
    
    const pc = sipPlugin.webrtcStuff.pc;
    console.log("🎵 Setting up ULTRA SIMPLE audio handler");
    
    // Only set ontrack - nothing else
    pc.ontrack = (event) => {
      console.log("🎵 TRACK EVENT:", {
        kind: event.track.kind,
        hasStreams: !!event.streams?.length,
        streamId: event.streams?.[0]?.id
      });
      
      if (event.track.kind === 'audio' && event.streams?.[0]) {
        console.log("🎵 AUDIO TRACK FOUND - creating element");
        this.createAudioElement(event.streams[0]);
      }
    };
    
    console.log("✅ Simple ontrack handler set");
  }

  /**
   * Create audio element and assign stream - simplest possible
   */
  private createAudioElement(stream: MediaStream): void {
    console.log("🎵 Creating audio element for stream:", stream.id);
    
    // Remove existing
    const existing = document.getElementById("remoteAudio");
    if (existing) existing.remove();
    
    // Create new
    const audio = document.createElement('audio');
    audio.id = 'remoteAudio';
    audio.autoplay = true;
    audio.srcObject = stream;
    audio.volume = 1.0;
    document.body.appendChild(audio);
    
    console.log("🎵 Audio element created and appended");
    
    // Try to play
    audio.play().catch(e => {
      console.log("🎵 Autoplay failed, adding controls:", e.message);
      audio.controls = true;
    });
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

    console.log("Handling remote JSEP:", jsep.type);
    
    const sipPlugin = this.sipState.getSipPlugin();
    if (!sipPlugin) {
      console.error("Cannot handle remote JSEP: SIP plugin not attached");
      return;
    }

    sipPlugin.handleRemoteJsep({
      jsep: jsep,
      success: () => {
        console.log("✅ Remote JSEP processed successfully");
        // ontrack handler should already be set up from offer/answer creation
      },
      error: (error: any) => {
        console.error(`❌ Error handling remote JSEP: ${error}`);
      }
    });
  }
}
