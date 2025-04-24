import { JanusJS } from 'janus-gateway-js';
import { JanusEventHandlers } from './janus/eventHandlers';
import { JanusSessionManager } from './janus/sessionManager';
import { JanusMediaHandler } from './janus/mediaHandler';
import type { JanusOptions, SipCredentials } from './janus/types';

class JanusService {
  private sessionManager: JanusSessionManager;
  private eventHandlers: JanusEventHandlers;
  private mediaHandler: JanusMediaHandler;
  private currentCredentials: SipCredentials | null = null;
  private registered: boolean = false;

  constructor() {
    this.sessionManager = new JanusSessionManager();
    this.eventHandlers = new JanusEventHandlers();
    this.mediaHandler = new JanusMediaHandler();
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

      // Cleanup any existing session before initializing a new one
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
          this.sessionManager.setSipPlugin(pluginHandle);
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
          this.handleSipMessage(msg, jsep);
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

  private handleSipMessage(msg: any, jsep: any): void {
    const sipPlugin = this.sessionManager.getSipPlugin();
    if (!sipPlugin) return;

    const result = msg["result"];
    if (result) {
      if (result["event"]) {
        const event = result["event"];
        
        if (event === "registered") {
          console.log("Successfully registered with the SIP server");
          this.registered = true;
        } else if (event === "registering") {
          console.log("Registering with the SIP server");
        } else if (event === "registration_failed") {
          console.log("Registration failed:", result);
          this.registered = false;
          if (this.eventHandlers.onError) this.eventHandlers.onError(`SIP registration failed: ${result["code"] || "Unknown error"}`);
        } else if (event === "calling") {
          console.log("Calling...");
        } else if (event === "incomingcall") {
          const username = result["username"] || "Unknown caller";
          console.log("Incoming call from", username);
          if (this.eventHandlers.onIncomingCall) this.eventHandlers.onIncomingCall(username);
          
          if (jsep) {
            this.acceptCall(jsep);
          }
        } else if (event === "accepted") {
          console.log("Call accepted");
          if (jsep) {
            sipPlugin.handleRemoteJsep({ jsep });
          }
        } else if (event === "hangup") {
          console.log("Call hung up");
          if (this.eventHandlers.onCallEnded) this.eventHandlers.onCallEnded();
        }
      }
    }

    const error = msg["error"];
    if (error) {
      console.error("SIP error:", error);
      if (this.eventHandlers.onError) this.eventHandlers.onError(`SIP error: ${error}`);
    }

    if (jsep) {
      console.log("Handling SIP jsep", jsep);
      sipPlugin.handleRemoteJsep({ jsep });
    }
  }

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

  getLocalStream(): MediaStream | null {
    return this.mediaHandler.getLocalStream();
  }

  getRemoteStream(): MediaStream | null {
    return this.mediaHandler.getRemoteStream();
  }

  register(username: string, password: string, sipHost: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const sipPlugin = this.sessionManager.getSipPlugin();
      if (!sipPlugin) {
        const error = "SIP plugin not attached";
        if (this.eventHandlers.onError) this.eventHandlers.onError(error);
        reject(new Error(error));
        return;
      }

      const sipUri = `sip:${username}@${sipHost}`;
      this.currentCredentials = { username, password, sipHost };

      sipPlugin.send({
        message: {
          request: "register",
          username: sipUri,
          display_name: username,
          authuser: username,
          secret: password,
          proxy: `sip:${sipHost}`
        },
        success: () => {
          console.log(`SIP registration request sent for ${username}@${sipHost}`);
          resolve();
        },
        error: (error: any) => {
          const errorMsg = `Error sending SIP registration: ${error}`;
          this.registered = false;
          if (this.eventHandlers.onError) this.eventHandlers.onError(errorMsg);
          reject(new Error(errorMsg));
        }
      });
    });
  }

  call(uri: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const sipPlugin = this.sessionManager.getSipPlugin();
      if (!sipPlugin) {
        const error = "SIP plugin not attached";
        if (this.eventHandlers.onError) this.eventHandlers.onError(error);
        reject(new Error(error));
        return;
      }

      if (!this.registered) {
        const error = "Not registered with SIP server";
        if (this.eventHandlers.onError) this.eventHandlers.onError(error);
        reject(new Error(error));
        return;
      }

      navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then((stream) => {
          sipPlugin.createOffer({
            media: { audioRecv: true, videoRecv: true, audioSend: true, videoSend: true },
            success: (jsep: any) => {
              const message = {
                request: "call",
                uri: uri
              };

              sipPlugin.send({
                message,
                jsep,
                success: () => {
                  console.log(`Calling ${uri}`);
                  resolve();
                },
                error: (error: any) => {
                  const errorMsg = `Error calling: ${error}`;
                  if (this.eventHandlers.onError) this.eventHandlers.onError(errorMsg);
                  reject(new Error(errorMsg));
                }
              });
            },
            error: (error: any) => {
              const errorMsg = `WebRTC error: ${error}`;
              if (this.eventHandlers.onError) this.eventHandlers.onError(errorMsg);
              reject(new Error(errorMsg));
            }
          });
        })
        .catch((error) => {
          const errorMsg = `Media error: ${error}`;
          if (this.eventHandlers.onError) this.eventHandlers.onError(errorMsg);
          reject(new Error(errorMsg));
        });
    });
  }

  acceptCall(jsep: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const sipPlugin = this.sessionManager.getSipPlugin();
      if (!sipPlugin) {
        const error = "SIP plugin not attached";
        if (this.eventHandlers.onError) this.eventHandlers.onError(error);
        reject(new Error(error));
        return;
      }

      sipPlugin.createAnswer({
        jsep: jsep,
        media: { audioRecv: true, videoRecv: true, audioSend: true, videoSend: true },
        success: (ourjsep: any) => {
          const message = { request: "accept" };
          sipPlugin.send({
            message,
            jsep: ourjsep,
            success: () => {
              console.log("Call accepted");
              resolve();
            },
            error: (error: any) => {
              const errorMsg = `Error accepting call: ${error}`;
              if (this.eventHandlers.onError) this.eventHandlers.onError(errorMsg);
              reject(new Error(errorMsg));
            }
          });
        },
        error: (error: any) => {
          const errorMsg = `WebRTC error: ${error}`;
          if (this.eventHandlers.onError) this.eventHandlers.onError(errorMsg);
          reject(new Error(errorMsg));
        }
      });
    });
  }

  hangup(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const sipPlugin = this.sessionManager.getSipPlugin();
      if (!sipPlugin) {
        const error = "SIP plugin not attached";
        if (this.eventHandlers.onError) this.eventHandlers.onError(error);
        reject(new Error(error));
        return;
      }

      sipPlugin.send({
        message: { request: "hangup" },
        success: () => {
          console.log("Call hung up");
          resolve();
        },
        error: (error: any) => {
          const errorMsg = `Error hanging up: ${error}`;
          if (this.eventHandlers.onError) this.eventHandlers.onError(errorMsg);
          reject(new Error(errorMsg));
        }
      });
    });
  }

  isRegistered(): boolean {
    return this.registered;
  }

  disconnect(): void {
    this.registered = false;
    this.sessionManager.disconnect();
  }
}

// Create a singleton instance
const janusService = new JanusService();
export default janusService;
