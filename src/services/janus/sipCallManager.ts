
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
                  
                  // Set up ontrack handler for RTCPeerConnection
                  this.setupPeerConnectionHandlers();
                  
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
                  
                  // Set up ontrack handler for RTCPeerConnection
                  this.setupPeerConnectionHandlers();
                  
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
   * Set up the peer connection track handlers
   * This implements the recommended track handling approach
   */
  private setupPeerConnectionHandlers(): void {
    // Get the RTCPeerConnection from the SIP plugin
    const sipPlugin = this.sipState.getSipPlugin();
    if (!sipPlugin || !sipPlugin.webrtcStuff || !sipPlugin.webrtcStuff.pc) {
      console.warn("Cannot set up peer connection handlers: No RTCPeerConnection available");
      return;
    }
    
    const pc = sipPlugin.webrtcStuff.pc;
    console.log("Setting up ontrack handler for RTCPeerConnection:", pc);
    
    // Monitor ICE connection state changes (from demo)
    pc.oniceconnectionstatechange = () => {
      console.log("ICE state changed to", pc.iceConnectionState);
      
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        console.log("Janus says our WebRTC PeerConnection is up now");
      } else if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
        console.log("Janus says our WebRTC PeerConnection is down now");
      }
    };
    
    // Set up direct ontrack handler as recommended
    pc.ontrack = (event) => {
      console.log("Incoming track", event);
      
      // Critical: Check if we have streams
      if (event.streams && event.streams.length > 0) {
        console.log("Created remote audio stream:", event.streams[0]);
        
        // Get or create remote audio element
        const audio = document.getElementById("remoteAudio") as HTMLAudioElement;
        if (audio) {
          // Assign the stream to the audio element
          audio.srcObject = event.streams[0];
          
          // Try to play the audio
          audio.play().catch(err => {
            console.error("Playback error:", err);
            
            // If autoplay fails, show controls
            audio.controls = true;
            audio.style.display = 'block';
          });
          
          // Log audio tracks
          const tracks = event.streams[0].getAudioTracks();
          console.log("Audio tracks:", tracks);
          tracks.forEach((track, idx) => {
            console.log(`Track ${idx}:`, {
              id: track.id,
              enabled: track.enabled,
              muted: track.muted,
              readyState: track.readyState
            });
            
            // Add unmute listener (from demo)
            track.addEventListener('unmute', () => {
              console.log("Remote track flowing again:", track);
            });
            
            // Add ended listener (from demo)
            track.addEventListener('ended', () => {
              console.log("Remote track removed:", track);
            });
          });
        } else {
          console.error("Remote audio element not found!");
          
          // Create audio element if it doesn't exist
          const newAudio = document.createElement('audio');
          newAudio.id = 'remoteAudio';
          newAudio.autoplay = true;
          newAudio.setAttribute('playsinline', '');
          newAudio.srcObject = event.streams[0];
          document.body.appendChild(newAudio);
          
          // Try to play
          newAudio.play().catch(err => console.error("New audio playback error:", err));
        }
      } else {
        console.warn("No streams in ontrack event");
      }
    };
    
    // Also set up connection state change monitoring
    pc.onconnectionstatechange = () => {
      console.log("PeerConnection connection state changed:", pc.connectionState);
      
      if (pc.connectionState === 'connected') {
        console.log("Janus started receiving our audio");
      }
    };
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
        
        // Set up ontrack handler after handling remote jsep
        this.setupPeerConnectionHandlers();
      },
      error: (error: any) => {
        console.error(`Error handling remote JSEP: ${error}`);
      }
    });
  }
}
