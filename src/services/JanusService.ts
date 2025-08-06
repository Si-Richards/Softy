import { JanusEventHandlers } from './janus/eventHandlers';
import type { JanusOptions, SipCredentials } from './janus/types';
import type { AudioCallOptions } from './janus/sip/types';
import audioService from '@/services/AudioService';
import { SipCallManager } from './janus/sipCallManager';
import { SipState } from './janus/sip/sipState';

class JanusService {
  private janus: any = null;
  private sipPlugin: any = null;
  private eventHandlers: JanusEventHandlers;
  private opaqueId: string;
  private registered: boolean = false;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private trackListeners: Map<string, () => void> = new Map();
  private pcListeners: Map<string, any> = new Map();
  private receivedTracks: MediaStreamTrack[] = [];
  private sipState: SipState;
  private sipCallManager: SipCallManager;

  constructor() {
    this.eventHandlers = new JanusEventHandlers();
    this.opaqueId = "softphone-" + Math.floor(Math.random() * 10000);
    this.sipState = new SipState();
    this.sipCallManager = new SipCallManager(this.sipState);
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
          this.sipState.setSipPlugin(pluginHandle);
          console.log("SIP plugin attached:", pluginHandle);
          
          // Ensure SipCallManager audio handler is set up
          this.sipCallManager.ensureAudioHandlerReady();
          
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
          this.localStream = stream;
          
          // Ensure all local audio tracks are enabled
          stream.getAudioTracks().forEach(track => {
            console.log("Local audio track:", track.label, "enabled:", track.enabled);
            track.enabled = true;
          });
        },
        onremotestream: (stream: MediaStream) => {
          // COMPLETELY DISABLED - audio handled by SipCallManager only
          console.log("⚠️ DISABLED onremotestream - SipCallManager handles audio");
        },
        oncleanup: () => {
          console.log("SIP plugin cleaned up");
          this.localStream = null;
          this.remoteStream = null;
        },
        // Audio track handling moved to SipCallManager
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
        this.sipState.setRegistered(true);
        this.sipState.setCurrentCredentials({
          username: result.username || "unknown",
          password: "***",
          sipHost: "unknown"
        });
        if (this.eventHandlers.onRegistrationSuccess) {
          this.eventHandlers.onRegistrationSuccess();
        }
        break;

      case "registration_failed":
        console.error("SIP Registration failed:", result.code, result.reason);
        this.registered = false;
        this.sipState.setRegistered(false);
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
      
      // Analyze SDP for audio track information
      if (jsep.sdp) {
        console.log("Analyzing SDP for audio tracks:");
        this.analyzeSDP(jsep.sdp);
      }
      
      // Call SipCallManager to handle JSEP
      console.log("🎵 Calling SipCallManager.handleRemoteJsep");
      this.sipCallManager.handleRemoteJsep(jsep);
    }
  }
  
  /**
   * Analyze SDP to find issues with audio tracks
   */
  private analyzeSDP(sdp: string): void {
    const lines = sdp.split('\r\n');
    let currentMedia: 'audio' | 'video' | null = null;
    let hasAudio = false;
    let audioDirection: string | null = null;
    
    console.log("--- SDP Analysis ---");
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for media sections
      if (line.startsWith('m=audio')) {
        currentMedia = 'audio';
        hasAudio = true;
        console.log("Found audio media section");
      } else if (line.startsWith('m=video')) {
        currentMedia = 'video';
      }
      
      // Check direction attributes in audio section
      if (currentMedia === 'audio') {
        if (line.startsWith('a=sendrecv')) {
          audioDirection = 'sendrecv';
          console.log("Audio direction: sendrecv (bidirectional)");
        } else if (line.startsWith('a=sendonly')) {
          audioDirection = 'sendonly';
          console.log("Audio direction: sendonly (remote can only receive)");
        } else if (line.startsWith('a=recvonly')) {
          audioDirection = 'recvonly';
          console.log("Audio direction: recvonly (remote can only send)");
        } else if (line.startsWith('a=inactive')) {
          audioDirection = 'inactive';
          console.log("Audio direction: inactive (no audio flowing)");
        }
      }
    }
    
    if (!hasAudio) {
      console.warn("SDP does not contain audio media section!");
    } else if (!audioDirection) {
      console.warn("Audio section does not have explicit direction attribute!");
    }
    
    console.log("--- End SDP Analysis ---");
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
  
  // Delegate call to SipCallManager with enhanced error handling
  async call(destination: string, isVideoCall: boolean = false, audioOptions?: AudioCallOptions): Promise<void> {
    console.log("🔄 JanusService.call() delegating to SipCallManager for:", destination);
    
    if (!this.sipPlugin) {
      throw new Error("SIP plugin not attached");
    }

    if (!this.sipState.isRegistered()) {
      throw new Error("Not registered with SIP server");
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

    try {
      // Delegate to SipCallManager which handles all the WebRTC complexity
      await this.sipCallManager.call(destination, audioOptions);
      console.log("✅ SipCallManager call completed successfully");
    } catch (error: any) {
      console.error("❌ SipCallManager call failed:", error.message);
      
      // Provide user-friendly error messages
      if (error.message.includes("OverconstrainedError") || error.message.includes("deviceId")) {
        throw new Error("Audio device not available. Please check your microphone settings.");
      } else if (error.message.includes("NotAllowedError")) {
        throw new Error("Microphone access denied. Please allow microphone permissions.");
      } else if (error.message.includes("NotFoundError")) {
        throw new Error("No microphone found. Please connect a microphone.");
      } else if (error.message.includes("Not registered")) {
        throw new Error("Not connected to phone server. Please check your connection.");
      } else {
        throw new Error(`Call failed: ${error.message}`);
      }
    }
  }
  
  async acceptCall(jsep: any, audioOptions?: AudioCallOptions): Promise<void> {
    console.log("🔄 JanusService.acceptCall() delegating to SipCallManager");
    
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

    try {
      // Delegate to SipCallManager
      await this.sipCallManager.acceptCall(jsep, audioOptions);
      console.log("✅ SipCallManager acceptCall completed successfully");
    } catch (error: any) {
      console.error("❌ SipCallManager acceptCall failed:", error.message);
      
      // Provide user-friendly error messages
      if (error.message.includes("OverconstrainedError") || error.message.includes("deviceId")) {
        throw new Error("Audio device not available. Please check your microphone settings.");
      } else if (error.message.includes("NotAllowedError")) {
        throw new Error("Microphone access denied. Please allow microphone permissions.");
      } else {
        throw new Error(`Failed to accept call: ${error.message}`);
      }
    }
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
    console.log("🔄 JanusService.hangup() delegating to SipCallManager");
    
    if (!this.sipPlugin) {
      return;
    }
    
    try {
      // Delegate to SipCallManager
      await this.sipCallManager.hangup();
      console.log("✅ SipCallManager hangup completed successfully");
    } catch (error: any) {
      console.error("❌ SipCallManager hangup failed:", error.message);
      throw new Error(`Hangup failed: ${error.message}`);
    }
  }
  
  isJanusConnected(): boolean {
    return this.janus !== null;
  }
  
  isRegistered(): boolean {
    return this.registered;
  }
  
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }
  
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }
  
  getReceivedTracks(): MediaStreamTrack[] {
    return this.receivedTracks;
  }
  
  disconnect(): void {
    // Clean up PC listeners and reset state
    
    // Clean up PC event listeners
    if (this.sipPlugin?.webrtcStuff?.pc) {
      for (const [event, listener] of this.pcListeners.entries()) {
        this.sipPlugin.webrtcStuff.pc.removeEventListener(event, listener);
      }
    }
    this.pcListeners.clear();
    
    // Reset state
    this.localStream = null;
    this.remoteStream = null;
    this.registered = false;
    this.receivedTracks = [];
    
    // Detach plugin
    if (this.sipPlugin) {
      this.sipPlugin.detach({
        success: () => {
          console.log("SIP plugin detached successfully");
        },
        error: (error: any) => {
          console.error("Error detaching SIP plugin:", error);
        }
      });
      this.sipPlugin = null;
    }
    
    // Destroy Janus session
    if (this.janus) {
      this.janus.destroy({
        success: () => {
          console.log("Janus session destroyed successfully");
        },
        error: (error: any) => {
          console.error("Error destroying Janus session:", error);
        }
      });
      this.janus = null;
    }
  }

  getJanus() {
    return this.janus;
  }

  getSipPlugin() {
    return this.sipPlugin;
  }
}

const janusService = new JanusService();
export default janusService;
