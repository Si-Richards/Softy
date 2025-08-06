
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
                  
                  // Don't set up handlers here - wait for remote JSEP
                  
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
                  
                  // Don't set up handlers here - wait for remote JSEP
                  
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
   * Set up the peer connection track handlers following Janus SIP demo pattern
   */
  private setupPeerConnectionHandlers(): void {
    const sipPlugin = this.sipState.getSipPlugin();
    if (!sipPlugin || !sipPlugin.webrtcStuff || !sipPlugin.webrtcStuff.pc) {
      console.warn("Cannot set up peer connection handlers: No RTCPeerConnection available");
      return;
    }
    
    const pc = sipPlugin.webrtcStuff.pc;
    console.log("Setting up peer connection handlers:", pc);
    
    // Check if already set up to avoid duplicates
    if (pc.ontrack) {
      console.log("ontrack handler already exists, skipping setup");
      return;
    }
    
    // ICE connection state monitoring
    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        console.log("ICE connection established");
      }
    };
    
    // Connection state monitoring
    pc.onconnectionstatechange = () => {
      console.log("Peer connection state:", pc.connectionState);
    };
    
    // Track handler - this is where audio tracks arrive
    pc.ontrack = (event) => {
      console.log("=== TRACK RECEIVED ===", event);
      console.log("Track kind:", event.track.kind);
      console.log("Track ID:", event.track.id);
      console.log("Track enabled:", event.track.enabled);
      console.log("Track muted:", event.track.muted);
      console.log("Track ready state:", event.track.readyState);
      console.log("Streams count:", event.streams?.length || 0);
      
      if (event.track.kind === 'audio' && event.streams?.length > 0) {
        const stream = event.streams[0];
        console.log("Audio stream received:", stream);
        
        // Create or get audio element
        let audio = document.getElementById("remoteAudio") as HTMLAudioElement;
        if (!audio) {
          console.log("Creating new audio element");
          audio = document.createElement('audio');
          audio.id = 'remoteAudio';
          audio.autoplay = true;
          audio.setAttribute('playsinline', '');
          audio.controls = false;
          document.body.appendChild(audio);
        }
        
        // Attach stream to audio element
        audio.srcObject = stream;
        console.log("Stream attached to audio element");
        
        // Attempt to play
        audio.play()
          .then(() => {
            console.log("Audio playing successfully");
          })
          .catch(err => {
            console.error("Auto-play failed:", err);
            // Show controls for manual play
            audio.controls = true;
            audio.style.display = 'block';
            audio.style.position = 'fixed';
            audio.style.bottom = '10px';
            audio.style.right = '10px';
            audio.style.zIndex = '9999';
          });
        
        // Track event listeners
        event.track.addEventListener('unmute', () => {
          console.log("Audio track unmuted");
        });
        
        event.track.addEventListener('ended', () => {
          console.log("Audio track ended");
        });
      }
    };
    
    console.log("Peer connection handlers set up successfully");
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
        console.log("Remote JSEP processed successfully");
        
        // Now is the right time to set up ontrack handler
        setTimeout(() => {
          this.setupPeerConnectionHandlers();
        }, 100);
      },
      error: (error: any) => {
        console.error(`Error handling remote JSEP: ${error}`);
      }
    });
  }
}
