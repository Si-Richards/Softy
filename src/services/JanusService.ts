import { JanusEventHandlers } from './janus/eventHandlers';
import type { JanusOptions, SipCredentials } from './janus/types';
import type { AudioCallOptions } from './janus/sip/types';

class JanusService {
  private janus: any = null;
  private sipPlugin: any = null;
  private eventHandlers: JanusEventHandlers;
  private opaqueId: string;
  private registered: boolean = false;
  private mediaHandler: JanusMediaHandler;
  
  constructor() {
    this.eventHandlers = new JanusEventHandlers();
    this.opaqueId = "softphone-" + Math.floor(Math.random() * 10000);
    this.mediaHandler = new JanusMediaHandler();
  }

  async initialize(options: JanusOptions): Promise<boolean> {
    if (!options.server) {
      const errorMsg = "No Janus server URL provided";
      if (options.error) options.error(errorMsg);
      if (this.eventHandlers.onError) this.eventHandlers.onError(errorMsg);
      throw new Error(errorMsg);
    }

    // Cleanup any existing session
    this.disconnect();

    try {
      await this.initializeJanus(options);
      await this.attachSipPlugin();
      
      if (options.success) options.success();
      return true;
    } catch (error: any) {
      const errorMsg = `Failed to initialize Janus: ${error.message || error}`;
      if (options.error) options.error(errorMsg);
      if (this.eventHandlers.onError) this.eventHandlers.onError(errorMsg);
      this.disconnect();
      throw new Error(errorMsg);
    }
  }

  private async initializeJanus(options: JanusOptions): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (typeof window.Janus === 'undefined') {
        reject(new Error('Janus library not loaded'));
        return;
      }

      // Initialize Janus
      window.Janus.init({
        debug: options.debug || "all",
        callback: () => {
          console.log("Janus library initialized");
          
          // Create Janus session
          this.janus = new window.Janus({
            server: options.server,
            apisecret: options.apiSecret,
            iceServers: options.iceServers,
            success: () => {
              console.log("Janus session created successfully");
              resolve();
            },
            error: (error: any) => {
              console.error("Error creating Janus session:", error);
              reject(error);
            },
            destroyed: options.destroyed
          });
        },
        error: (error: any) => {
          console.error("Error initializing Janus library:", error);
          reject(error);
        }
      });
    });
  }

  private async attachSipPlugin(): Promise<void> {
    if (!this.janus) {
      throw new Error("Janus not initialized");
    }

    return new Promise<void>((resolve, reject) => {
      this.janus.attach({
        plugin: "janus.plugin.sip",
        opaqueId: this.opaqueId,
        success: (pluginHandle: any) => {
          this.sipPlugin = pluginHandle;
          console.log("SIP plugin attached:", pluginHandle);
          resolve();
        },
        error: (error: any) => {
          const errorMsg = `Error attaching to SIP plugin: ${error}`;
          console.error(errorMsg);
          if (this.eventHandlers.onError) this.eventHandlers.onError(errorMsg);
          reject(new Error(errorMsg));
        },
        onmessage: (msg: any, jsep: any) => {
          console.log("Received SIP message:", msg);
          this.handleSipMessage(msg, jsep);
        },
        onlocalstream: (stream: MediaStream) => {
          console.log("Got local stream", stream);
          this.mediaHandler.setLocalStream(stream);
        },
        onremotestream: (stream: MediaStream) => {
          console.log("Got remote stream", stream);
          this.mediaHandler.setRemoteStream(stream);
          
          // Log audio track information
          const audioTracks = stream.getAudioTracks();
          console.log(`Remote stream has ${audioTracks.length} audio tracks`);
          audioTracks.forEach((track, idx) => {
            console.log(`Audio track ${idx}:`, {
              id: track.id,
              kind: track.kind,
              label: track.label,
              enabled: track.enabled,
              muted: track.muted,
              readyState: track.readyState
            });
          });
        },
        oncleanup: () => {
          console.log("SIP plugin cleaned up");
          this.mediaHandler.clearStreams();
        }
      });
    });
  }

  private handleSipMessage(msg: any, jsep?: any): void {
    if (msg.error) {
      console.error("SIP Error:", msg.error);
      if (this.eventHandlers.onError) {
        this.eventHandlers.onError(`SIP Error: ${msg.error}`);
      }
      return;
    }

    if (!msg.result) return;

    const result = msg.result;
    const event = result.event;

    switch (event) {
      case "registered":
        console.log("SIP Registration successful");
        this.registered = true;
        if (this.eventHandlers.onRegistrationSuccess) {
          this.eventHandlers.onRegistrationSuccess();
        }
        break;

      case "registration_failed":
        console.error("SIP Registration failed:", result.code, result.reason);
        this.registered = false;
        if (this.eventHandlers.onRegistrationFailed) {
          this.eventHandlers.onRegistrationFailed(
            `Registration failed: ${result.code} - ${result.reason}`
          );
        }
        break;
        
      case "incomingcall":
        console.log("Incoming call from:", result.username);
        if (this.onIncomingCallCallback) {
          this.onIncomingCallCallback(result.username, jsep);
        }
        break;
        
      case "accepted":
        console.log("Call accepted");
        if (this.onCallConnectedCallback) {
          this.onCallConnectedCallback();
        }
        break;
        
      case "hangup":
        console.log("Call ended");
        if (this.onCallEndedCallback) {
          this.onCallEndedCallback();
        }
        break;

      default:
        console.log("Unhandled SIP event:", event);
    }
    
    if (jsep) {
      console.log("Handling incoming JSEP:", jsep);
      this.sipPlugin?.handleRemoteJsep({ jsep: jsep });
    }
  }
  
  // Callback handlers for SIP events
  private onIncomingCallCallback: ((from: string, jsep: any) => void) | null = null;
  private onCallConnectedCallback: (() => void) | null = null;
  private onCallEndedCallback: (() => void) | null = null;
  
  setOnIncomingCall(callback: ((from: string, jsep: any) => void) | null): void {
    this.onIncomingCallCallback = callback;
  }
  
  setOnCallConnected(callback: (() => void) | null): void {
    this.onCallConnectedCallback = callback;
  }
  
  setOnCallEnded(callback: (() => void) | null): void {
    this.onCallEndedCallback = callback;
  }

  setOnError(callback: (error: string) => void): void {
    this.eventHandlers.setOnError(callback);
  }
  
  setOnRegistrationSuccess(callback: () => void): void {
    this.eventHandlers.setOnRegistrationSuccess(callback);
  }

  setOnRegistrationFailed(callback: (error: string) => void): void {
    this.eventHandlers.setOnRegistrationFailed(callback);
  }

  async register(username: string, password: string, sipHost: string): Promise<void> {
    if (!this.sipPlugin) {
      throw new Error("SIP plugin not attached");
    }

    try {
      // Parse the username and host for proper formatting
      let user = username;
      let domain = sipHost;
      
      // Strip any 'sip:' prefix from the username if it exists
      if (user.startsWith("sip:")) {
        user = user.substring(4);
      }

      // Check if username contains @ which means it already has domain
      if (user.includes("@")) {
        const parts = user.split("@");
        user = parts[0];
        domain = parts[1].split(":")[0]; // Use domain from username, ignoring port
      }

      // Extract port from sipHost if present
      const hostParts = domain.split(":");
      const host = hostParts[0];
      const port = hostParts.length > 1 ? hostParts[1] : "5060";
      
      // Create SIP URI
      const identity = `sip:${user}@${host}`;
      const proxy = `sip:${host}:${port}`;
      
      console.log(`Registering as: ${identity}, proxy: ${proxy}`);

      // Registration request - Updated: Removed ha1_secret parameter
      const request = {
        request: "register",
        username: identity,
        display_name: user,
        secret: password,
        proxy: proxy,
        authuser: user
      };

      this.sipPlugin.send({
        message: request,
        success: () => {
          console.log("Registration request sent successfully");
        },
        error: (error: any) => {
          console.error("Error sending registration request:", error);
          if (this.eventHandlers.onError) {
            this.eventHandlers.onError(`Failed to send registration request: ${error}`);
          }
        }
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      if (this.eventHandlers.onError) {
        this.eventHandlers.onError(`Registration error: ${error.message || error}`);
      }
      throw error;
    }
  }
  
  // Updated call method to use audio devices
  async call(destination: string, isVideoCall: boolean = false, audioOptions?: AudioCallOptions): Promise<void> {
    if (!this.sipPlugin) {
      throw new Error("SIP plugin not attached");
    }
    
    // Get the saved audio input device if not provided
    if (!audioOptions) {
      const savedAudioInput = localStorage.getItem('selectedAudioInput');
      audioOptions = {
        audioInput: savedAudioInput || undefined
      };
    }
    
    // Apply audio settings from localStorage
    try {
      const storedSettings = localStorage.getItem('audioSettings');
      if (storedSettings && !audioOptions.echoCancellation) {
        const audioSettings = JSON.parse(storedSettings);
        audioOptions.echoCancellation = audioSettings.echoSuppression;
        audioOptions.noiseSuppression = audioSettings.noiseCancellation;
        audioOptions.autoGainControl = audioSettings.autoGainControl;
      }
    } catch (error) {
      console.error("Error parsing audio settings:", error);
    }
    
    const callRequest = {
      request: "call",
      uri: destination.indexOf("sip:") === 0 ? destination : `sip:${destination}`,
      video: isVideoCall
    };
    
    return new Promise<void>((resolve, reject) => {
      // Get media constraints for the call
      const constraints = {
        audio: audioOptions?.audioInput ? 
          { deviceId: { exact: audioOptions.audioInput } } : true,
        video: isVideoCall ? (localStorage.getItem('selectedVideoInput') ? 
          { deviceId: { exact: localStorage.getItem('selectedVideoInput') } } : true) : false
      };
      
      console.log("Getting user media with constraints:", constraints);
      
      navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
          console.log("Got local media stream for call:", stream);
          
          // Ensure audio tracks are enabled
          stream.getAudioTracks().forEach(track => {
            console.log("Audio track settings:", track.getSettings());
            track.enabled = true;
          });
          
          this.sipPlugin.createOffer({
            media: {
              audioSend: true,
              audioRecv: true,
              videoSend: isVideoCall,
              videoRecv: isVideoCall
            },
            success: (jsep: any) => {
              console.log("Got SDP offer", jsep);
              this.sipPlugin.send({
                message: callRequest,
                jsep: jsep,
                success: () => {
                  console.log("Call request sent");
                  resolve();
                },
                error: (error: any) => {
                  console.error("Error sending call request:", error);
                  reject(new Error(`Call failed: ${error}`));
                }
              });
            },
            error: (error: any) => {
              console.error("Error creating SDP offer:", error);
              reject(new Error(`Failed to create offer: ${error}`));
            }
          });
        })
        .catch(error => {
          console.error("Error getting user media:", error);
          reject(new Error(`Failed to get user media: ${error}`));
        });
    });
  }
  
  async acceptCall(jsep: any, audioOptions?: AudioCallOptions): Promise<void> {
    if (!this.sipPlugin) {
      throw new Error("SIP plugin not attached");
    }
    
    // Get the saved audio input device if not provided
    if (!audioOptions) {
      const savedAudioInput = localStorage.getItem('selectedAudioInput');
      audioOptions = {
        audioInput: savedAudioInput || undefined
      };
    }
    
    return new Promise<void>((resolve, reject) => {
      // Get media access with specified audio device
      const constraints = {
        audio: audioOptions?.audioInput ? 
          { deviceId: { exact: audioOptions.audioInput } } : true,
        video: jsep.type !== "offer" || jsep.sdp.indexOf("m=video") > 0
      };
      
      console.log("Getting user media for accepting call:", constraints);
      
      navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
          console.log("Got local stream for accepting call", stream);
          
          // Ensure audio tracks are enabled
          stream.getAudioTracks().forEach(track => {
            console.log("Audio track settings:", track.getSettings());
            track.enabled = true;
          });
          
          this.sipPlugin.createAnswer({
            jsep: jsep,
            media: { 
              audioSend: true, 
              audioRecv: true,
              videoSend: jsep.type !== "offer" || jsep.sdp.indexOf("m=video") > 0,
              videoRecv: jsep.type !== "offer" || jsep.sdp.indexOf("m=video") > 0
            },
            success: (ourjsep: any) => {
              const body = { request: "accept" };
              this.sipPlugin.send({
                message: body,
                jsep: ourjsep,
                success: () => {
                  console.log("Call accepted");
                  
                  // Apply audio output device if specified and supported
                  const savedAudioOutput = localStorage.getItem('selectedAudioOutput');
                  if (savedAudioOutput && this.remoteStream) {
                    // Find or create audio element to play the remote stream
                    let audioElement = document.querySelector('audio#remoteAudio') as HTMLAudioElement;
                    if (!audioElement) {
                      audioElement = document.createElement('audio');
                      audioElement.id = 'remoteAudio';
                      audioElement.autoplay = true;
                      document.body.appendChild(audioElement);
                    }
                    
                    // Set the audio output device if the browser supports it
                    if ('setSinkId' in HTMLAudioElement.prototype) {
                      (audioElement as any).setSinkId(savedAudioOutput)
                        .then(() => console.log("Audio output set to:", savedAudioOutput))
                        .catch(e => console.error("Error setting audio output:", e));
                    }
                    
                    // Set the remote stream to the audio element
                    audioElement.srcObject = this.remoteStream;
                  }
                  
                  resolve();
                },
                error: (error: any) => {
                  console.error("Error accepting call:", error);
                  reject(new Error(`Failed to accept call: ${error}`));
                }
              });
            },
            error: (error: any) => {
              console.error("Error creating answer:", error);
              reject(new Error(`Failed to create answer: ${error}`));
            }
          });
        })
        .catch(error => {
          console.error("Error getting user media for call:", error);
          reject(new Error(`Failed to get user media: ${error}`));
        });
    });
  }
  
  /**
   * Send DTMF tones during an active call
   * @param dtmf The DTMF tone to send (0-9, *, #)
   * @returns Promise that resolves when the DTMF has been sent
   */
  async sendDTMF(dtmf: string): Promise<void> {
    if (!this.sipPlugin) {
      throw new Error("SIP plugin not attached");
    }
    
    if (!dtmf.match(/^[0-9*#]$/)) {
      throw new Error("Invalid DTMF character. Must be 0-9, *, or #");
    }
    
    console.log(`Sending DTMF tone: ${dtmf}`);
    
    return new Promise<void>((resolve, reject) => {
      // Create the DTMF request message
      const message = {
        request: "dtmf_info",
        digit: dtmf
      };
      
      this.sipPlugin.send({
        message: message,
        success: () => {
          console.log(`DTMF tone ${dtmf} sent successfully`);
          resolve();
        },
        error: (error: any) => {
          console.error(`Error sending DTMF tone ${dtmf}:`, error);
          reject(new Error(`Failed to send DTMF: ${error}`));
        }
      });
    });
  }
  
  async hangup(): Promise<void> {
    if (!this.sipPlugin) {
      return;
    }
    
    const hangupMsg = { request: "hangup" };
    
    return new Promise<void>((resolve) => {
      this.sipPlugin.send({
        message: hangupMsg,
        success: () => {
          console.log("Hangup sent");
          resolve();
        },
        error: (error: any) => {
          console.error("Error hanging up:", error);
          // Still resolve as we want to clean up the UI
          resolve();
        }
      });
    });
  }
  
  // Stream handling methods
  getLocalStream(): MediaStream | null {
    return this.mediaHandler.getLocalStream();
  }
  
  getRemoteStream(): MediaStream | null {
    return this.mediaHandler.getRemoteStream();
  }
  
  hasAudioTracks(): boolean {
    return this.mediaHandler.hasAudioTracks();
  }
  
  getAudioTracks(): MediaStreamTrack[] {
    return this.mediaHandler.getAudioTracks();
  }

  isRegistered(): boolean {
    return this.registered;
  }

  isJanusConnected(): boolean {
    return !!this.janus;
  }

  disconnect(): void {
    this.registered = false;
    
    // Clean up media handler
    this.mediaHandler.clearStreams();
    
    if (this.sipPlugin) {
      this.sipPlugin.detach();
      this.sipPlugin = null;
    }
    
    if (this.janus) {
      this.janus.destroy();
      this.janus = null;
    }
  }
}

const janusService = new JanusService();
export default janusService;
