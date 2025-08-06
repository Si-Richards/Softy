
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
              
              // Set up ontrack handler immediately after offer creation (Janus pattern)
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
              
              // Set up ontrack handler immediately after answer creation (Janus pattern)
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
   * Set up the peer connection track handlers following Janus SIP demo pattern
   */
  private setupPeerConnectionHandlers(): void {
    const sipPlugin = this.sipState.getSipPlugin();
    if (!sipPlugin || !sipPlugin.webrtcStuff || !sipPlugin.webrtcStuff.pc) {
      console.warn("Cannot set up peer connection handlers: No RTCPeerConnection available");
      return;
    }
    
    const pc = sipPlugin.webrtcStuff.pc;
    console.log("Setting up peer connection handlers on PC:", pc);
    
    // Always set up ontrack - don't check if exists to avoid missing streams
    console.log("Setting up ontrack handler");
    
    // ICE connection state monitoring
    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
    };
    
    // Connection state monitoring
    pc.onconnectionstatechange = () => {
      console.log("Peer connection state:", pc.connectionState);
    };
    
    // Track handler - this is the critical part for audio
    pc.ontrack = (event) => {
      console.log("=== ONTRACK EVENT FIRED ===");
      console.log("Track:", event.track);
      console.log("Track kind:", event.track.kind);
      console.log("Track ID:", event.track.id);
      console.log("Track enabled:", event.track.enabled);
      console.log("Track muted:", event.track.muted);
      console.log("Track readyState:", event.track.readyState);
      console.log("Streams:", event.streams);
      console.log("Streams count:", event.streams?.length || 0);
      
      if (event.track.kind === 'audio') {
        console.log("=== AUDIO TRACK DETECTED ===");
        
        if (event.streams && event.streams.length > 0) {
          const stream = event.streams[0];
          console.log("Processing audio stream:", stream.id);
          console.log("Stream active:", stream.active);
          console.log("Stream audio tracks:", stream.getAudioTracks().length);
          
          // Ensure we have a single audio element
          let audio = document.getElementById("remoteAudio") as HTMLAudioElement;
          if (!audio) {
            console.log("Creating remoteAudio element");
            audio = document.createElement('audio');
            audio.id = 'remoteAudio';
            audio.autoplay = true;
            audio.setAttribute('playsinline', '');
            audio.controls = false;
            audio.volume = 1.0;
            document.body.appendChild(audio);
          }
          
          // Clear any existing source
          if (audio.srcObject) {
            console.log("Clearing existing audio source");
            audio.srcObject = null;
          }
          
          // Set the new stream
          audio.srcObject = stream;
          console.log("Audio stream assigned to element");
          
          // Log track details
          stream.getAudioTracks().forEach((track, idx) => {
            console.log(`Stream audio track ${idx}:`, {
              id: track.id,
              enabled: track.enabled,
              muted: track.muted,
              readyState: track.readyState,
              label: track.label
            });
          });
          
          // Attempt playback
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log("✅ Audio playback started successfully");
              })
              .catch(err => {
                console.error("❌ Audio auto-play failed:", err);
                // Show audio controls as fallback
                audio.controls = true;
                audio.style.display = 'block';
                audio.style.position = 'fixed';
                audio.style.bottom = '20px';
                audio.style.right = '20px';
                audio.style.zIndex = '9999';
                audio.style.backgroundColor = 'white';
                audio.style.border = '2px solid red';
                audio.style.borderRadius = '8px';
                audio.style.padding = '5px';
              });
          }
          
          // Set up track event listeners
          event.track.onended = () => {
            console.log("Audio track ended");
          };
          
          event.track.onmute = () => {
            console.log("Audio track muted");
          };
          
          event.track.onunmute = () => {
            console.log("Audio track unmuted");
          };
        } else {
          console.warn("Audio track received but no streams available");
        }
      } else {
        console.log("Non-audio track received:", event.track.kind);
      }
    };
    
    console.log("✅ Peer connection handlers configured");
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
