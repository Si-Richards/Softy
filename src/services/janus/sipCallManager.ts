
import { SipState } from './sip/sipState';
import { formatE164Number } from './utils/phoneNumberUtils';
import { AudioCallOptions } from './sip/types';

export class SipCallManager {
  constructor(private sipState: SipState) {
    // Audio handler will be set up when needed
  }

  /**
   * Ensures audio handler is ready before making calls
   */
  ensureAudioHandlerReady(): void {
    console.log("🎧 Ensuring SipCallManager audio handler is ready");
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

      console.log("📞 Starting call to:", uri, "with audio options:", audioOptions);
      const formattedUri = formatE164Number(uri, this.sipState.getCurrentCredentials()?.sipHost);
      console.log("📞 Formatted URI:", formattedUri);

      // Enhanced audio constraints with fallback
      this.getMediaWithFallback(audioOptions)
        .then((stream) => {
          console.log("📞 Got local media stream for call:", stream.id);
          
          // Log audio tracks and ensure they're enabled
          stream.getAudioTracks().forEach((track, idx) => {
            console.log(`📞 Audio track ${idx} settings:`, track.getSettings());
            track.enabled = true;
          });
          
          this.sipState.getSipPlugin().createOffer({
            media: { 
              audioSend: true, 
              audioRecv: true, 
              videoSend: false, 
              videoRecv: false,
              audioSendCodec: "opus",
              audioRecvCodec: "opus"
            },
            success: (jsep: any) => {
              console.log("📞 Created offer JSEP");
              
              this.sipState.getSipPlugin().send({
                message: { request: "call", uri: formattedUri },
                jsep,
                success: () => {
                  console.log(`📞 Calling ${formattedUri} - request sent`);
                  resolve();
                },
                error: (error: any) => {
                  console.error("📞 Error sending call request:", error);
                  reject(new Error(`Call request failed: ${error}`));
                }
              });
            },
            error: (error: any) => {
              console.error("📞 Error creating offer:", error);
              reject(new Error(`Failed to create offer: ${error}`));
            }
          });
        })
        .catch((error) => {
          console.error("📞 Media access failed:", error);
          reject(error);
        });
    });
  }

  async acceptCall(jsep: any, audioOptions?: AudioCallOptions): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.sipState.getSipPlugin()) {
        reject(new Error("SIP plugin not attached"));
        return;
      }

      console.log("📞 Accepting call with audio options:", audioOptions);
      
      this.getMediaWithFallback(audioOptions)
        .then((stream) => {
          console.log("📞 Got local media stream for accept:", stream.id);
          
          // Log audio tracks and ensure they're enabled
          stream.getAudioTracks().forEach((track, idx) => {
            console.log(`📞 Accept audio track ${idx} settings:`, track.getSettings());
            track.enabled = true;
          });
          
          this.sipState.getSipPlugin().createAnswer({
            jsep: jsep,
            media: { 
              audioSend: true, 
              audioRecv: true, 
              videoSend: false, 
              videoRecv: false,
              audioSendCodec: "opus",
              audioRecvCodec: "opus"
            },
            success: (ourjsep: any) => {
              console.log("📞 Created answer JSEP");
              
              this.sipState.getSipPlugin().send({
                message: { request: "accept" },
                jsep: ourjsep,
                success: () => {
                  console.log("📞 Call accepted successfully");
                  resolve();
                },
                error: (error: any) => {
                  console.error("📞 Error sending accept:", error);
                  reject(new Error(`Accept request failed: ${error}`));
                }
              });
            },
            error: (error: any) => {
              console.error("📞 Error creating answer:", error);
              reject(new Error(`Failed to create answer: ${error}`));
            }
          });
        })
        .catch((error) => {
          console.error("📞 Media access failed for accept:", error);
          reject(error);
        });
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
   * Enhanced media access with fallback logic for audio device constraints
   */
  private async getMediaWithFallback(audioOptions?: AudioCallOptions): Promise<MediaStream> {
    console.log("📞 Getting media with fallback, options:", audioOptions);
    
    // Check if devices are available before trying exact constraints
    let availableDevices: MediaDeviceInfo[] = [];
    try {
      availableDevices = await navigator.mediaDevices.enumerateDevices();
      console.log("📞 Available audio input devices:", 
        availableDevices.filter(d => d.kind === 'audioinput').map(d => ({id: d.deviceId, label: d.label}))
      );
    } catch (error) {
      console.warn("📞 Could not enumerate devices:", error);
    }

    // Primary constraints with specific device
    let primaryConstraints: MediaStreamConstraints = {
      audio: audioOptions?.audioInput ? {
        deviceId: { exact: audioOptions.audioInput },
        echoCancellation: audioOptions.echoCancellation ?? true,
        noiseSuppression: audioOptions.noiseSuppression ?? true,
        autoGainControl: audioOptions.autoGainControl ?? true
      } : {
        echoCancellation: audioOptions?.echoCancellation ?? true,
        noiseSuppression: audioOptions?.noiseSuppression ?? true,
        autoGainControl: audioOptions?.autoGainControl ?? true
      },
      video: false
    };

    // Fallback constraints without specific device
    const fallbackConstraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: audioOptions?.echoCancellation ?? true,
        noiseSuppression: audioOptions?.noiseSuppression ?? true,
        autoGainControl: audioOptions?.autoGainControl ?? true
      },
      video: false
    };

    // Try primary constraints first
    try {
      console.log("📞 Trying primary constraints:", JSON.stringify(primaryConstraints));
      const stream = await navigator.mediaDevices.getUserMedia(primaryConstraints);
      console.log("✅ Primary constraints succeeded");
      return stream;
    } catch (error: any) {
      console.warn("📞 Primary constraints failed:", error.name, error.message);
      
      // If it's a device constraint issue, try fallback
      if (error.name === 'OverconstrainedError' || error.name === 'NotFoundError' || 
          error.message.includes('deviceId') || error.message.includes('device')) {
        
        console.log("📞 Trying fallback constraints (no specific device)");
        try {
          const stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
          console.log("✅ Fallback constraints succeeded");
          return stream;
        } catch (fallbackError: any) {
          console.error("📞 Fallback constraints also failed:", fallbackError.name, fallbackError.message);
          
          // Provide specific error messages
          if (fallbackError.name === 'NotAllowedError') {
            throw new Error("NotAllowedError: Microphone access denied. Please allow microphone permissions.");
          } else if (fallbackError.name === 'NotFoundError') {
            throw new Error("NotFoundError: No microphone found. Please connect a microphone.");
          } else {
            throw new Error(`Media access failed: ${fallbackError.message}`);
          }
        }
      } else {
        // Re-throw non-device related errors
        if (error.name === 'NotAllowedError') {
          throw new Error("NotAllowedError: Microphone access denied. Please allow microphone permissions.");
        } else if (error.name === 'NotFoundError') {
          throw new Error("NotFoundError: No microphone found. Please connect a microphone.");
        } else {
          throw new Error(`Media access failed: ${error.message}`);
        }
      }
    }
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
