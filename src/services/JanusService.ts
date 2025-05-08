
import { JanusEventHandlers } from './janus/eventHandlers';
import type { JanusOptions, SipCredentials } from './janus/types';

class JanusService {
  private janus: any = null;
  private sipPlugin: any = null;
  private eventHandlers: JanusEventHandlers;
  private opaqueId: string;
  private registered: boolean = false;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  constructor() {
    this.eventHandlers = new JanusEventHandlers();
    this.opaqueId = "softphone-" + Math.floor(Math.random() * 10000);
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
          this.localStream = stream;
        },
        onremotestream: (stream: MediaStream) => {
          console.log("Got remote stream", stream);
          this.remoteStream = stream;
        },
        oncleanup: () => {
          console.log("SIP plugin cleaned up");
          this.localStream = null;
          this.remoteStream = null;
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
  
  setOnIncomingCall(callback: (from: string, jsep: any) => void): void {
    this.onIncomingCallCallback = callback;
  }
  
  setOnCallConnected(callback: () => void): void {
    this.onCallConnectedCallback = callback;
  }
  
  setOnCallEnded(callback: () => void): void {
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

      // Registration request - FIXED: Set ha1_secret explicitly to "false" as string
      const request = {
        request: "register",
        username: identity,
        display_name: user,
        secret: password,
        proxy: proxy,
        // Additional options - IMPORTANT: ha1_secret must be "false" as string
        ha1_secret: "false",
        authuser: null,
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
  
  // Call methods
  async call(destination: string, isVideoCall: boolean = false): Promise<void> {
    if (!this.sipPlugin) {
      throw new Error("SIP plugin not attached");
    }
    
    const callRequest = {
      request: "call",
      uri: destination.indexOf("sip:") === 0 ? destination : `sip:${destination}`,
      video: isVideoCall
    };
    
    return new Promise<void>((resolve, reject) => {
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
    });
  }
  
  async acceptCall(jsep: any): Promise<void> {
    if (!this.sipPlugin) {
      throw new Error("SIP plugin not attached");
    }
    
    return new Promise<void>((resolve, reject) => {
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
    return this.localStream;
  }
  
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  isRegistered(): boolean {
    return this.registered;
  }

  isJanusConnected(): boolean {
    return !!this.janus;
  }

  disconnect(): void {
    this.registered = false;
    
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
