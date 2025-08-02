/**
 * Improved Janus Service based on official Janus SIP demo patterns
 * Consolidates audio handling and fixes session/registration lifecycle
 */

import { JanusEventHandlers } from './janus/eventHandlers';
import type { JanusOptions, SipCredentials } from './janus/types';
import type { AudioCallOptions } from './janus/sip/types';
import { ImprovedSessionManager } from './janus/improvedSessionManager';
import { unifiedAudioManager } from './janus/unifiedAudioManager';
import { ImprovedSipRegistration } from './janus/improvedSipRegistration';

class ImprovedJanusService {
  private sessionManager: ImprovedSessionManager;
  private eventHandlers: JanusEventHandlers;
  private sipRegistration: ImprovedSipRegistration | null = null;
  private opaqueId: string;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  constructor() {
    this.sessionManager = new ImprovedSessionManager();
    this.eventHandlers = new JanusEventHandlers();
    this.opaqueId = "softphone-" + Math.floor(Math.random() * 10000);
    
    // Initialize unified audio manager
    unifiedAudioManager.initialize();
  }

  async initialize(options: JanusOptions): Promise<boolean> {
    if (!options.server) {
      const errorMsg = "No Janus server URL provided";
      if (options.error) options.error(errorMsg);
      if (this.eventHandlers.onError) this.eventHandlers.onError(errorMsg);
      throw new Error(errorMsg);
    }

    // Cleanup any existing session
    await this.disconnect();

    try {
      await this.sessionManager.createSession(options);
      const sipPlugin = await this.sessionManager.attachSipPlugin();
      
      // Configure SIP plugin with event handlers
      this.configureSipPlugin(sipPlugin);
      
      // Initialize SIP registration manager
      this.sipRegistration = new ImprovedSipRegistration(sipPlugin);
      
      if (options.success) options.success();
      return true;
    } catch (error: any) {
      const errorMsg = `Failed to initialize Janus: ${error.message || error}`;
      if (options.error) options.error(errorMsg);
      if (this.eventHandlers.onError) this.eventHandlers.onError(errorMsg);
      await this.disconnect();
      throw new Error(errorMsg);
    }
  }

  private configureSipPlugin(sipPlugin: any): void {
    // Configure the SIP plugin with proper event handlers following demo patterns
    sipPlugin.onmessage = (msg: any, jsep: any) => {
      console.log("📨 SIP message received:", msg);
      this.handleSipMessage(msg, jsep);
    };

    sipPlugin.onlocalstream = (stream: MediaStream) => {
      console.log("📹 Local stream received:", stream);
      this.localStream = stream;
      
      // Ensure local audio tracks are enabled
      stream.getAudioTracks().forEach(track => {
        console.log("🎤 Local audio track:", track.label, "enabled:", track.enabled);
        track.enabled = true;
      });
    };

    sipPlugin.onremotestream = (stream: MediaStream) => {
      console.log("📡 Remote stream received:", stream);
      this.remoteStream = stream;
      
      // Use unified audio manager for consistent handling
      unifiedAudioManager.setRemoteStream(stream);
    };

    sipPlugin.oncleanup = () => {
      console.log("🧹 SIP plugin cleanup");
      unifiedAudioManager.cleanup();
      this.localStream = null;
      this.remoteStream = null;
    };

    // Store the configured plugin
    this.sessionManager.setSipPlugin(sipPlugin);
  }

  private handleSipMessage(msg: any, jsep?: any): void {
    if (msg.error) {
      console.error("❌ SIP Error:", msg.error);
      if (this.eventHandlers.onError) {
        this.eventHandlers.onError(`SIP Error: ${msg.error}`);
      }
      return;
    }

    if (!msg.result) return;

    const result = msg.result;
    const event = result.event;

    console.log(`📋 SIP Event: ${event}`, result);

    switch (event) {
      case "registered":
        console.log("✅ SIP Registration successful");
        if (this.sipRegistration) {
          this.sipRegistration.handleRegistrationSuccess();
        }
        if (this.eventHandlers.onRegistrationSuccess) {
          this.eventHandlers.onRegistrationSuccess();
        }
        break;

      case "registration_failed":
        console.error("❌ SIP Registration failed:", result.code, result.reason);
        if (this.sipRegistration) {
          this.sipRegistration.handleRegistrationFailed(
            `Registration failed: ${result.code} - ${result.reason}`
          );
        }
        if (this.eventHandlers.onRegistrationFailed) {
          this.eventHandlers.onRegistrationFailed(
            `Registration failed: ${result.code} - ${result.reason}`
          );
        }
        break;
        
      case "unregistered":
        console.log("✅ SIP Unregistration successful");
        if (this.sipRegistration) {
          this.sipRegistration.handleUnregistrationSuccess();
        }
        break;
        
      case "incomingcall":
        console.log("📞 Incoming call from:", result.username);
        if (this.onIncomingCallCallback) {
          this.onIncomingCallCallback(result.username, jsep);
        }
        break;
        
      case "accepted":
        console.log("✅ Call accepted");
        if (this.onCallConnectedCallback) {
          this.onCallConnectedCallback();
        }
        break;
        
      case "hangup":
        console.log("📴 Call ended");
        if (this.onCallEndedCallback) {
          this.onCallEndedCallback();
        }
        break;

      default:
        console.log("ℹ️ Unhandled SIP event:", event);
    }
    
    if (jsep) {
      console.log("🔄 Handling incoming JSEP:", jsep);
      
      // Analyze SDP for debugging
      if (jsep.sdp) {
        this.analyzeSDP(jsep.sdp);
      }
      
      const sipPlugin = this.sessionManager.getSipPlugin();
      if (sipPlugin) {
        sipPlugin.handleRemoteJsep({ 
          jsep: jsep,
          success: () => {
            console.log("✅ Remote JSEP processed successfully");
          },
          error: (error: any) => {
            console.error("❌ Error handling remote JSEP:", error);
          }
        });
      }
    }
  }

  private analyzeSDP(sdp: string): void {
    const lines = sdp.split('\r\n');
    let currentMedia: 'audio' | 'video' | null = null;
    let hasAudio = false;
    let audioDirection: string | null = null;
    
    console.log("🔍 SDP Analysis:");
    
    for (const line of lines) {
      if (line.startsWith('m=audio')) {
        currentMedia = 'audio';
        hasAudio = true;
        console.log("  ✅ Found audio media section");
      } else if (line.startsWith('m=video')) {
        currentMedia = 'video';
      }
      
      if (currentMedia === 'audio') {
        if (line.startsWith('a=sendrecv')) {
          audioDirection = 'sendrecv';
          console.log("  🔊 Audio direction: sendrecv (bidirectional)");
        } else if (line.startsWith('a=sendonly')) {
          audioDirection = 'sendonly';
          console.log("  📤 Audio direction: sendonly");
        } else if (line.startsWith('a=recvonly')) {
          audioDirection = 'recvonly';
          console.log("  📥 Audio direction: recvonly");
        } else if (line.startsWith('a=inactive')) {
          audioDirection = 'inactive';
          console.log("  ⚠️ Audio direction: inactive");
        }
      }
    }
    
    if (!hasAudio) {
      console.warn("⚠️ SDP missing audio media section!");
    } else if (!audioDirection) {
      console.warn("⚠️ Audio section missing direction attribute!");
    }
  }

  // Callback handlers for SIP events
  private onIncomingCallCallback: ((from: string, jsep: any) => void) | null = null;
  private onCallConnectedCallback: (() => void) | null = null;
  private onCallEndedCallback: (() => void) | null = null;
  
  setOnIncomingCall(callback: ((from: string, jsep: any) => void) | null): void {
    this.onIncomingCallCallback = callback;
  }
  
  setOnCallConnected(callback: (() => void) | null): void {
    this.onCallConnectedCallback = callback;
  }
  
  setOnCallEnded(callback: (() => void) | null): void {
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
    if (!this.sipRegistration) {
      throw new Error("SIP registration manager not initialized");
    }

    return this.sipRegistration.register(username, password, sipHost);
  }

  async call(destination: string, isVideoCall: boolean = false, audioOptions?: AudioCallOptions): Promise<void> {
    const sipPlugin = this.sessionManager.getSipPlugin();
    if (!sipPlugin) {
      throw new Error("SIP plugin not attached");
    }
    
    // Get audio settings
    const finalAudioOptions = this.getAudioOptions(audioOptions);
    
    const callRequest = {
      request: "call",
      uri: destination.indexOf("sip:") === 0 ? destination : `sip:${destination}`,
      video: isVideoCall
    };
    
    return new Promise<void>((resolve, reject) => {
      const constraints = this.buildMediaConstraints(finalAudioOptions, isVideoCall);
      
      console.log("🎥 Getting user media with constraints:", constraints);
      
      navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
          console.log("✅ Got local media stream:", stream);
          
          // Configure local audio tracks
          stream.getAudioTracks().forEach((track, idx) => {
            console.log(`🎤 Audio track ${idx}:`, track.getSettings());
            track.enabled = true;
          });
          
          // Create SDP offer
          sipPlugin.createOffer({
            media: {
              audioSend: true,
              audioRecv: true,
              videoSend: isVideoCall,
              videoRecv: isVideoCall,
              audioSendCodec: "opus",
              audioRecvCodec: "opus",
              data: false
            },
            success: (jsep: any) => {
              console.log("✅ SDP offer created:", jsep);
              sipPlugin.send({
                message: callRequest,
                jsep: jsep,
                success: () => {
                  console.log("📞 Call request sent");
                  resolve();
                },
                error: (error: any) => {
                  console.error("❌ Call request failed:", error);
                  reject(new Error(`Call failed: ${error}`));
                }
              });
            },
            error: (error: any) => {
              console.error("❌ Failed to create offer:", error);
              reject(new Error(`Failed to create offer: ${error}`));
            }
          });
        })
        .catch(error => {
          console.error("❌ Failed to get user media:", error);
          reject(new Error(`Failed to get user media: ${error}`));
        });
    });
  }

  async acceptCall(jsep: any, audioOptions?: AudioCallOptions): Promise<void> {
    const sipPlugin = this.sessionManager.getSipPlugin();
    if (!sipPlugin) {
      throw new Error("SIP plugin not attached");
    }
    
    const finalAudioOptions = this.getAudioOptions(audioOptions);
    
    return new Promise<void>((resolve, reject) => {
      const constraints = this.buildMediaConstraints(finalAudioOptions, false);
      
      console.log("🎥 Getting user media for call acceptance:", constraints);
      console.log("📥 Incoming JSEP:", jsep);
      
      this.analyzeSDP(jsep.sdp);
      
      navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
          console.log("✅ Got local stream for call acceptance:", stream);
          
          // Configure local audio tracks
          stream.getAudioTracks().forEach(track => {
            console.log("🎤 Local audio track settings:", track.getSettings());
            track.enabled = true;
          });
          
          sipPlugin.createAnswer({
            jsep: jsep,
            media: { 
              audioSend: true, 
              audioRecv: true,
              videoSend: false,
              videoRecv: false,
              audioSendCodec: "opus",
              audioRecvCodec: "opus"
            },
            success: (ourjsep: any) => {
              console.log("✅ SDP answer created:", ourjsep);
              
              const body = { request: "accept" };
              sipPlugin.send({
                message: body,
                jsep: ourjsep,
                success: () => {
                  console.log("✅ Call accepted successfully");
                  
                  // Apply audio output device
                  this.applyAudioOutputDevice();
                  
                  resolve();
                },
                error: (error: any) => {
                  console.error("❌ Failed to accept call:", error);
                  reject(new Error(`Failed to accept call: ${error}`));
                }
              });
            },
            error: (error: any) => {
              console.error("❌ Failed to create answer:", error);
              reject(new Error(`Failed to create answer: ${error}`));
            }
          });
        })
        .catch(error => {
          console.error("❌ Failed to get user media for call:", error);
          reject(new Error(`Failed to get user media: ${error}`));
        });
    });
  }

  private getAudioOptions(audioOptions?: AudioCallOptions): AudioCallOptions {
    if (audioOptions) return audioOptions;
    
    const savedAudioInput = localStorage.getItem('selectedAudioInput');
    let settings = {};
    
    try {
      const storedSettings = localStorage.getItem('audioSettings');
      if (storedSettings) {
        const audioSettings = JSON.parse(storedSettings);
        settings = {
          echoCancellation: audioSettings.echoSuppression,
          noiseSuppression: audioSettings.noiseCancellation,
          autoGainControl: audioSettings.autoGainControl,
        };
      }
    } catch (error) {
      console.error("Error parsing audio settings:", error);
    }
    
    return {
      audioInput: savedAudioInput || undefined,
      ...settings
    } as AudioCallOptions;
  }

  private buildMediaConstraints(audioOptions: AudioCallOptions, isVideoCall: boolean): MediaStreamConstraints {
    return {
      audio: audioOptions.audioInput ? {
        deviceId: { exact: audioOptions.audioInput },
        echoCancellation: audioOptions.echoCancellation ?? true,
        noiseSuppression: audioOptions.noiseSuppression ?? true,
        autoGainControl: audioOptions.autoGainControl ?? true
      } : {
        echoCancellation: audioOptions.echoCancellation ?? true,
        noiseSuppression: audioOptions.noiseSuppression ?? true,
        autoGainControl: audioOptions.autoGainControl ?? true
      },
      video: isVideoCall ? (localStorage.getItem('selectedVideoInput') ? 
        { deviceId: { exact: localStorage.getItem('selectedVideoInput')! } } : true) : false
    };
  }

  private applyAudioOutputDevice(): void {
    const savedAudioOutput = localStorage.getItem('selectedAudioOutput');
    if (savedAudioOutput) {
      unifiedAudioManager.setAudioOutput(savedAudioOutput)
        .then(() => console.log("🔊 Audio output device applied:", savedAudioOutput))
        .catch((error: any) => console.warn("⚠️ Failed to set audio output:", error));
    }
  }

  async sendDTMF(dtmf: string): Promise<void> {
    const sipPlugin = this.sessionManager.getSipPlugin();
    if (!sipPlugin) {
      throw new Error("SIP plugin not attached");
    }
    
    if (!dtmf.match(/^[0-9*#]$/)) {
      throw new Error("Invalid DTMF character. Must be 0-9, *, or #");
    }
    
    console.log(`📱 Sending DTMF tone: ${dtmf}`);
    
    return new Promise<void>((resolve, reject) => {
      const message = {
        request: "dtmf_info",
        digit: dtmf
      };
      
      sipPlugin.send({
        message: message,
        success: () => {
          console.log(`✅ DTMF tone ${dtmf} sent successfully`);
          resolve();
        },
        error: (error: any) => {
          console.error(`❌ Error sending DTMF tone ${dtmf}:`, error);
          reject(new Error(`Failed to send DTMF: ${error}`));
        }
      });
    });
  }

  async hangup(): Promise<void> {
    const sipPlugin = this.sessionManager.getSipPlugin();
    if (!sipPlugin) {
      return;
    }
    
    const hangupMsg = { request: "hangup" };
    
    return new Promise<void>((resolve, reject) => {
      sipPlugin.send({
        message: hangupMsg,
        success: () => {
          console.log("✅ Hangup request sent successfully");
          resolve();
        },
        error: (error: any) => {
          console.error("❌ Error sending hangup request:", error);
          reject(error);
        }
      });
    });
  }

  // State checkers
  isJanusConnected(): boolean {
    return this.sessionManager.isConnected();
  }
  
  isRegistered(): boolean {
    return this.sipRegistration?.isRegistered() ?? false;
  }
  
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }
  
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  // Cleanup and disconnection
  async disconnect(): Promise<void> {
    console.log("🔌 Disconnecting Improved Janus service");
    
    // Clean up audio
    unifiedAudioManager.cleanup();
    
    // Reset SIP registration
    if (this.sipRegistration) {
      this.sipRegistration.reset();
      this.sipRegistration = null;
    }
    
    // Reset streams
    this.localStream = null;
    this.remoteStream = null;
    
    // Disconnect session
    await this.sessionManager.safeDisconnect();
  }

  // Legacy compatibility methods
  getJanus() {
    return this.sessionManager.getJanus();
  }

  getSipPlugin() {
    return this.sessionManager.getSipPlugin();
  }
}

const improvedJanusService = new ImprovedJanusService();
export default improvedJanusService;