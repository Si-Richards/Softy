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

class JanusService {
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

    try {
      await this.sessionManager.createSession(options);
      const sipPlugin = await this.sessionManager.attachSipPlugin();
      
      this.configureSipPlugin(sipPlugin);
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
    sipPlugin.onmessage = (msg: any, jsep: any) => {
      this.handleSipMessage(msg, jsep);
    };

    sipPlugin.onlocalstream = (stream: MediaStream) => {
      this.localStream = stream;
      stream.getAudioTracks().forEach(track => {
        track.enabled = true;
      });
    };

    sipPlugin.onremotestream = (stream: MediaStream) => {
      this.remoteStream = stream;
      unifiedAudioManager.setRemoteStream(stream);
    };

    sipPlugin.oncleanup = () => {
      unifiedAudioManager.cleanup();
      this.localStream = null;
      this.remoteStream = null;
    };

    this.sessionManager.setSipPlugin(sipPlugin);
  }

  private handleSipMessage(msg: any, jsep?: any): void {
    if (msg.error) {
      if (this.eventHandlers.onError) {
        this.eventHandlers.onError(`SIP Error: ${msg.error}`);
      }
      return;
    }

    if (!msg.result) return;

    const result = msg.result;
    const event = result.event;

    switch (event) {
      case "registered":
        if (this.sipRegistration) {
          this.sipRegistration.handleRegistrationSuccess();
        }
        if (this.eventHandlers.onRegistrationSuccess) {
          this.eventHandlers.onRegistrationSuccess();
        }
        break;

      case "registration_failed":
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
        if (this.sipRegistration) {
          this.sipRegistration.handleUnregistrationSuccess();
        }
        break;
        
      case "incomingcall":
        if (this.onIncomingCallCallback) {
          this.onIncomingCallCallback(result.username, jsep);
        }
        break;
        
      case "accepted":
        if (this.onCallConnectedCallback) {
          this.onCallConnectedCallback();
        }
        break;
        
      case "hangup":
        if (this.onCallEndedCallback) {
          this.onCallEndedCallback();
        }
        break;
    }
    
    if (jsep) {
      const sipPlugin = this.sessionManager.getSipPlugin();
      if (sipPlugin) {
        sipPlugin.handleRemoteJsep({ 
          jsep: jsep,
          success: () => console.log("✅ Remote JSEP processed"),
          error: (error: any) => console.error("❌ JSEP error:", error)
        });
      }
    }
  }

  // Callback handlers
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
    if (!sipPlugin) throw new Error("SIP plugin not attached");
    
    const finalAudioOptions = this.getAudioOptions(audioOptions);
    const callRequest = {
      request: "call",
      uri: destination.indexOf("sip:") === 0 ? destination : `sip:${destination}`,
      video: isVideoCall
    };
    
    return new Promise<void>((resolve, reject) => {
      const constraints = this.buildMediaConstraints(finalAudioOptions, isVideoCall);
      
      navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
          stream.getAudioTracks().forEach(track => track.enabled = true);
          
          sipPlugin.createOffer({
            media: {
              audioSend: true,
              audioRecv: true,
              videoSend: isVideoCall,
              videoRecv: isVideoCall,
              audioSendCodec: "opus",
              audioRecvCodec: "opus"
            },
            success: (jsep: any) => {
              sipPlugin.send({
                message: callRequest,
                jsep: jsep,
                success: () => resolve(),
                error: (error: any) => reject(new Error(`Call failed: ${error}`))
              });
            },
            error: (error: any) => reject(new Error(`Failed to create offer: ${error}`))
          });
        })
        .catch(error => reject(new Error(`Failed to get user media: ${error}`)));
    });
  }

  async acceptCall(jsep: any, audioOptions?: AudioCallOptions): Promise<void> {
    const sipPlugin = this.sessionManager.getSipPlugin();
    if (!sipPlugin) throw new Error("SIP plugin not attached");
    
    const finalAudioOptions = this.getAudioOptions(audioOptions);
    
    return new Promise<void>((resolve, reject) => {
      const constraints = this.buildMediaConstraints(finalAudioOptions, false);
      
      navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
          stream.getAudioTracks().forEach(track => track.enabled = true);
          
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
              const body = { request: "accept" };
              sipPlugin.send({
                message: body,
                jsep: ourjsep,
                success: () => {
                  this.applyAudioOutputDevice();
                  resolve();
                },
                error: (error: any) => reject(new Error(`Failed to accept call: ${error}`))
              });
            },
            error: (error: any) => reject(new Error(`Failed to create answer: ${error}`))
          });
        })
        .catch(error => reject(new Error(`Failed to get user media: ${error}`)));
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
        .catch((error: any) => console.warn("⚠️ Failed to set audio output:", error));
    }
  }

  async sendDTMF(dtmf: string): Promise<void> {
    const sipPlugin = this.sessionManager.getSipPlugin();
    if (!sipPlugin) throw new Error("SIP plugin not attached");
    
    if (!dtmf.match(/^[0-9*#]$/)) {
      throw new Error("Invalid DTMF character. Must be 0-9, *, or #");
    }
    
    return new Promise<void>((resolve, reject) => {
      sipPlugin.send({
        message: { request: "dtmf_info", digit: dtmf },
        success: () => resolve(),
        error: (error: any) => reject(new Error(`Failed to send DTMF: ${error}`))
      });
    });
  }

  async hangup(): Promise<void> {
    const sipPlugin = this.sessionManager.getSipPlugin();
    if (!sipPlugin) return;
    
    return new Promise<void>((resolve, reject) => {
      sipPlugin.send({
        message: { request: "hangup" },
        success: () => resolve(),
        error: (error: any) => reject(error)
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

  // Cleanup
  async disconnect(): Promise<void> {
    unifiedAudioManager.cleanup();
    
    if (this.sipRegistration) {
      this.sipRegistration.reset();
      this.sipRegistration = null;
    }
    
    this.localStream = null;
    this.remoteStream = null;
    
    await this.sessionManager.safeDisconnect();
  }

  // Legacy compatibility
  getJanus() {
    return this.sessionManager.getJanus();
  }

  getSipPlugin() {
    return this.sessionManager.getSipPlugin();
  }
}

const janusService = new JanusService();
export default janusService;