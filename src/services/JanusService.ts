
import { JanusJS } from 'janus-gateway-js';
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

  constructor() {
    this.sessionManager = new JanusSessionManager();
    this.eventHandlers = new JanusEventHandlers();
    this.mediaHandler = new JanusMediaHandler();
    this.sipHandler = new JanusSipHandler();
  }

  async initialize(options: JanusOptions): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (!options.server) {
        const errorMsg = "No Janus server URL provided";
        if (options.error) options.error(errorMsg);
        if (this.eventHandlers.onError) this.eventHandlers.onError(errorMsg);
        reject(new Error(errorMsg));
        return;
      }

      // Cleanup any existing session
      if (this.sessionManager.getJanus()) {
        this.disconnect();
      }

      // Initialize Janus
      JanusJS.init({
        debug: true,
        callback: () => {
          this.sessionManager.createSession(options)
            .then(() => this.attachSipPlugin())
            .then(() => resolve(true))
            .catch(error => {
              if (options.error) options.error(error);
              if (this.eventHandlers.onError) this.eventHandlers.onError(error);
              reject(error);
            });
        }
      });
    });
  }

  private attachSipPlugin(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.sessionManager.getJanus()) {
        reject(new Error("Janus not initialized"));
        return;
      }

      this.sessionManager.getJanus().attach({
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

  // Event handler setters
  setOnIncomingCall(callback: (from: string) => void): void {
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

  // Stream getters
  getLocalStream(): MediaStream | null {
    return this.mediaHandler.getLocalStream();
  }

  getRemoteStream(): MediaStream | null {
    return this.mediaHandler.getRemoteStream();
  }

  // SIP operations
  register(username: string, password: string, sipHost: string): Promise<void> {
    return this.sipHandler.register(username, password, sipHost);
  }

  call(uri: string): Promise<void> {
    return this.sipHandler.call(uri);
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

  disconnect(): void {
    this.sipHandler.setRegistered(false);
    this.sessionManager.disconnect();
  }
}

// Create a singleton instance
const janusService = new JanusService();
export default janusService;
