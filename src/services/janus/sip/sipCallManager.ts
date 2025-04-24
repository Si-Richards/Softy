
import { SipState } from './sipState';

export class SipCallManager {
  constructor(private sipState: SipState) {}

  async call(uri: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.sipState.getSipPlugin()) {
        reject(new Error("SIP plugin not attached"));
        return;
      }

      if (!this.sipState.isRegistered()) {
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
          this.sipState.getSipPlugin().createOffer({
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

              this.sipState.getSipPlugin().send({
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
      if (!this.sipState.getSipPlugin()) {
        reject(new Error("SIP plugin not attached"));
        return;
      }

      this.sipState.getSipPlugin().createAnswer({
        jsep: jsep,
        media: { audioRecv: true, videoRecv: true, audioSend: true, videoSend: true },
        success: (ourjsep: any) => {
          const message = { request: "accept" };
          this.sipState.getSipPlugin().send({
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
      if (!this.sipState.getSipPlugin()) {
        reject(new Error("SIP plugin not attached"));
        return;
      }

      this.sipState.getSipPlugin().send({
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
}
