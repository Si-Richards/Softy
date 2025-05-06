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
      await this.sessionManager.createSession(options);
      await this.attachSipPlugin();
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

  getLocalStream(): MediaStream | null {
    return this.mediaHandler.getLocalStream();
  }

  getRemoteStream(): MediaStream | null {
    return this.mediaHandler.getRemoteStream();
  }

  register(username: string, password: string, sipHost: string): Promise<void> {
    return this.sipHandler.register(username, password, sipHost);
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

  disconnect(): void {
    this.sipHandler.setRegistered(false);
    this.sessionManager.disconnect();
  }
}

const janusService = new JanusService();
export default janusService;
