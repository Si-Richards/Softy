import { JanusClient } from './janus/core/JanusClient';
import { SipClient, SipCredentials } from './janus/sip/SipClient';
import { MediaManager } from './janus/media/MediaManager';
import { StateManager } from './janus/state/StateManager';

/**
 * SipService - Main service for SIP functionality
 * Integrates all components and provides a clean API
 */
class SipService {
  private janusClient: JanusClient;
  private sipClient: SipClient;
  private mediaManager: MediaManager;
  private stateManager: StateManager;
  private initialized: boolean = false;
  private eventHandlers: Map<string, Function[]> = new Map();
  
  constructor() {
    this.janusClient = new JanusClient();
    this.mediaManager = new MediaManager();
    this.stateManager = new StateManager();
    this.sipClient = new SipClient(this.janusClient);
    
    this.setupEventListeners();
  }

  /**
   * Set up internal event listeners
   */
  private setupEventListeners(): void {
    // Janus connection events
    this.janusClient.on('connected', () => {
      console.log('Janus connected');
      this.stateManager.setConnectionState('connected');
      this.notifyEvent('connected');
    });
    
    this.janusClient.on('disconnected', () => {
      console.log('Janus disconnected');
      this.stateManager.setConnectionState('disconnected');
      this.notifyEvent('disconnected');
    });
    
    // SIP client events
    this.sipClient.on('registered', () => {
      console.log('SIP registered');
      this.stateManager.setRegistrationState('registered');
      this.notifyEvent('registered');
    });
    
    this.sipClient.on('registrationFailed', (error: any) => {
      console.error('SIP registration failed', error);
      this.stateManager.setRegistrationState('failed', error.reason || error.message || 'Registration failed');
      this.notifyEvent('registrationFailed', error);
    });
    
    this.sipClient.on('incomingCall', (data: any) => {
      console.log('Incoming call', data);
      this.stateManager.startIncomingCall(data.from, data.jsep);
      this.notifyEvent('incomingCall', data);
    });
    
    this.sipClient.on('callAccepted', () => {
      console.log('Call accepted');
      this.stateManager.setCallState('active');
      this.notifyEvent('callConnected');
    });
    
    this.sipClient.on('callEnded', (data: any) => {
      console.log('Call ended', data);
      this.stateManager.setCallState('ended', { error: data.reason });
      this.mediaManager.clearStreams();
      this.notifyEvent('callEnded', data);
    });
    
    this.sipClient.on('error', (error: any) => {
      console.error('SIP error', error);
      this.stateManager.setError(error.message || 'SIP error');
      this.notifyEvent('error', error);
    });
    
    // Media events
    this.sipClient.on('localstream', (stream: MediaStream) => {
      console.log('Got local stream');
      this.mediaManager.setLocalStream(stream);
      this.notifyEvent('localStream', stream);
    });
    
    this.sipClient.on('remotestream', (stream: MediaStream) => {
      console.log('Got remote stream');
      this.mediaManager.setRemoteStream(stream);
      this.notifyEvent('remoteStream', stream);
    });
    
    this.sipClient.on('cleanup', () => {
      console.log('Media cleanup');
      this.mediaManager.clearStreams();
    });
    
    // State events
    this.stateManager.on('callDurationChanged', (duration: string) => {
      this.notifyEvent('callDurationChanged', duration);
    });
  }

  /**
   * Initialize the SIP service
   */
  async initialize(options: { debug?: boolean | string }): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      await this.janusClient.init(options.debug || "all");
      this.initialized = true;
      console.log('SIP service initialized');
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to initialize SIP service:', error);
      this.stateManager.setError('Failed to initialize: ' + error);
      return Promise.reject(error);
    }
  }

  /**
   * Connect to the Janus server
   */
  async connect(serverUrl: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize({ debug: "all" });
    }
    
    this.stateManager.setConnectionState('connecting');
    
    try {
      await this.janusClient.connect({
        server: serverUrl,
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" }
        ],
        keepaliveInterval: 30000
      });
      
      // Attach to the SIP plugin
      await this.sipClient.attachSipPlugin();
      
      return Promise.resolve();
    } catch (error) {
      this.stateManager.setConnectionState('disconnected');
      this.stateManager.setError('Connection failed: ' + error);
      return Promise.reject(error);
    }
  }

  /**
   * Register with the SIP server
   */
  async register(credentials: SipCredentials): Promise<void> {
    if (!this.janusClient.isConnected()) {
      throw new Error('Not connected to Janus server');
    }
    
    this.stateManager.setRegistrationState('registering');
    
    try {
      await this.sipClient.register({
        credentials,
        forceUdp: true,
        refresh: true
      });
      
      // Registration success will be handled by event listener
      return Promise.resolve();
    } catch (error) {
      this.stateManager.setRegistrationState('failed', 'Registration failed: ' + error);
      return Promise.reject(error);
    }
  }

  /**
   * Make a call
   */
  async call(uri: string, isVideoCall: boolean = false): Promise<void> {
    if (!this.sipClient.isRegistered()) {
      throw new Error('Not registered with SIP server');
    }
    
    this.stateManager.startOutgoingCall(uri, isVideoCall);
    
    try {
      await this.sipClient.call({
        uri,
        isVideo: isVideoCall
      });
      
      return Promise.resolve();
    } catch (error) {
      this.stateManager.setCallState('ended', { error: 'Call failed: ' + error });
      return Promise.reject(error);
    }
  }

  /**
   * Accept an incoming call
   */
  async acceptCall(): Promise<void> {
    const state = this.stateManager.getState();
    
    if (state.call !== 'incoming' || !state.currentJsep) {
      throw new Error('No incoming call to accept');
    }
    
    try {
      await this.sipClient.acceptCall(state.currentJsep);
      return Promise.resolve();
    } catch (error) {
      this.stateManager.setCallState('ended', { error: 'Failed to accept call: ' + error });
      return Promise.reject(error);
    }
  }

  /**
   * End a call
   */
  async hangup(): Promise<void> {
    try {
      await this.sipClient.hangup();
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    } finally {
      this.stateManager.setCallState('ended');
    }
  }

  /**
   * Toggle microphone mute
   */
  toggleMute(): boolean {
    const currentState = this.stateManager.getState();
    const newMuteState = !currentState.muted;
    
    this.mediaManager.setAudioMuted(newMuteState);
    this.stateManager.setMuted(newMuteState);
    
    return newMuteState;
  }

  /**
   * Disconnect from the server
   */
  async disconnect(): Promise<void> {
    // If in a call, hang up first
    if (this.stateManager.getState().call !== 'idle' && 
        this.stateManager.getState().call !== 'ended') {
      try {
        await this.hangup();
      } catch (error) {
        console.error('Error hanging up call during disconnect:', error);
      }
    }
    
    // Unregister if registered
    if (this.sipClient.isRegistered()) {
      try {
        await this.sipClient.unregister();
      } catch (error) {
        console.error('Error unregistering during disconnect:', error);
      }
    }
    
    // Clear all media
    this.mediaManager.clearStreams();
    
    // Disconnect from Janus
    try {
      await this.janusClient.disconnect();
      this.stateManager.resetState();
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get SIP state
   */
  getState() {
    return this.stateManager.getState();
  }

  /**
   * Get local media stream
   */
  getLocalStream(): MediaStream | null {
    return this.mediaManager.getLocalStream();
  }

  /**
   * Get remote media stream
   */
  getRemoteStream(): MediaStream | null {
    return this.mediaManager.getRemoteStream();
  }

  /**
   * Check if registered with the SIP server
   */
  isRegistered(): boolean {
    return this.sipClient.isRegistered();
  }

  /**
   * Check if connected to the Janus server
   */
  isConnected(): boolean {
    return this.janusClient.isConnected();
  }

  /**
   * Check if currently in a call
   */
  isInCall(): boolean {
    const state = this.stateManager.getState();
    return state.call !== 'idle' && state.call !== 'ended';
  }

  /**
   * Register event handlers
   */
  on(event: string, callback: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    
    this.eventHandlers.get(event)!.push(callback);
  }

  /**
   * Remove event handlers
   */
  off(event: string, callback?: Function): void {
    if (!this.eventHandlers.has(event)) {
      return;
    }
    
    if (!callback) {
      this.eventHandlers.delete(event);
      return;
    }
    
    const handlers = this.eventHandlers.get(event)!;
    const index = handlers.indexOf(callback);
    
    if (index !== -1) {
      handlers.splice(index, 1);
    }
    
    if (handlers.length === 0) {
      this.eventHandlers.delete(event);
    }
  }

  /**
   * Notify event handlers
   */
  private notifyEvent(event: string, ...args: any[]): void {
    if (!this.eventHandlers.has(event)) {
      return;
    }
    
    for (const callback of this.eventHandlers.get(event)!) {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    }
  }
}

// Create and export a singleton instance
const sipService = new SipService();
export default sipService;

// Re-export types - fixed with 'export type'
export type { SipCredentials } from './janus/sip/SipClient';
export type { AudioSettings, VideoSettings } from './janus/media/MediaManager';
export type { ConnectionState, RegistrationState, CallState } from './janus/state/StateManager';
