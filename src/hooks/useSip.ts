
import { useState, useEffect, useCallback } from 'react';
import sipService, { SipCredentials, CallState, ConnectionState, RegistrationState } from '@/services/SipService';

interface UseSipOptions {
  autoConnect?: boolean;
  serverUrl?: string;
}

export interface UseSipResult {
  // Connection state
  connectionState: ConnectionState;
  registrationState: RegistrationState;
  callState: CallState;
  error: string | null;
  
  // Call info
  callDuration: string;
  isIncomingCall: boolean;
  incomingCallFrom: string | null;
  callingTo: string | null;
  muted: boolean;
  
  // Media
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  
  // Actions
  connect: (serverUrl: string) => Promise<void>;
  register: (credentials: SipCredentials) => Promise<void>;
  call: (uri: string, isVideo?: boolean) => Promise<void>;
  acceptCall: () => Promise<void>;
  hangup: () => Promise<void>;
  toggleMute: () => void;
  disconnect: () => Promise<void>;
}

export function useSip(options?: UseSipOptions): UseSipResult {
  // State tracking
  const [initialized, setInitialized] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [registrationState, setRegistrationState] = useState<RegistrationState>('unregistered');
  const [callState, setCallState] = useState<CallState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState('00:00');
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [incomingCallFrom, setIncomingCallFrom] = useState<string | null>(null);
  const [callingTo, setCallingTo] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Initialize SIP service
  useEffect(() => {
    if (!initialized) {
      sipService.initialize({ debug: "all" }).then(() => {
        setInitialized(true);
        
        // Auto connect if requested
        if (options?.autoConnect && options?.serverUrl) {
          sipService.connect(options.serverUrl).catch(error => {
            console.error("Auto-connect error:", error);
            setError("Failed to auto-connect: " + error.message);
          });
        }
      }).catch(error => {
        setError("Initialization failed: " + error.message);
      });
    }
  }, [initialized, options?.autoConnect, options?.serverUrl]);

  // Set up event listeners for SIP service
  useEffect(() => {
    // Handle connection state changes
    const handleConnectionChange = () => {
      setConnectionState(sipService.isConnected() ? 'connected' : 'disconnected');
    };
    
    // Handle registration state changes
    const handleRegistrationChange = () => {
      setRegistrationState(sipService.isRegistered() ? 'registered' : 'unregistered');
    };
    
    // Handle incoming calls
    const handleIncomingCall = (data: any) => {
      setIsIncomingCall(true);
      setIncomingCallFrom(data.from);
      setCallState('incoming');
    };
    
    // Handle call connected
    const handleCallConnected = () => {
      setCallState('active');
      setIsIncomingCall(false);
    };
    
    // Handle call ended
    const handleCallEnded = () => {
      setCallState('ended');
      setIsIncomingCall(false);
      setIncomingCallFrom(null);
      setCallingTo(null);
      // Wait a moment and reset to idle
      setTimeout(() => {
        setCallState('idle');
      }, 3000);
    };
    
    // Handle errors
    const handleError = (error: any) => {
      setError(error.message || "An error occurred");
    };
    
    // Handle call duration updates
    const handleDurationChanged = (duration: string) => {
      setCallDuration(duration);
    };
    
    // Handle media streams
    const handleLocalStream = (stream: MediaStream) => {
      setLocalStream(stream);
    };
    
    const handleRemoteStream = (stream: MediaStream) => {
      setRemoteStream(stream);
    };
    
    // Handle state changes
    const handleStateChanged = (state: any) => {
      setConnectionState(state.connection);
      setRegistrationState(state.registration);
      setCallState(state.call);
      setError(state.error);
      setMuted(state.muted);
      setCallingTo(state.callTo);
      setIncomingCallFrom(state.callFrom);
      setIsIncomingCall(state.call === 'incoming');
    };
    
    // Register event handlers
    sipService.on('connected', handleConnectionChange);
    sipService.on('disconnected', handleConnectionChange);
    sipService.on('registered', handleRegistrationChange);
    sipService.on('registrationFailed', handleError);
    sipService.on('incomingCall', handleIncomingCall);
    sipService.on('callConnected', handleCallConnected);
    sipService.on('callEnded', handleCallEnded);
    sipService.on('error', handleError);
    sipService.on('callDurationChanged', handleDurationChanged);
    sipService.on('localStream', handleLocalStream);
    sipService.on('remoteStream', handleRemoteStream);
    sipService.on('stateChanged', handleStateChanged);
    
    // Sync initial state
    const state = sipService.getState();
    handleStateChanged(state);
    setLocalStream(sipService.getLocalStream());
    setRemoteStream(sipService.getRemoteStream());
    
    return () => {
      // Remove event handlers
      sipService.off('connected', handleConnectionChange);
      sipService.off('disconnected', handleConnectionChange);
      sipService.off('registered', handleRegistrationChange);
      sipService.off('registrationFailed', handleError);
      sipService.off('incomingCall', handleIncomingCall);
      sipService.off('callConnected', handleCallConnected);
      sipService.off('callEnded', handleCallEnded);
      sipService.off('error', handleError);
      sipService.off('callDurationChanged', handleDurationChanged);
      sipService.off('localStream', handleLocalStream);
      sipService.off('remoteStream', handleRemoteStream);
      sipService.off('stateChanged', handleStateChanged);
    };
  }, []);
  
  // Actions
  const connect = useCallback(async (serverUrl: string): Promise<void> => {
    try {
      setError(null);
      setConnectionState('connecting');
      await sipService.connect(serverUrl);
    } catch (error: any) {
      setError("Connection failed: " + error.message);
      throw error;
    }
  }, []);
  
  const register = useCallback(async (credentials: SipCredentials): Promise<void> => {
    try {
      setError(null);
      setRegistrationState('registering');
      await sipService.register(credentials);
    } catch (error: any) {
      setError("Registration failed: " + error.message);
      throw error;
    }
  }, []);
  
  const call = useCallback(async (uri: string, isVideo: boolean = false): Promise<void> => {
    try {
      setError(null);
      setCallState('outgoing');
      setCallingTo(uri);
      await sipService.call(uri, isVideo);
    } catch (error: any) {
      setError("Call failed: " + error.message);
      setCallState('idle');
      throw error;
    }
  }, []);
  
  const acceptCall = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      await sipService.acceptCall();
    } catch (error: any) {
      setError("Failed to accept call: " + error.message);
      throw error;
    }
  }, []);
  
  const hangup = useCallback(async (): Promise<void> => {
    try {
      await sipService.hangup();
    } catch (error: any) {
      setError("Hangup failed: " + error.message);
      throw error;
    }
  }, []);
  
  const toggleMute = useCallback((): void => {
    const newMuteState = sipService.toggleMute();
    setMuted(newMuteState);
  }, []);
  
  const disconnect = useCallback(async (): Promise<void> => {
    try {
      await sipService.disconnect();
    } catch (error: any) {
      setError("Disconnect failed: " + error.message);
      throw error;
    }
  }, []);

  return {
    connectionState,
    registrationState,
    callState,
    error,
    callDuration,
    isIncomingCall,
    incomingCallFrom,
    callingTo,
    muted,
    localStream,
    remoteStream,
    connect,
    register,
    call,
    acceptCall,
    hangup,
    toggleMute,
    disconnect
  };
}
