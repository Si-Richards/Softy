
import { JanusEventHandlers } from './janus/eventHandlers';
import { JanusSessionManager } from './janus/sessionManager';
import { JanusMediaHandler } from './janus/mediaHandler';
import { JanusSipHandler } from './janus/sipHandler';
import type { JanusOptions, SipCredentials } from './janus/types';

class JanusService {
  private sessionManager: JanusSessionManager;
  private eventHandlers: JanusEventHandlers;
  private mediaHandler: JanusMediaHandler;
  private sipHandler: JanusSipHandler;
  private connectionCheckTimer: number | null = null;
  private registrationTimeout: number | null = null;

  constructor() {
    this.sessionManager = new JanusSessionManager();
    this.eventHandlers = new JanusEventHandlers();
    this.mediaHandler = new JanusMediaHandler();
    this.sipHandler = new JanusSipHandler();
    
    // Add registration success handler
    this.eventHandlers.setOnRegistrationSuccess(() => {
      console.log("🎉 SIP Registration success received from Janus");
      if (this.registrationTimeout) {
        clearTimeout(this.registrationTimeout);
        this.registrationTimeout = null;
      }
    });
  }

  async initialize(options: JanusOptions): Promise<boolean> {
    if (!options.server) {
      const errorMsg = "No Janus server URL provided";
      if (options.error) options.error(errorMsg);
      if (this.eventHandlers.onError) this.eventHandlers.onError(errorMsg);
      throw new Error(errorMsg);
    }

    // Cleanup any existing session
    if (this.sessionManager.getJanus()) {
      this.disconnect();
    }

    try {
      // Pass all options including debug setting to session manager
      await this.sessionManager.createSession(options);
      await this.attachSipPlugin();
      
      // Start a connection health check
      this.startConnectionCheck();
      
      if (options.success) options.success();
      return true;
    } catch (error: any) {
      const errorMsg = `Failed to initialize Janus: ${error.message || error}`;
      if (options.error) options.error(errorMsg);
      if (this.eventHandlers.onError) this.eventHandlers.onError(errorMsg);
      this.disconnect(); // Cleanup on failure
      throw new Error(errorMsg);
    }
  }

  private startConnectionCheck() {
    // Clear any existing timer
    if (this.connectionCheckTimer) {
      window.clearInterval(this.connectionCheckTimer);
    }
    
    // Check connection state periodically (every 30 seconds)
    this.connectionCheckTimer = window.setInterval(() => {
      const janus = this.sessionManager.getJanus();
      if (!janus) {
        console.log("Connection check: Janus instance not found, reconnecting...");
        // Could attempt a reconnection here if needed
      } else {
        console.log("Connection check: Janus instance exists");
      }
    }, 30000);
  }

  private async attachSipPlugin(): Promise<void> {
    const janus = this.sessionManager.getJanus();
    if (!janus) {
      throw new Error("Janus not initialized");
    }

    return new Promise<void>((resolve, reject) => {
      janus.attach({
        plugin: "janus.plugin.sip",
        opaqueId: this.sessionManager.getOpaqueId(),
        success: (pluginHandle: any) => {
          this.sipHandler.setSipPlugin(pluginHandle);
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
          console.log("Received SIP message:", msg, "with jsep:", jsep);
          this.sipHandler.handleSipMessage(msg, jsep, this.eventHandlers);
        },
        onlocalstream: (stream: MediaStream) => {
          console.log("Got local stream", stream);
          this.mediaHandler.setLocalStream(stream);
        },
        onremotestream: (stream: MediaStream) => {
          console.log("Got remote stream", stream);
          this.mediaHandler.setRemoteStream(stream);
          if (this.eventHandlers.onCallConnected) this.eventHandlers.onCallConnected();
        },
        oncleanup: () => {
          console.log("SIP plugin cleaned up");
          this.mediaHandler.clearStreams();
        }
      });
    });
  }

  setOnIncomingCall(callback: (from: string, jsep: any) => void): void {
    this.eventHandlers.setOnIncomingCall(callback);
  }

  setOnCallConnected(callback: () => void): void {
    this.eventHandlers.setOnCallConnected(callback);
  }

  setOnCallEnded(callback: () => void): void {
    this.eventHandlers.setOnCallEnded(callback);
  }

  setOnError(callback: (error: string) => void): void {
    this.eventHandlers.setOnError(callback);
  }
  
  setOnRegistrationSuccess(callback: () => void): void {
    console.log("Setting registration success callback");
    this.eventHandlers.setOnRegistrationSuccess(callback);
  }

  getLocalStream(): MediaStream | null {
    return this.mediaHandler.getLocalStream();
  }

  getRemoteStream(): MediaStream | null {
    return this.mediaHandler.getRemoteStream();
  }

  async register(username: string, password: string, sipHost: string): Promise<void> {
    try {
      // Log registration attempt
      console.log(`🔄 Attempting SIP registration for ${username} at ${sipHost}`);
      
      // Clear any previous timeout
      if (this.registrationTimeout) {
        clearTimeout(this.registrationTimeout);
      }
      
      // Set a timeout to detect registration failure
      this.registrationTimeout = window.setTimeout(() => {
        if (!this.isRegistered()) {
          console.warn("⚠️ Registration timed out after 30 seconds");
          if (this.eventHandlers.onError) {
            this.eventHandlers.onError("Registration request timed out. The SIP server did not respond in time.");
          }
        }
      }, 30000); // Extend timeout to 30 seconds
      
      await this.sipHandler.register(username, password, sipHost);
      console.log(`📤 Successfully sent registration request to SIP server as ${username}@${sipHost}`);
      return Promise.resolve();
    } catch (error) {
      console.error("❌ SIP registration error:", error);
      if (this.eventHandlers.onError) {
        this.eventHandlers.onError(`Registration failed: ${error}`);
      }
      return Promise.reject(error);
    }
  }

  call(uri: string, isVideoCall: boolean = false): Promise<void> {
    return this.sipHandler.call(uri, isVideoCall);
  }

  acceptCall(jsep: any): Promise<void> {
    return this.sipHandler.acceptCall(jsep);
  }

  hangup(): Promise<void> {
    return this.sipHandler.hangup();
  }

  isRegistered(): boolean {
    return this.sipHandler.isRegistered();
  }

  // Method to check if Janus is connected
  isJanusConnected(): boolean {
    return this.sessionManager.getConnectionState() === 'connected';
  }

  disconnect(): void {
    // Clear the connection check timer
    if (this.connectionCheckTimer) {
      window.clearInterval(this.connectionCheckTimer);
      this.connectionCheckTimer = null;
    }
    
    // Clear any registration timeout
    if (this.registrationTimeout) {
      window.clearTimeout(this.registrationTimeout);
      this.registrationTimeout = null;
    }
    
    this.sipHandler.setRegistered(false);
    this.sessionManager.disconnect();
  }
}

const janusService = new JanusService();
export default janusService;
