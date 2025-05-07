
import { EventEmitter } from '../core/EventEmitter';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected';
export type RegistrationState = 'unregistered' | 'registering' | 'registered' | 'failed';
export type CallState = 'idle' | 'outgoing' | 'incoming' | 'ringing' | 'active' | 'holding' | 'ended';

export interface SipState {
  connection: ConnectionState;
  registration: RegistrationState;
  call: CallState;
  error: string | null;
  currentCallId: string | null;
  lastDialed: string | null;
  callFrom: string | null;
  callTo: string | null;
  isVideoCall: boolean;
  muted: boolean;
  currentJsep: any;
  callStartTime: Date | null;
  callEndTime: Date | null;
}

/**
 * StateManager - Centralized state management for the SIP client
 */
export class StateManager extends EventEmitter {
  private state: SipState;
  private callDurationTimer: number | null = null;
  private callDuration: number = 0;

  constructor() {
    super();
    this.state = {
      connection: 'disconnected',
      registration: 'unregistered',
      call: 'idle',
      error: null,
      currentCallId: null,
      lastDialed: null,
      callFrom: null,
      callTo: null,
      isVideoCall: false,
      muted: false,
      currentJsep: null,
      callStartTime: null,
      callEndTime: null
    };
  }

  /**
   * Get the current state
   */
  getState(): SipState {
    return { ...this.state };
  }

  /**
   * Update the connection state
   */
  setConnectionState(state: ConnectionState): void {
    const oldState = this.state.connection;
    this.state.connection = state;
    
    if (oldState !== state) {
      this.emit('connectionStateChanged', state, oldState);
      this.emit('stateChanged', this.getState());
    }
  }

  /**
   * Update the registration state
   */
  setRegistrationState(state: RegistrationState, error: string | null = null): void {
    const oldState = this.state.registration;
    this.state.registration = state;
    
    if (error !== undefined) {
      this.state.error = error;
    }
    
    if (oldState !== state) {
      this.emit('registrationStateChanged', state, oldState);
      this.emit('stateChanged', this.getState());
    }
  }

  /**
   * Update the call state
   */
  setCallState(state: CallState, params: Partial<SipState> = {}): void {
    const oldState = this.state.call;
    this.state.call = state;
    
    // Update any additional state params
    Object.assign(this.state, params);
    
    // Handle call timers
    if (state === 'active' && oldState !== 'active') {
      this.startCallTimer();
    } else if (state !== 'active' && state !== 'holding' && (oldState === 'active' || oldState === 'holding')) {
      this.stopCallTimer();
    }
    
    if (oldState !== state) {
      this.emit('callStateChanged', state, oldState);
      this.emit('stateChanged', this.getState());
    }
  }

  /**
   * Set error state
   */
  setError(error: string | null): void {
    this.state.error = error;
    if (error) {
      this.emit('error', error);
    }
    this.emit('stateChanged', this.getState());
  }

  /**
   * Set muted state
   */
  setMuted(muted: boolean): void {
    this.state.muted = muted;
    this.emit('mutedChanged', muted);
    this.emit('stateChanged', this.getState());
  }

  /**
   * Log an outgoing call
   */
  startOutgoingCall(destination: string, isVideoCall: boolean = false): void {
    this.state.callTo = destination;
    this.state.lastDialed = destination;
    this.state.callFrom = null;
    this.state.isVideoCall = isVideoCall;
    this.setCallState('outgoing');
  }

  /**
   * Log an incoming call
   */
  startIncomingCall(from: string, jsep: any): void {
    this.state.callFrom = from;
    this.state.callTo = null;
    this.state.currentJsep = jsep;
    this.setCallState('incoming');
  }

  /**
   * Start a call timer
   */
  private startCallTimer(): void {
    this.callDuration = 0;
    this.state.callStartTime = new Date();
    
    this.stopCallTimer(); // Clear any existing timer
    
    // Update call duration every second
    this.callDurationTimer = window.setInterval(() => {
      this.callDuration++;
      this.emit('callDurationChanged', this.getFormattedDuration());
    }, 1000);
  }

  /**
   * Stop the call timer
   */
  private stopCallTimer(): void {
    if (this.callDurationTimer) {
      clearInterval(this.callDurationTimer);
      this.callDurationTimer = null;
    }
    
    if (this.state.callStartTime && !this.state.callEndTime) {
      this.state.callEndTime = new Date();
    }
  }

  /**
   * Get the call duration in seconds
   */
  getCallDuration(): number {
    return this.callDuration;
  }

  /**
   * Get a formatted duration string (mm:ss)
   */
  getFormattedDuration(): string {
    const minutes = Math.floor(this.callDuration / 60);
    const seconds = this.callDuration % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Reset the state to defaults
   */
  resetState(): void {
    this.stopCallTimer();
    
    this.state = {
      connection: 'disconnected',
      registration: 'unregistered',
      call: 'idle',
      error: null,
      currentCallId: null,
      lastDialed: this.state.lastDialed, // preserve this
      callFrom: null,
      callTo: null,
      isVideoCall: false,
      muted: false,
      currentJsep: null,
      callStartTime: null,
      callEndTime: null
    };
    
    this.emit('stateChanged', this.getState());
  }
}
