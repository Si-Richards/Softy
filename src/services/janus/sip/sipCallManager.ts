
import { SipState } from './sipState';
import { MediaConfigHandler } from '../mediaConfig';
import { formatE164Number } from '../utils/phoneNumberUtils';

export class SipCallManager {
  private mediaConfig: MediaConfigHandler;

  constructor(private sipState: SipState) {
    this.mediaConfig = new MediaConfigHandler();
  }

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

      // Format the number properly in E.164 format with SIP URI
      const formattedUri = formatE164Number(uri, this.sipState.getCurrentCredentials()?.sipHost);

      const videoInput = localStorage.getItem('selectedVideoInput');
      const constraints = this.mediaConfig.getCallMediaConstraints();

      console.log("Getting user media with constraints:", JSON.stringify(constraints));
      
      navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          console.log("Got local media stream:", stream);
          console.log("Audio tracks:", stream.getAudioTracks().length);
          console.log("Video tracks:", stream.getVideoTracks().length);
          
          // Ensure audio tracks are enabled
          stream.getAudioTracks().forEach(track => {
            console.log("Audio track enabled:", track.enabled, "kind:", track.kind);
            track.enabled = true;
          });

          this.sipState.getSipPlugin().createOffer({
            media: this.mediaConfig.getCallMediaConfig(videoInput),
            stream: stream,
            success: (jsep: any) => {
              console.log("SDP offer created:", jsep);
              
              const message = {
                request: "call",
                uri: formattedUri
              };

              this.sipState.getSipPlugin().send({
                message,
                jsep,
                success: () => {
                  console.log(`Calling ${formattedUri}`);
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

      // Get media constraints for answering calls
      const constraints = this.mediaConfig.getCallMediaConstraints();
      
      console.log("Accepting call with constraints:", JSON.stringify(constraints));
      
      navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          console.log("Got local media stream for accepting call:", stream);
          
          // Ensure audio tracks are enabled
          stream.getAudioTracks().forEach(track => {
            console.log("Audio track enabled for accepting call:", track.enabled, "kind:", track.kind);
            track.enabled = true;
          });
          
          this.sipState.getSipPlugin().createAnswer({
            jsep: jsep,
            media: this.mediaConfig.getAnswerMediaConfig(),
            stream: stream,
            success: (ourjsep: any) => {
              console.log("SDP answer created:", ourjsep);
              
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
        })
        .catch((error) => {
          reject(new Error(`Media error when accepting call: ${error}`));
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
