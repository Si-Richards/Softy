import { JanusJS } from 'janus-gateway-js';

interface JanusOptions {
  server: string;
  apiSecret?: string;
  iceServers?: RTCIceServer[];
  success?: () => void;
  error?: (error: any) => void;
  destroyed?: () => void;
}

class JanusService {
  private janus: any = null;
  private videoCallPlugin: any = null;
  private opaqueId = "softphone-" + Math.floor(Math.random() * 10000);
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

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
          this.attachVideoCallPlugin()
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

  private attachVideoCallPlugin(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.janus) {
        reject(new Error("Janus not initialized"));
        return;
      }

      this.janus.attach({
        plugin: "janus.plugin.videocall",
        opaqueId: this.opaqueId,
        success: (pluginHandle: any) => {
          this.videoCallPlugin = pluginHandle;
          console.log("VideoCall plugin attached:", pluginHandle);
          resolve();
        },
        error: (error: any) => {
          const errorMsg = `Error attaching to VideoCall plugin: ${error}`;
          console.error(errorMsg);
          if (this.onError) this.onError(errorMsg);
          reject(new Error(errorMsg));
        },
        onmessage: (msg: any, jsep: any) => {
          this.handleVideoCallMessage(msg, jsep);
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
          console.log("VideoCall plugin cleaned up");
          this.localStream = null;
          this.remoteStream = null;
        }
      });
    });
  }

  private handleVideoCallMessage(msg: any, jsep: any): void {
    if (!this.videoCallPlugin) return;

    const result = msg["result"];
    if (result) {
      if (result["list"]) {
        // Handle user list
        console.log("Got a list of registered users:", result["list"]);
      } else if (result["event"]) {
        const event = result["event"];
        
        if (event === "registered") {
          console.log("Successfully registered with the server");
        } else if (event === "calling") {
          console.log("Waiting for the peer to answer");
        } else if (event === "incomingcall") {
          const username = result["username"];
          console.log("Incoming call from", username);
          if (this.onIncomingCall) this.onIncomingCall(username);
          
          // Automatically accept the call for this example
          this.acceptCall(jsep);
        } else if (event === "accepted") {
          console.log("Call accepted");
          if (jsep) {
            this.videoCallPlugin.handleRemoteJsep({ jsep });
          }
        } else if (event === "hangup") {
          console.log("Call hung up");
          if (this.onCallEnded) this.onCallEnded();
        }
      }
    }
  }

  register(username: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.videoCallPlugin) {
        const error = "VideoCall plugin not attached";
        if (this.onError) this.onError(error);
        reject(new Error(error));
        return;
      }

      this.videoCallPlugin.send({
        message: {
          request: "register",
          username: username
        },
        success: () => {
          console.log(`Registered as ${username}`);
          resolve();
        },
        error: (error: any) => {
          const errorMsg = `Error registering: ${error}`;
          if (this.onError) this.onError(errorMsg);
          reject(new Error(errorMsg));
        }
      });
    });
  }

  call(username: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.videoCallPlugin) {
        const error = "VideoCall plugin not attached";
        if (this.onError) this.onError(error);
        reject(new Error(error));
        return;
      }

      // Get media
      navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then((stream) => {
          this.videoCallPlugin.createOffer({
            media: { audioRecv: true, videoRecv: true, audioSend: true, videoSend: true },
            success: (jsep: any) => {
              const message = {
                request: "call",
                username: username
              };

              this.videoCallPlugin.send({
                message,
                jsep,
                success: () => {
                  console.log(`Calling ${username}`);
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
      if (!this.videoCallPlugin) {
        const error = "VideoCall plugin not attached";
        if (this.onError) this.onError(error);
        reject(new Error(error));
        return;
      }

      this.videoCallPlugin.createAnswer({
        jsep: jsep,
        media: { audioRecv: true, videoRecv: true, audioSend: true, videoSend: true },
        success: (ourjsep: any) => {
          const message = { request: "accept" };
          this.videoCallPlugin.send({
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
      if (!this.videoCallPlugin) {
        const error = "VideoCall plugin not attached";
        if (this.onError) this.onError(error);
        reject(new Error(error));
        return;
      }

      this.videoCallPlugin.send({
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
    if (this.videoCallPlugin) {
      this.videoCallPlugin.detach();
      this.videoCallPlugin = null;
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
