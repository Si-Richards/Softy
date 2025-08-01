import { JanusEventHandlers } from './janus/eventHandlers';
import type { JanusOptions, SipCredentials } from './janus/types';
import type { AudioCallOptions } from './janus/sip/types';
import audioService from '@/services/AudioService';
import { audioStreamManager } from './janus/audioStreamManager';

class JanusService {
  private janus: any = null;
  private sipPlugin: any = null;
  private eventHandlers: JanusEventHandlers;
  private opaqueId: string;
  private registered: boolean = false;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private trackListeners: Map<string, () => void> = new Map();
  private pcListeners: Map<string, any> = new Map();
  private receivedTracks: MediaStreamTrack[] = [];

  constructor() {
    this.eventHandlers = new JanusEventHandlers();
    this.opaqueId = "softphone-" + Math.floor(Math.random() * 10000);
    
    // Initialize audio stream manager
    audioStreamManager.initialize();
  }

  async initialize(options: JanusOptions): Promise<boolean> {
    if (!options.server) {
      const errorMsg = "No Janus server URL provided";
      if (options.error) options.error(errorMsg);
      if (this.eventHandlers.onError) this.eventHandlers.onError(errorMsg);
      throw new Error(errorMsg);
    }

    // Cleanup any existing session
    this.disconnect();

    try {
      await this.initializeJanus(options);
      await this.attachSipPlugin();
      
      if (options.success) options.success();
      return true;
    } catch (error: any) {
      const errorMsg = `Failed to initialize Janus: ${error.message || error}`;
      if (options.error) options.error(errorMsg);
      if (this.eventHandlers.onError) this.eventHandlers.onError(errorMsg);
      this.disconnect();
      throw new Error(errorMsg);
    }
  }

  private async initializeJanus(options: JanusOptions): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (typeof window.Janus === 'undefined') {
        reject(new Error('Janus library not loaded'));
        return;
      }

      // Initialize Janus
      window.Janus.init({
        debug: options.debug || "all",
        callback: () => {
          console.log("Janus library initialized");
          
          // Create Janus session
          this.janus = new window.Janus({
            server: options.server,
            apisecret: options.apiSecret,
            iceServers: options.iceServers,
            success: () => {
              console.log("Janus session created successfully");
              resolve();
            },
            error: (error: any) => {
              console.error("Error creating Janus session:", error);
              reject(error);
            },
            destroyed: options.destroyed
          });
        },
        error: (error: any) => {
          console.error("Error initializing Janus library:", error);
          reject(error);
        }
      });
    });
  }

  private async attachSipPlugin(): Promise<void> {
    if (!this.janus) {
      throw new Error("Janus not initialized");
    }

    return new Promise<void>((resolve, reject) => {
      this.janus.attach({
        plugin: "janus.plugin.sip",
        opaqueId: this.opaqueId,
        success: (pluginHandle: any) => {
          this.sipPlugin = pluginHandle;
          console.log("SIP plugin attached:", pluginHandle);
          
          // Access and monitor the underlying PeerConnection
          if (this.sipPlugin.webrtcStuff && this.sipPlugin.webrtcStuff.pc) {
            this.monitorPeerConnection(this.sipPlugin.webrtcStuff.pc);
          }
          
          resolve();
        },
        error: (error: any) => {
          const errorMsg = `Error attaching to SIP plugin: ${error}`;
          console.error(errorMsg);
          if (this.eventHandlers.onError) this.eventHandlers.onError(errorMsg);
          reject(new Error(errorMsg));
        },
        onmessage: (msg: any, jsep: any) => {
          console.log("Received SIP message:", msg);
          this.handleSipMessage(msg, jsep);
        },
        onlocalstream: (stream: MediaStream) => {
          console.log("Got local stream", stream);
          this.localStream = stream;
          
          // Ensure all local audio tracks are enabled
          stream.getAudioTracks().forEach(track => {
            console.log("Local audio track:", track.label, "enabled:", track.enabled);
            track.enabled = true;
          });
        },
        onremotestream: (stream: MediaStream) => {
          console.log("📡 Got remote stream", stream);
          
          // Use centralized audio stream manager
          audioStreamManager.setRemoteStream(stream);
          this.remoteStream = stream;
          
          // Also notify audio service for compatibility
          audioService.attachStream(stream);
        },
        oncleanup: () => {
          console.log("🧹 SIP plugin cleaned up");
          audioStreamManager.cleanup();
          this.localStream = null;
          this.remoteStream = null;
        },
        // Explicit ontrack handler - use centralized manager
        ontrack: (track: MediaStreamTrack, mid: string, on: boolean) => {
          console.log(`🎵 TRACK RECEIVED! kind=${track.kind}, id=${track.id}, mid=${mid}, enabled=${on}`);
          
          if (track.kind === 'audio') {
            audioStreamManager.addTrackDirectly(track);
            this.receivedTracks.push(track);
          }
        }
      });
    });
  }
  
  /**
   * Monitor the PeerConnection directly for track events
   */
  private monitorPeerConnection(pc: RTCPeerConnection) {
    console.log("Monitoring RTCPeerConnection for track events", pc);
    
    // Remove any existing listeners
    if (this.pcListeners.has('track')) {
      const oldListener = this.pcListeners.get('track');
      pc.removeEventListener('track', oldListener);
      this.pcListeners.delete('track');
    }
    
    // Add direct ontrack listener to PeerConnection
    const trackListener = (event: RTCTrackEvent) => {
      console.log("PC TRACK EVENT!", event);
      
      event.streams.forEach(stream => {
        console.log("Track event stream:", stream.id);
      });
      
      event.track.onunmute = () => {
        console.log(`Track ${event.track.id} unmuted!`);
      };
      
      if (event.track.kind === 'audio') {
        console.log(`Direct PC audio track received:`, {
          id: event.track.id,
          enabled: event.track.enabled,
          muted: event.track.muted,
          readyState: event.track.readyState
        });
        
        // Save track
        this.receivedTracks.push(event.track);
        
        // Ensure we have a stream
        if (!this.remoteStream) {
          this.remoteStream = new MediaStream();
        }
        
        // Add to our stream
        this.remoteStream.addTrack(event.track);
        
        // Make sure the track is enabled
        event.track.enabled = true;
        
        // Use both direct methods to play the track
        audioService.attachAudioTrack(event.track);
        this.createTrackAudioElement(event.track);
      }
    };
    
    pc.addEventListener('track', trackListener);
    this.pcListeners.set('track', trackListener);
    
    // Also listen for SDP renegotiation events
    pc.addEventListener('signalingstatechange', () => {
      console.log("Signaling state changed:", pc.signalingState);
      
      // Log all transceivers when in stable state to check media directions
      if (pc.signalingState === 'stable' && pc.getTransceivers) {
        console.log("Connection stable - checking transceivers");
        pc.getTransceivers().forEach((transceiver, idx) => {
          console.log(`Transceiver ${idx}:`, {
            mid: transceiver.mid,
            direction: transceiver.direction,
            currentDirection: transceiver.currentDirection,
            // Changed: Use an optional chaining to check if 'stopped' exists
            stopped: 'stopped' in transceiver ? transceiver.stopped : false,
            kind: transceiver.receiver.track?.kind || 'unknown'
          });
        });
      }
    });
  }
  
  /**
   * Create a dedicated audio element for a track to ensure it plays
   */
  private createTrackAudioElement(track: MediaStreamTrack) {
    // Create a new stream with just this track
    const singleTrackStream = new MediaStream([track]);
    
    // Create dedicated audio element
    const trackAudio = document.createElement('audio');
    trackAudio.id = `audio-track-${track.id}`;
    trackAudio.autoplay = true;
    
    // Fixed: Use setAttribute instead of direct property assignment for non-standard properties
    trackAudio.setAttribute('playsinline', 'true');
    
    trackAudio.style.display = 'none';
    trackAudio.srcObject = singleTrackStream;
    
    // Set output device if specified
    const savedAudioOutput = localStorage.getItem('selectedAudioOutput');
    if (savedAudioOutput && 'setSinkId' in HTMLAudioElement.prototype) {
      (trackAudio as any).setSinkId(savedAudioOutput)
        .catch((e: any) => console.warn("Error setting audio output on dedicated element:", e));
    }
    
    // Append to document and attempt to play
    document.body.appendChild(trackAudio);
    
    trackAudio.play()
      .then(() => console.log(`Dedicated audio element for track ${track.id} playing`))
      .catch(e => console.warn(`Error playing dedicated audio for track ${track.id}:`, e));
    
    // Set up monitoring interval to check if audio is flowing
    const monitorInterval = setInterval(() => {
      if (track.readyState === 'ended') {
        console.warn(`Track ${track.id} has ended - cleaning up dedicated element`);
        document.body.removeChild(trackAudio);
        clearInterval(monitorInterval);
      }
    }, 5000);
    
    // Return the element for potential further use
    return trackAudio;
  }
  
  /**
   * Clean up track event listeners
   */
  private clearTrackListeners(): void {
    if (this.remoteStream) {
      this.remoteStream.getAudioTracks().forEach(track => {
        const listener = this.trackListeners.get(track.id);
        if (listener) {
          track.removeEventListener('ended', listener);
          this.trackListeners.delete(track.id);
        }
      });
    }
    this.trackListeners.clear();
  }

  private handleSipMessage(msg: any, jsep?: any): void {
    if (msg.error) {
      console.error("SIP Error:", msg.error);
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
        console.log("SIP Registration successful");
        this.registered = true;
        if (this.eventHandlers.onRegistrationSuccess) {
          this.eventHandlers.onRegistrationSuccess();
        }
        break;

      case "registration_failed":
        console.error("SIP Registration failed:", result.code, result.reason);
        this.registered = false;
        if (this.eventHandlers.onRegistrationFailed) {
          this.eventHandlers.onRegistrationFailed(
            `Registration failed: ${result.code} - ${result.reason}`
          );
        }
        break;
        
      case "incomingcall":
        console.log("Incoming call from:", result.username);
        if (this.onIncomingCallCallback) {
          this.onIncomingCallCallback(result.username, jsep);
        }
        break;
        
      case "accepted":
        console.log("Call accepted");
        if (this.onCallConnectedCallback) {
          this.onCallConnectedCallback();
        }
        break;
        
      case "hangup":
        console.log("Call ended");
        if (this.onCallEndedCallback) {
          this.onCallEndedCallback();
        }
        break;

      default:
        console.log("Unhandled SIP event:", event);
    }
    
    if (jsep) {
      console.log("Handling incoming JSEP:", jsep);
      
      // Analyze SDP for audio track information
      if (jsep.sdp) {
        console.log("Analyzing SDP for audio tracks:");
        this.analyzeSDP(jsep.sdp);
      }
      
      this.sipPlugin?.handleRemoteJsep({ 
        jsep: jsep,
        success: () => {
          console.log("Remote JSEP processed successfully");
          
          // Check if we have the PeerConnection after handling remote jsep
          if (this.sipPlugin.webrtcStuff && this.sipPlugin.webrtcStuff.pc) {
            this.monitorPeerConnection(this.sipPlugin.webrtcStuff.pc);
          }
        },
        error: (error: any) => {
          console.error("Error handling remote JSEP:", error);
        }
      });
    }
  }
  
  /**
   * Analyze SDP to find issues with audio tracks
   */
  private analyzeSDP(sdp: string): void {
    const lines = sdp.split('\r\n');
    let currentMedia: 'audio' | 'video' | null = null;
    let hasAudio = false;
    let audioDirection: string | null = null;
    
    console.log("--- SDP Analysis ---");
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for media sections
      if (line.startsWith('m=audio')) {
        currentMedia = 'audio';
        hasAudio = true;
        console.log("Found audio media section");
      } else if (line.startsWith('m=video')) {
        currentMedia = 'video';
      }
      
      // Check direction attributes in audio section
      if (currentMedia === 'audio') {
        if (line.startsWith('a=sendrecv')) {
          audioDirection = 'sendrecv';
          console.log("Audio direction: sendrecv (bidirectional)");
        } else if (line.startsWith('a=sendonly')) {
          audioDirection = 'sendonly';
          console.log("Audio direction: sendonly (remote can only receive)");
        } else if (line.startsWith('a=recvonly')) {
          audioDirection = 'recvonly';
          console.log("Audio direction: recvonly (remote can only send)");
        } else if (line.startsWith('a=inactive')) {
          audioDirection = 'inactive';
          console.log("Audio direction: inactive (no audio flowing)");
        }
      }
    }
    
    if (!hasAudio) {
      console.warn("SDP does not contain audio media section!");
    } else if (!audioDirection) {
      console.warn("Audio section does not have explicit direction attribute!");
    }
    
    console.log("--- End SDP Analysis ---");
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
    if (!this.sipPlugin) {
      throw new Error("SIP plugin not attached");
    }

    try {
      // Parse the username and host for proper formatting
      let user = username;
      let domain = sipHost;
      
      // Strip any 'sip:' prefix from the username if it exists
      if (user.startsWith("sip:")) {
        user = user.substring(4);
      }

      // Check if username contains @ which means it already has domain
      if (user.includes("@")) {
        const parts = user.split("@");
        user = parts[0];
        domain = parts[1].split(":")[0]; // Use domain from username, ignoring port
      }

      // Extract port from sipHost if present
      const hostParts = domain.split(":");
      const host = hostParts[0];
      const port = hostParts.length > 1 ? hostParts[1] : "5060";
      
      // Create SIP URI
      const identity = `sip:${user}@${host}`;
      const proxy = `sip:${host}:${port}`;
      
      console.log(`Registering as: ${identity}, proxy: ${proxy}`);

      // Registration request - Updated: Removed ha1_secret parameter
      const request = {
        request: "register",
        username: identity,
        display_name: user,
        secret: password,
        proxy: proxy,
        authuser: user
      };

      this.sipPlugin.send({
        message: request,
        success: () => {
          console.log("Registration request sent successfully");
        },
        error: (error: any) => {
          console.error("Error sending registration request:", error);
          if (this.eventHandlers.onError) {
            this.eventHandlers.onError(`Failed to send registration request: ${error}`);
          }
        }
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      if (this.eventHandlers.onError) {
        this.eventHandlers.onError(`Registration error: ${error.message || error}`);
      }
      throw error;
    }
  }
  
  // Updated call method to use audio devices and improve SDP offer
  async call(destination: string, isVideoCall: boolean = false, audioOptions?: AudioCallOptions): Promise<void> {
    if (!this.sipPlugin) {
      throw new Error("SIP plugin not attached");
    }
    
    // Get the saved audio input device if not provided
    if (!audioOptions) {
      const savedAudioInput = localStorage.getItem('selectedAudioInput');
      audioOptions = {
        audioInput: savedAudioInput || undefined
      };
    }
    
    // Apply audio settings from localStorage
    try {
      const storedSettings = localStorage.getItem('audioSettings');
      if (storedSettings && !audioOptions.echoCancellation) {
        const audioSettings = JSON.parse(storedSettings);
        audioOptions.echoCancellation = audioSettings.echoSuppression;
        audioOptions.noiseSuppression = audioSettings.noiseCancellation;
        audioOptions.autoGainControl = audioSettings.autoGainControl;
      }
    } catch (error) {
      console.error("Error parsing audio settings:", error);
    }
    
    const callRequest = {
      request: "call",
      uri: destination.indexOf("sip:") === 0 ? destination : `sip:${destination}`,
      video: isVideoCall
    };
    
    return new Promise<void>((resolve, reject) => {
      // Get media constraints for the call
      const constraints = {
        audio: audioOptions?.audioInput ? 
          { 
            deviceId: { exact: audioOptions.audioInput },
            echoCancellation: audioOptions.echoCancellation ?? true,
            noiseSuppression: audioOptions.noiseSuppression ?? true,
            autoGainControl: audioOptions.autoGainControl ?? true
          } : {
            echoCancellation: audioOptions?.echoCancellation ?? true,
            noiseSuppression: audioOptions?.noiseSuppression ?? true,
            autoGainControl: audioOptions?.autoGainControl ?? true
          },
        video: isVideoCall ? (localStorage.getItem('selectedVideoInput') ? 
          { deviceId: { exact: localStorage.getItem('selectedVideoInput') } } : true) : false
      };
      
      console.log("Getting user media with constraints:", JSON.stringify(constraints));
      
      navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
          console.log("Got local media stream for call:", stream);
          
          // Log audio tracks and ensure they're enabled
          stream.getAudioTracks().forEach((track, idx) => {
            console.log(`Audio track ${idx} settings:`, track.getSettings());
            track.enabled = true;
          });
          
          // Create SDP offer with explicit sendrecv for audio
          this.sipPlugin.createOffer({
            media: {
              audioSend: true,
              audioRecv: true,
              videoSend: isVideoCall,
              videoRecv: isVideoCall,
              audioSendCodec: "opus",   // Prefer Opus for better audio quality
              audioRecvCodec: "opus",
              data: false
            },
            // Add explicit specification of SDP direction attributes
            customizeSdp: (jsep: any) => {
              // Make sure the SDP explicitly allows bidirectional audio
              if (jsep && jsep.sdp) {
                const sdpLines = jsep.sdp.split("\r\n");
                let audioFound = false;
                
                // Find the audio m-line
                for (let i = 0; i < sdpLines.length; i++) {
                  if (sdpLines[i].startsWith("m=audio")) {
                    audioFound = true;
                  }
                  
                  // If we're in the audio section and there's a direction line, ensure it's sendrecv
                  if (audioFound && sdpLines[i].startsWith("a=")) {
                    if (sdpLines[i].startsWith("a=sendonly") || 
                        sdpLines[i].startsWith("a=recvonly") || 
                        sdpLines[i].startsWith("a=inactive")) {
                      sdpLines[i] = "a=sendrecv";
                      console.log("Modified SDP direction to sendrecv for audio");
                    }
                    
                    // If we find a media attribute that's not direction, we're past the point where we'd add it
                    if (sdpLines[i].startsWith("a=rtpmap") || 
                        sdpLines[i].startsWith("a=fmtp") || 
                        sdpLines[i].startsWith("a=rtcp")) {
                      // If we haven't seen a direction attribute yet, add one
                      sdpLines.splice(i, 0, "a=sendrecv");
                      console.log("Added explicit sendrecv direction to audio section");
                      break;
                    }
                  }
                  
                  // If we've found a new media section, we're done with audio
                  if (audioFound && sdpLines[i].startsWith("m=") && !sdpLines[i].startsWith("m=audio")) {
                    break;
                  }
                }
                
                jsep.sdp = sdpLines.join("\r\n");
                console.log("Modified SDP:", jsep.sdp);
              }
            },
            success: (jsep: any) => {
              console.log("Got SDP offer", jsep);
              this.sipPlugin.send({
                message: callRequest,
                jsep: jsep,
                success: () => {
                  console.log("Call request sent");
                  resolve();
                },
                error: (error: any) => {
                  console.error("Error sending call request:", error);
                  reject(new Error(`Call failed: ${error}`));
                }
              });
            },
            error: (error: any) => {
              console.error("Error creating SDP offer:", error);
              reject(new Error(`Failed to create offer: ${error}`));
            }
          });
        })
        .catch(error => {
          console.error("Error getting user media:", error);
          reject(new Error(`Failed to get user media: ${error}`));
        });
    });
  }
  
  async acceptCall(jsep: any, audioOptions?: AudioCallOptions): Promise<void> {
    if (!this.sipPlugin) {
      throw new Error("SIP plugin not attached");
    }
    
    // Get the saved audio input device if not provided
    if (!audioOptions) {
      const savedAudioInput = localStorage.getItem('selectedAudioInput');
      audioOptions = {
        audioInput: savedAudioInput || undefined
      };
    }
    
    return new Promise<void>((resolve, reject) => {
      // Get media access with specified audio device
      const constraints = {
        audio: audioOptions?.audioInput ? 
          { 
            deviceId: { exact: audioOptions.audioInput },
            echoCancellation: audioOptions.echoCancellation ?? true,
            noiseSuppression: audioOptions.noiseSuppression ?? true,
            autoGainControl: audioOptions.autoGainControl ?? true
          } : {
            echoCancellation: audioOptions?.echoCancellation ?? true,
            noiseSuppression: audioOptions?.noiseSuppression ?? true,
            autoGainControl: audioOptions?.autoGainControl ?? true
          },
        video: jsep.type !== "offer" || jsep.sdp.indexOf("m=video") > 0
      };
      
      console.log("Getting user media for accepting call:", constraints);
      console.log("Incoming JSEP:", jsep);
      
      // Analyze the SDP
      this.analyzeSDP(jsep.sdp);
      
      navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
          console.log("Got local stream for accepting call", stream);
          
          // Ensure audio tracks are enabled
          stream.getAudioTracks().forEach(track => {
            console.log("Local audio track settings:", track.getSettings());
            track.enabled = true;
          });
          
          this.sipPlugin.createAnswer({
            jsep: jsep,
            media: { 
              audioSend: true, 
              audioRecv: true,
              videoSend: jsep.type !== "offer" || jsep.sdp.indexOf("m=video") > 0,
              videoRecv: jsep.type !== "offer" || jsep.sdp.indexOf("m=video") > 0,
              audioSendCodec: "opus",
              audioRecvCodec: "opus"
            },
            // Customize SDP to ensure audio directions are set correctly
            customizeSdp: (jsep: any) => {
              if (jsep && jsep.sdp) {
                const sdpLines = jsep.sdp.split("\r\n");
                let audioFound = false;
                
                for (let i = 0; i < sdpLines.length; i++) {
                  if (sdpLines[i].startsWith("m=audio")) {
                    audioFound = true;
                  }
                  
                  if (audioFound && sdpLines[i].startsWith("a=")) {
                    if (sdpLines[i].startsWith("a=sendonly") || 
                        sdpLines[i].startsWith("a=recvonly") || 
                        sdpLines[i].startsWith("a=inactive")) {
                      sdpLines[i] = "a=sendrecv";
                      console.log("Modified answer SDP direction to sendrecv for audio");
                    }
                    
                    if (sdpLines[i].startsWith("a=rtpmap") || 
                        sdpLines[i].startsWith("a=fmtp") || 
                        sdpLines[i].startsWith("a=rtcp")) {
                      sdpLines.splice(i, 0, "a=sendrecv");
                      console.log("Added explicit sendrecv direction to audio section in answer");
                      break;
                    }
                  }
                  
                  if (audioFound && sdpLines[i].startsWith("m=") && !sdpLines[i].startsWith("m=audio")) {
                    break;
                  }
                }
                
                jsep.sdp = sdpLines.join("\r\n");
                console.log("Modified answer SDP:", jsep.sdp);
              }
            },
            success: (ourjsep: any) => {
              const body = { request: "accept" };
              this.sipPlugin.send({
                message: body,
                jsep: ourjsep,
                success: () => {
                  console.log("Call accepted");
                  
                  // Access and monitor the underlying PeerConnection if available
                  if (this.sipPlugin.webrtcStuff && this.sipPlugin.webrtcStuff.pc) {
                    this.monitorPeerConnection(this.sipPlugin.webrtcStuff.pc);
                  }
                  
                  // Apply audio output device if specified and supported
                  const savedAudioOutput = localStorage.getItem('selectedAudioOutput');
                  if (savedAudioOutput && this.remoteStream) {
                    // Find or create audio element to play the remote stream
                    let audioElement = document.querySelector('audio#remoteAudio') as HTMLAudioElement;
                    if (!audioElement) {
                      audioElement = document.createElement('audio');
                      audioElement.id = 'remoteAudio';
                      audioElement.autoplay = true;
                      document.body.appendChild(audioElement);
                    }
                    
                    // Set the audio output device if the browser supports it
                    if ('setSinkId' in HTMLAudioElement.prototype) {
                      (audioElement as any).setSinkId(savedAudioOutput)
                        .then(() => console.log("Audio output set to:", savedAudioOutput))
                        .catch(e => console.error("Error setting audio output:", e));
                    }
                    
                    // Set the remote stream to the audio element
                    audioElement.srcObject = this.remoteStream;
                    
                    // Try to force play the audio
                    setTimeout(() => {
                      console.log("Attempting to play audio after accepting call");
                      audioElement.play()
                        .catch(e => {
                          console.warn("Audio play failed in acceptCall:", e);
                          // Use AudioService as fallback
                          audioService.attachStream(this.remoteStream);
                          audioService.forcePlayAudio().catch(e => console.warn("Fallback play failed:", e));
                        });
                    }, 300);
                  } else {
                    // Use AudioService for playback
                    if (this.remoteStream) {
                      audioService.attachStream(this.remoteStream);
                      
                      // Try to auto-play immediately
                      setTimeout(() => {
                        audioService.forcePlayAudio()
                          .catch(e => console.warn("Auto-play error in acceptCall:", e));
                      }, 300);
                    }
                  }
                  
                  resolve();
                },
                error: (error: any) => {
                  console.error("Error accepting call:", error);
                  reject(new Error(`Failed to accept call: ${error}`));
                }
              });
            },
            error: (error: any) => {
              console.error("Error creating answer:", error);
              reject(new Error(`Failed to create answer: ${error}`));
            }
          });
        })
        .catch(error => {
          console.error("Error getting user media for call:", error);
          reject(new Error(`Failed to get user media: ${error}`));
        });
    });
  }
  
  /**
   * Send DTMF tones during an active call
   * @param dtmf The DTMF tone to send (0-9, *, #)
   * @returns Promise that resolves when the DTMF has been sent
   */
  async sendDTMF(dtmf: string): Promise<void> {
    if (!this.sipPlugin) {
      throw new Error("SIP plugin not attached");
    }
    
    if (!dtmf.match(/^[0-9*#]$/)) {
      throw new Error("Invalid DTMF character. Must be 0-9, *, or #");
    }
    
    console.log(`Sending DTMF tone: ${dtmf}`);
    
    return new Promise<void>((resolve, reject) => {
      // Create the DTMF request message
      const message = {
        request: "dtmf_info",
        digit: dtmf
      };
      
      this.sipPlugin.send({
        message: message,
        success: () => {
          console.log(`DTMF tone ${dtmf} sent successfully`);
          resolve();
        },
        error: (error: any) => {
          console.error(`Error sending DTMF tone ${dtmf}:`, error);
          reject(new Error(`Failed to send DTMF: ${error}`));
        }
      });
    });
  }
  
  async hangup(): Promise<void> {
    if (!this.sipPlugin) {
      return;
    }
    
    const hangupMsg = { request: "hangup" };
    
    return new Promise<void>((resolve, reject) => {
      this.sipPlugin.send({
        message: hangupMsg,
        success: () => {
          console.log("Hangup request sent successfully");
          resolve();
        },
        error: (error: any) => {
          console.error("Error sending hangup request:", error);
          reject(error);
        }
      });
    });
  }
  
  isJanusConnected(): boolean {
    return this.janus !== null;
  }
  
  isRegistered(): boolean {
    return this.registered;
  }
  
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }
  
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }
  
  getReceivedTracks(): MediaStreamTrack[] {
    return this.receivedTracks;
  }
  
  disconnect(): void {
    console.log("🔌 Disconnecting Janus service");
    
    // Clean up audio stream manager
    audioStreamManager.cleanup();
    
    // Clean up track listeners
    this.clearTrackListeners();
    
    // Clean up PC event listeners
    if (this.sipPlugin?.webrtcStuff?.pc) {
      for (const [event, listener] of this.pcListeners.entries()) {
        this.sipPlugin.webrtcStuff.pc.removeEventListener(event, listener);
      }
    }
    this.pcListeners.clear();
    
    // Reset state
    this.localStream = null;
    this.remoteStream = null;
    this.registered = false;
    this.receivedTracks = [];
    
    // Detach plugin
    if (this.sipPlugin) {
      this.sipPlugin.detach({
        success: () => {
          console.log("SIP plugin detached successfully");
        },
        error: (error: any) => {
          console.error("Error detaching SIP plugin:", error);
        }
      });
      this.sipPlugin = null;
    }
    
    // Destroy Janus session
    if (this.janus) {
      this.janus.destroy({
        success: () => {
          console.log("Janus session destroyed successfully");
        },
        error: (error: any) => {
          console.error("Error destroying Janus session:", error);
        }
      });
      this.janus = null;
    }
  }

  getJanus() {
    return this.janus;
  }

  getSipPlugin() {
    return this.sipPlugin;
  }
}

const janusService = new JanusService();
export default janusService;
