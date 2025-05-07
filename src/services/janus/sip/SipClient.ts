
import { EventEmitter } from '../core/EventEmitter';
import { JanusClient, JanusHandle } from '../core/JanusClient';

export interface SipCredentials {
  username: string;
  password: string;
  sipHost: string;
  display_name?: string;
  authuser?: string;
  transport?: 'udp' | 'tcp' | 'tls';
  register_ttl?: number;
}

export interface SipRegistrationOptions {
  credentials: SipCredentials;
  forceUdp?: boolean;
  forceTcp?: boolean;
  sips?: boolean;
  rfc2543_cancel?: boolean;
  refresh?: boolean;
}

export interface CallOptions {
  uri: string;
  isVideo?: boolean;
  autoAccept?: boolean;
  headers?: Record<string, string>;
}

export interface SipPluginMessage {
  result?: {
    event?: string;
    username?: string;
    code?: string;
    reason?: string;
    displayname?: string;
    call_id?: string;
    referrer?: string;
    srtp?: string;
    srtpProfile?: string;
  };
  error?: string;
  error_code?: number;
}

export class SipClient extends EventEmitter {
  private janusClient: JanusClient;
  private pluginHandle: JanusHandle | null = null;
  private registered: boolean = false;
  private calling: boolean = false;
  private incomingCall: boolean = false;
  private currentCredentials: SipCredentials | null = null;
  private opaqueId: string;

  constructor(janusClient: JanusClient) {
    super();
    this.janusClient = janusClient;
    this.opaqueId = `sip-${Math.floor(Math.random() * 10000)}`;
  }

  /**
   * Attach to the SIP plugin
   */
  async attachSipPlugin(): Promise<void> {
    if (!this.janusClient.isConnected()) {
      throw new Error("Cannot attach SIP plugin: Janus not connected");
    }
    
    try {
      this.pluginHandle = await this.janusClient.attachPlugin(
        'janus.plugin.sip',
        this.opaqueId,
        {
          onmessage: (msg: any, jsep: any) => this.handleSipMessage(msg, jsep),
          onlocalstream: (stream: MediaStream) => this.emit('localstream', stream),
          onremotestream: (stream: MediaStream) => this.emit('remotestream', stream),
          oncleanup: () => {
            this.emit('cleanup');
            this.calling = false;
            this.incomingCall = false;
          }
        }
      );
      
      this.emit('pluginAttached');
      return;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Register with the SIP server
   */
  async register(options: SipRegistrationOptions): Promise<void> {
    if (!this.pluginHandle) {
      throw new Error("SIP plugin not attached");
    }
    
    const { credentials } = options;
    this.currentCredentials = credentials;
    
    // Following format from Janus SIP demo
    let request: any = {
      request: "register",
      username: this.formatSipUri(credentials),
    };
    
    // Add optional fields based on provided credentials
    if (credentials.display_name) {
      request.display_name = credentials.display_name;
    }
    
    // Add authentication if password is provided
    if (credentials.password) {
      request.secret = credentials.password;
    }
    
    // Add auth username if provided
    if (credentials.authuser) {
      request.authuser = credentials.authuser;
    }
    
    // Set SIP proxy
    let proxy = `sip:${credentials.sipHost}`;
    if (credentials.transport && credentials.transport !== 'udp') {
      proxy += `;transport=${credentials.transport}`;
    }
    request.proxy = proxy;
    
    // Set additional options
    request.refresh = options.refresh !== false;
    request.register = true;
    
    // Transport options (following Janus SIP demo format)
    request.force_udp = options.forceUdp === true;
    request.force_tcp = options.forceTcp === true;
    request.sips = options.sips === true;
    
    // Add RFC 2543 cancel if requested
    if (options.rfc2543_cancel !== undefined) {
      request.rfc2543_cancel = options.rfc2543_cancel;
    }
    
    // Add register TTL if specified
    if (credentials.register_ttl) {
      request.register_ttl = credentials.register_ttl;
    }

    // Add headers (like User-Agent)
    request.headers = {
      "User-Agent": "Janus SIP Client",
      "X-Janus-SIP-Client": "Lovable WebRTC"
    };
    
    console.log("SIP Registration request:", request);
    
    return new Promise<void>((resolve, reject) => {
      this.pluginHandle!.send({
        message: request,
        success: () => {
          // This only means the message was sent successfully
          // Wait for the onmessage event to confirm registration
          console.log("SIP registration request sent");
          resolve();
        },
        error: (error: any) => {
          console.error("Error sending SIP registration:", error);
          this.emit('registrationFailed', error);
          reject(error);
        }
      });
    });
  }

  /**
   * Format SIP URI according to the Janus SIP demo
   */
  private formatSipUri(credentials: SipCredentials): string {
    const { username, sipHost } = credentials;
    
    // Clean up the username to remove any existing SIP URI prefixes
    const cleanUsername = username.replace(/^sip:/, '').split('@')[0];
    
    // Return the username in the format expected by the SIP server
    return cleanUsername;
  }

  /**
   * Make a call to the specified URI
   */
  async call(options: CallOptions): Promise<void> {
    if (!this.pluginHandle) {
      throw new Error("SIP plugin not attached");
    }
    
    if (!this.registered) {
      throw new Error("Not registered with SIP server");
    }
    
    if (this.calling) {
      throw new Error("Already in a call");
    }
    
    const { uri, isVideo = false, headers = {}, autoAccept = true } = options;
    
    // Format the URI if it doesn't have a sip: prefix
    const formattedUri = uri.startsWith('sip:') ? uri : `sip:${uri}`;
    
    return new Promise<void>((resolve, reject) => {
      // First get user media
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: isVideo
      };
      
      // Get the user media first
      navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          console.log("Got local media stream for call", stream);
          
          // Ensure audio tracks are enabled
          stream.getAudioTracks().forEach(track => {
            track.enabled = true;
          });
          
          // Create the offer - use the exact format from Janus SIP demo
          this.pluginHandle!.createOffer({
            media: {
              audioSend: true, 
              audioRecv: true,
              videoSend: isVideo, 
              videoRecv: isVideo
            },
            success: (jsep: any) => {
              console.log("Got SDP offer", jsep);
              
              // Prepare the call request
              const callRequest = {
                request: "call",
                uri: formattedUri,
                headers: {
                  ...headers,
                  "User-Agent": "Janus SIP Client",
                  "X-Janus-SIP-Client": "Lovable WebRTC"
                },
                autoaccept: autoAccept,
                srtp: "sdes_optional"
              };
              
              this.pluginHandle!.send({
                message: callRequest,
                jsep: jsep,
                success: () => {
                  console.log(`Calling ${uri}`);
                  this.calling = true;
                  resolve();
                },
                error: (error: any) => {
                  console.error("Error making call:", error);
                  reject(error);
                }
              });
            },
            error: (error: any) => {
              console.error("WebRTC error:", error);
              reject(error);
            }
          });
        })
        .catch((error) => {
          console.error("Media error:", error);
          reject(error);
        });
    });
  }

  /**
   * Accept an incoming call
   */
  async acceptCall(jsep: any): Promise<void> {
    if (!this.pluginHandle) {
      throw new Error("SIP plugin not attached");
    }
    
    if (!this.incomingCall) {
      throw new Error("No incoming call to accept");
    }
    
    return new Promise<void>((resolve, reject) => {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: true
      };
      
      navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          // Ensure audio tracks are enabled
          stream.getAudioTracks().forEach(track => {
            track.enabled = true;
          });
          
          this.pluginHandle!.createAnswer({
            jsep: jsep,
            media: {
              audioSend: true, 
              audioRecv: true,
              videoSend: false, 
              videoRecv: true
            },
            success: (ourjsep: any) => {
              const acceptRequest = {
                request: "accept",
                headers: {
                  "User-Agent": "Janus SIP Client",
                  "X-Janus-SIP-Client": "Lovable WebRTC"
                }
              };
              
              this.pluginHandle!.send({
                message: acceptRequest,
                jsep: ourjsep,
                success: () => {
                  this.calling = true;
                  this.incomingCall = false;
                  resolve();
                },
                error: (error: any) => {
                  console.error("Error accepting call:", error);
                  reject(error);
                }
              });
            },
            error: (error: any) => {
              console.error("WebRTC error:", error);
              reject(error);
            }
          });
        })
        .catch((error) => {
          console.error("Media error:", error);
          reject(error);
        });
    });
  }

  /**
   * End the current call
   */
  async hangup(): Promise<void> {
    if (!this.pluginHandle) {
      throw new Error("SIP plugin not attached");
    }
    
    if (!this.calling && !this.incomingCall) {
      // No call in progress
      return Promise.resolve();
    }
    
    return new Promise<void>((resolve, reject) => {
      this.pluginHandle!.send({
        message: { request: "hangup" },
        success: () => {
          this.calling = false;
          this.incomingCall = false;
          resolve();
        },
        error: (error: any) => {
          console.error("Error hanging up:", error);
          reject(error);
        }
      });
    });
  }

  /**
   * Unregister from the SIP server
   */
  async unregister(): Promise<void> {
    if (!this.pluginHandle) {
      return Promise.resolve();
    }
    
    if (!this.registered) {
      return Promise.resolve();
    }
    
    return new Promise<void>((resolve, reject) => {
      this.pluginHandle!.send({
        message: { request: "unregister" },
        success: () => {
          this.registered = false;
          this.currentCredentials = null;
          resolve();
        },
        error: (error: any) => {
          console.error("Error unregistering:", error);
          reject(error);
        }
      });
    });
  }

  /**
   * Send DTMF tones during a call
   */
  async sendDtmf(tones: string): Promise<void> {
    if (!this.pluginHandle) {
      throw new Error("SIP plugin not attached");
    }
    
    if (!this.calling) {
      throw new Error("Not in a call");
    }
    
    return new Promise<void>((resolve, reject) => {
      this.pluginHandle!.send({
        message: {
          request: "dtmf_info",
          digit: tones
        },
        success: () => {
          resolve();
        },
        error: (error: any) => {
          console.error("Error sending DTMF:", error);
          reject(error);
        }
      });
    });
  }

  /**
   * Handle SIP messages from the Janus plugin
   */
  private handleSipMessage(msg: SipPluginMessage, jsep: any): void {
    console.log("SIP message received:", msg, jsep);
    
    // Handle jsep offers/answers
    if (jsep) {
      console.log("Handling remote jsep", jsep);
      this.pluginHandle!.handleRemoteJsep({ jsep: jsep });
    }
    
    // Handle SIP plugin messages
    if (msg.result) {
      const result = msg.result;
      const event = result.event;
      
      switch (event) {
        case 'registration_failed':
          this.registered = false;
          const code = result.code || 'unknown';
          const reason = result.reason || 'Unknown error';
          console.error(`SIP registration failed: ${code} - ${reason}`);
          this.emit('registrationFailed', { code, reason });
          break;
          
        case 'registered':
          this.registered = true;
          console.log("Successfully registered with SIP server", result);
          this.emit('registered', result);
          break;
          
        case 'calling':
          console.log("Call in progress", result);
          this.emit('calling', result);
          break;
          
        case 'incomingcall':
          console.log("Incoming call from", result.username);
          this.incomingCall = true;
          this.emit('incomingCall', {
            from: result.username,
            displayName: result.displayname,
            jsep: jsep
          });
          break;
          
        case 'accepted':
          console.log("Call accepted", result);
          this.emit('callAccepted', result);
          break;
          
        case 'progress':
          console.log("Call in progress", result);
          this.emit('callProgress', result);
          break;
          
        case 'hangup':
          console.log("Call hung up", result);
          this.calling = false;
          this.incomingCall = false;
          this.emit('callEnded', {
            reason: result.reason || 'Call ended',
            code: result.code
          });
          break;
          
        default:
          console.log(`Unhandled SIP event: ${event}`, result);
          this.emit('sipEvent', { event, data: result });
      }
    }
    
    // Handle errors
    if (msg.error) {
      console.error("SIP plugin error:", msg.error, msg.error_code);
      this.emit('error', {
        message: msg.error,
        code: msg.error_code
      });
    }
  }

  /**
   * Check if registered with SIP server
   */
  isRegistered(): boolean {
    return this.registered;
  }

  /**
   * Check if currently in a call
   */
  isInCall(): boolean {
    return this.calling || this.incomingCall;
  }

  /**
   * Get current credentials
   */
  getCredentials(): SipCredentials | null {
    return this.currentCredentials;
  }

  /**
   * Get the SIP plugin handle
   */
  getPluginHandle(): JanusHandle | null {
    return this.pluginHandle;
  }
}
