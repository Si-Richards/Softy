
import { JanusJS } from 'janus-gateway-js';

interface JanusOptions {
  server: string;
  apiSecret?: string;
  iceServers?: RTCIceServer[];
  success?: () => void;
  error?: (error: any) => void;
  destroyed?: () => void;
}

interface SipCredentials {
  username: string;
  password: string;
  sipHost: string;
}

class JanusService {
  private janus: any = null;
  private sipPlugin: any = null;
  private opaqueId = "softphone-" + Math.floor(Math.random() * 10000);
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private currentCredentials: SipCredentials | null = null;
  private registered: boolean = false;

  // Event callbacks
  private onIncomingCall: ((from: string) => void) | null = null;
  private onCallConnected: (() => void) | null = null;
  private onCallEnded: (() => void) | null = null;
  private onError: ((error: string) => void) | null = null;
  
  async initialize(options: JanusOptions): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (!options.server) {
        const errorMsg = "No Janus server URL provided";
        if (options.error) options.error(errorMsg);
        if (this.onError) this.onError(errorMsg);
        reject(new Error(errorMsg));
        return;
      }

      // Cleanup any existing session before initializing a new one
      if (this.janus) {
        this.disconnect();
      }

      // Initialize Janus
      JanusJS.init({
        debug: true,
        callback: () => {
          this.createSession(options)
            .then(() => resolve(true))
            .catch(error => {
              if (options.error) options.error(error);
              if (this.onError) this.onError(error);
              reject(error);
            });
        }
      });
    });
  }

  private createSession(options: JanusOptions): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.janus = new JanusJS.Janus({
        server: options.server,
        apisecret: options.apiSecret,
        iceServers: options.iceServers || [
          { urls: 'stun:stun.l.google.com:19302' }
        ],
        success: () => {
          this.attachSipPlugin()
            .then(() => {
              if (options.success) options.success();
              resolve();
            })
            .catch(error => reject(error));
        },
        error: (error) => {
          const errorMsg = `Error creating Janus session: ${error}`;
          if (options.error) options.error(errorMsg);
          if (this.onError) this.onError(errorMsg);
          reject(new Error(errorMsg));
        },
        destroyed: () => {
          if (options.destroyed) options.destroyed();
        }
      });
    });
  }

  private attachSipPlugin(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.janus) {
        reject(new Error("Janus not initialized"));
        return;
      }

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
          if (this.onError) this.onError(errorMsg);
          reject(new Error(errorMsg));
        },
        onmessage: (msg: any, jsep: any) => {
          this.handleSipMessage(msg, jsep);
        },
        onlocalstream: (stream: MediaStream) => {
          console.log("Got local stream", stream);
          this.localStream = stream;
        },
        onremotestream: (stream: MediaStream) => {
          console.log("Got remote stream", stream);
          this.remoteStream = stream;
          if (this.onCallConnected) this.onCallConnected();
        },
        oncleanup: () => {
          console.log("SIP plugin cleaned up");
          this.localStream = null;
          this.remoteStream = null;
        }
      });
    });
  }

  private handleSipMessage(msg: any, jsep: any): void {
    if (!this.sipPlugin) return;

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
          if (this.onError) this.onError(`SIP registration failed: ${result["code"] || "Unknown error"}`);
        } else if (event === "calling") {
          console.log("Calling...");
        } else if (event === "incomingcall") {
          const username = result["username"] || "Unknown caller";
          console.log("Incoming call from", username);
          if (this.onIncomingCall) this.onIncomingCall(username);
          
          // Automatically accept the call
          if (jsep) {
            this.acceptCall(jsep);
          }
        } else if (event === "accepted") {
          console.log("Call accepted");
          if (jsep) {
            this.sipPlugin.handleRemoteJsep({ jsep });
          }
        } else if (event === "hangup") {
          console.log("Call hung up");
          if (this.onCallEnded) this.onCallEnded();
        }
      }
    }

    // Handle errors
    const error = msg["error"];
    if (error) {
      console.error("SIP error:", error);
      if (this.onError) this.onError(`SIP error: ${error}`);
    }

    // Handle jsep
    if (jsep) {
      console.log("Handling SIP jsep", jsep);
      this.sipPlugin.handleRemoteJsep({ jsep });
    }
  }

  register(username: string, password: string, sipHost: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.sipPlugin) {
        const error = "SIP plugin not attached";
        if (this.onError) this.onError(error);
        reject(new Error(error));
        return;
      }

      // Format SIP URI
      const sipUri = `sip:${username}@${sipHost}`;
      
      // Store credentials for potential reconnection
      this.currentCredentials = { username, password, sipHost };

      // Register with the SIP server
      this.sipPlugin.send({
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
          if (this.onError) this.onError(errorMsg);
          reject(new Error(errorMsg));
        }
      });
    });
  }

  call(uri: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.sipPlugin) {
        const error = "SIP plugin not attached";
        if (this.onError) this.onError(error);
        reject(new Error(error));
        return;
      }

      if (!this.registered) {
        const error = "Not registered with SIP server";
        if (this.onError) this.onError(error);
        reject(new Error(error));
        return;
      }

      // Get media
      navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then((stream) => {
          this.sipPlugin.createOffer({
            media: { audioRecv: true, videoRecv: true, audioSend: true, videoSend: true },
            success: (jsep: any) => {
              const message = {
                request: "call",
                uri: uri
              };

              this.sipPlugin.send({
                message,
                jsep,
                success: () => {
                  console.log(`Calling ${uri}`);
                  resolve();
                },
                error: (error: any) => {
                  const errorMsg = `Error calling: ${error}`;
                  if (this.onError) this.onError(errorMsg);
                  reject(new Error(errorMsg));
                }
              });
            },
            error: (error: any) => {
              const errorMsg = `WebRTC error: ${error}`;
              if (this.onError) this.onError(errorMsg);
              reject(new Error(errorMsg));
            }
          });
        })
        .catch((error) => {
          const errorMsg = `Media error: ${error}`;
          if (this.onError) this.onError(errorMsg);
          reject(new Error(errorMsg));
        });
    });
  }

  acceptCall(jsep: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.sipPlugin) {
        const error = "SIP plugin not attached";
        if (this.onError) this.onError(error);
        reject(new Error(error));
        return;
      }

      this.sipPlugin.createAnswer({
        jsep: jsep,
        media: { audioRecv: true, videoRecv: true, audioSend: true, videoSend: true },
        success: (ourjsep: any) => {
          const message = { request: "accept" };
          this.sipPlugin.send({
            message,
            jsep: ourjsep,
            success: () => {
              console.log("Call accepted");
              resolve();
            },
            error: (error: any) => {
              const errorMsg = `Error accepting call: ${error}`;
              if (this.onError) this.onError(errorMsg);
              reject(new Error(errorMsg));
            }
          });
        },
        error: (error: any) => {
          const errorMsg = `WebRTC error: ${error}`;
          if (this.onError) this.onError(errorMsg);
          reject(new Error(errorMsg));
        }
      });
    });
  }

  hangup(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.sipPlugin) {
        const error = "SIP plugin not attached";
        if (this.onError) this.onError(error);
        reject(new Error(error));
        return;
      }

      this.sipPlugin.send({
        message: { request: "hangup" },
        success: () => {
          console.log("Call hung up");
          resolve();
        },
        error: (error: any) => {
          const errorMsg = `Error hanging up: ${error}`;
          if (this.onError) this.onError(errorMsg);
          reject(new Error(errorMsg));
        }
      });
    });
  }

  isRegistered(): boolean {
    return this.registered;
  }

  setOnIncomingCall(callback: (from: string) => void): void {
    this.onIncomingCall = callback;
  }

  setOnCallConnected(callback: () => void): void {
    this.onCallConnected = callback;
  }

  setOnCallEnded(callback: () => void): void {
    this.onCallEnded = callback;
  }

  setOnError(callback: (error: string) => void): void {
    this.onError = callback;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
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

// Create a singleton instance
const janusService = new JanusService();
export default janusService;
