
import type { SipCredentials } from './types';

export class JanusSipHandler {
  private sipPlugin: any = null;
  private registered: boolean = false;
  private currentCredentials: SipCredentials | null = null;

  setSipPlugin(plugin: any) {
    this.sipPlugin = plugin;
  }

  getSipPlugin() {
    return this.sipPlugin;
  }

  isRegistered(): boolean {
    return this.registered;
  }

  setRegistered(status: boolean) {
    this.registered = status;
  }

  getCurrentCredentials(): SipCredentials | null {
    return this.currentCredentials;
  }

  async register(username: string, password: string, sipHost: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.sipPlugin) {
        reject(new Error("SIP plugin not attached"));
        return;
      }

      const sipUri = `sip:${username}@${sipHost}`;
      this.currentCredentials = { username, password, sipHost };

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
          reject(new Error(errorMsg));
        }
      });
    });
  }

  async call(uri: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.sipPlugin) {
        reject(new Error("SIP plugin not attached"));
        return;
      }

      if (!this.registered) {
        reject(new Error("Not registered with SIP server"));
        return;
      }

      const audioInput = localStorage.getItem('selectedAudioInput');
      const videoInput = localStorage.getItem('selectedVideoInput');

      const constraints: MediaStreamConstraints = {
        audio: audioInput ? { deviceId: { exact: audioInput } } : true,
        video: videoInput ? { deviceId: { exact: videoInput } } : false
      };

      navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          this.sipPlugin.createOffer({
            media: { 
              audioRecv: true, 
              videoRecv: true, 
              audioSend: true, 
              videoSend: !!videoInput,
              removeAudio: false,
              removeVideo: !videoInput
            },
            stream: stream,
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
                  reject(new Error(`Error calling: ${error}`));
                }
              });
            },
            error: (error: any) => {
              reject(new Error(`WebRTC error: ${error}`));
            }
          });
        })
        .catch((error) => {
          reject(new Error(`Media error: ${error}`));
        });
    });
  }

  async acceptCall(jsep: any): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.sipPlugin) {
        reject(new Error("SIP plugin not attached"));
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
              reject(new Error(`Error accepting call: ${error}`));
            }
          });
        },
        error: (error: any) => {
          reject(new Error(`WebRTC error: ${error}`));
        }
      });
    });
  }

  async hangup(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.sipPlugin) {
        reject(new Error("SIP plugin not attached"));
        return;
      }

      this.sipPlugin.send({
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

  handleSipMessage(msg: any, jsep: any, eventHandlers: any): void {
    if (!this.sipPlugin) return;

    const result = msg["result"];
    if (result) {
      if (result["event"]) {
        const event = result["event"];
        
        switch (event) {
          case "registered":
            console.log("Successfully registered with the SIP server");
            this.registered = true;
            break;
          case "registering":
            console.log("Registering with the SIP server");
            break;
          case "registration_failed":
            console.log("Registration failed:", result);
            this.registered = false;
            if (eventHandlers.onError) {
              eventHandlers.onError(`SIP registration failed: ${result["code"] || "Unknown error"}`);
            }
            break;
          case "calling":
            console.log("Calling...");
            break;
          case "incomingcall": {
            const username = result["username"] || "Unknown caller";
            console.log("Incoming call from", username);
            if (eventHandlers.onIncomingCall) {
              eventHandlers.onIncomingCall(username);
            }
            if (jsep) {
              this.acceptCall(jsep);
            }
            break;
          }
          case "accepted":
            console.log("Call accepted");
            if (jsep) {
              this.sipPlugin.handleRemoteJsep({ jsep });
            }
            break;
          case "hangup":
            console.log("Call hung up");
            if (eventHandlers.onCallEnded) {
              eventHandlers.onCallEnded();
            }
            break;
        }
      }
    }

    if (msg["error"]) {
      console.error("SIP error:", msg["error"]);
      if (eventHandlers.onError) {
        eventHandlers.onError(`SIP error: ${msg["error"]}`);
      }
    }

    if (jsep) {
      console.log("Handling SIP jsep", jsep);
      this.sipPlugin.handleRemoteJsep({ jsep });
    }
  }

