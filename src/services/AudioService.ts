import { AudioOutputHandler } from './janus/utils/audioOutputHandler';
import userInteractionService from './UserInteractionService';

/**
 * AudioService centralizes the management of audio elements and tracks
 * to prevent conflicts and ensure proper audio output.
 */
class AudioService {
  private static instance: AudioService;
  private audioElement: HTMLAudioElement | null = null;
  private analyticsInterval: number | null = null;
  private currentAudioOutput: string | null = null;
  private audioTrackPatched = false;
  private audioContext: AudioContext | null = null;
  private audioAnalyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private isAudioFlowing = false;
  private lastAudioFlowCheck = 0;
  private audioInitialized = false;
  private streamToAttachOnInitialization: MediaStream | null = null;
  private autoplayAttempted = false;
  private enabledByUserInteraction = false;
  
  private constructor() {
    this.getPreferredAudioOutput();
    
    // Early initialization of audio element on service creation
    this.initializeAudio();
    
    // Register for the first user interaction event
    userInteractionService.onUserInteraction(() => {
      console.log("AudioService: Responding to user interaction");
      this.enabledByUserInteraction = true;
      
      // Try to start audio context if it exists
      this.initializeAudioContext();
      
      // If we have a pending stream to attach, do so now
      if (this.streamToAttachOnInitialization) {
        console.log("AudioService: Attaching pending stream after user interaction");
        this.attachStream(this.streamToAttachOnInitialization);
        this.streamToAttachOnInitialization = null;
      }
      
      // Try to force play audio if there's an active element
      this.forcePlayAudio().catch(e => console.warn("Auto-play after user interaction failed:", e));
    });
  }
  
  /**
   * Initialize the audio context for audio analysis
   */
  private initializeAudioContext(): void {
    // Create audio context if browser supports it and it doesn't exist yet
    if (!this.audioContext) {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          this.audioContext = new AudioContext();
          
          // Resume audio context if it's suspended (important for Safari)
          if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(e => {
              console.warn("Failed to resume AudioContext:", e);
            });
          }
          
          this.audioAnalyser = this.audioContext.createAnalyser();
          this.audioAnalyser.fftSize = 256;
          const bufferLength = this.audioAnalyser.frequencyBinCount;
          this.dataArray = new Uint8Array(bufferLength);
          
          console.log("Audio analyzer initialized", {
            state: this.audioContext.state,
            sampleRate: this.audioContext.sampleRate
          });
        }
      } catch (e) {
        console.warn("Could not initialize audio analyzer:", e);
      }
    }
  }
  
  /**
   * Initialize the audio element early before it's needed
   */
  private initializeAudio(): void {
    if (this.audioInitialized) return;
    
    // Create the singleton audio element
    this.getAudioElement();
    
    // Set up audio analytics
    this.setupAudioAnalytics();
    
    // Initialize audio context
    this.initializeAudioContext();
    
    this.audioInitialized = true;
  }
  
  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }
  
  /**
   * Get the preferred audio output device from localStorage
   */
  private getPreferredAudioOutput(): string | null {
    this.currentAudioOutput = localStorage.getItem('selectedAudioOutput');
    return this.currentAudioOutput;
  }
  
  /**
   * Sets up an audio analyzer to verify that audio is flowing
   */
  private setupAudioAnalyzer(): void {
    try {
      // Create audio context if browser supports it
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        this.audioContext = new AudioContext();
        this.audioAnalyser = this.audioContext.createAnalyser();
        this.audioAnalyser.fftSize = 256;
        const bufferLength = this.audioAnalyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);
        
        console.log("Audio analyzer initialized");
      }
    } catch (e) {
      console.warn("Could not initialize audio analyzer:", e);
    }
  }
  
  /**
   * Analyzes audio data to detect if audio is actually flowing
   * @returns true if audio data is detected, false otherwise
   */
  private analyzeAudioFlow(): boolean {
    if (!this.audioAnalyser || !this.dataArray || !this.audioContext) {
      return false; // Can't analyze without analyzer
    }
    
    // Don't check too often
    const now = Date.now();
    if (now - this.lastAudioFlowCheck < 500) {
      return this.isAudioFlowing;
    }
    
    this.lastAudioFlowCheck = now;
    
    // Get frequency data
    this.audioAnalyser.getByteFrequencyData(this.dataArray);
    
    // Check if we have any non-zero values in the frequency data
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    
    this.isAudioFlowing = sum > 0;
    if (this.isAudioFlowing) {
      console.log("Audio is flowing, signal strength:", sum);
    }
    
    return this.isAudioFlowing;
  }
  
  /**
   * Set up audio analytics to monitor the state of the audio element
   */
  private setupAudioAnalytics(): void {
    if (this.analyticsInterval) {
      clearInterval(this.analyticsInterval);
    }
    
    this.analyticsInterval = window.setInterval(() => {
      if (this.audioElement) {
        const audioStatus = {
          volume: this.audioElement.volume,
          muted: this.audioElement.muted,
          paused: this.audioElement.paused,
          currentTime: this.audioElement.currentTime,
          readyState: this.audioElement.readyState,
          networkState: this.audioElement.networkState,
          hasAudioTracks: this.audioElement.srcObject ? 
            (this.audioElement.srcObject as MediaStream).getAudioTracks().length : 0,
          audioFlowing: this.analyzeAudioFlow(),
          userHasInteracted: userInteractionService.userHasInteracted(),
          enabledByUserInteraction: this.enabledByUserInteraction
        };
        
        console.log("Audio element detailed status:", audioStatus);
        
        // If we have user interaction and audio is paused, try to play
        if (audioStatus.userHasInteracted && audioStatus.paused && 
            audioStatus.hasAudioTracks > 0 && !this.autoplayAttempted) {
          console.log("Auto-fixing: User has interacted but audio is paused with tracks");
          this.autoplayAttempted = true;
          this.forcePlayAudio().catch(e => console.warn("Auto-fix failed:", e));
        }
      }
    }, 5000); // Check less frequently to reduce console noise
  }
  
  /**
   * Creates or gets the singleton audio element for playing remote audio
   * @returns The HTML audio element used for remote audio playback
   */
  public getAudioElement(): HTMLAudioElement {
    if (!this.audioElement) {
      // Look for existing element first
      const existingElement = document.querySelector('audio#remoteAudio') as HTMLAudioElement;
      if (existingElement) {
        console.log("Using existing audio element for remote audio");
        this.audioElement = existingElement;
      } else {
        // Create a new audio element if none exists
        console.log("Creating new audio element for remote audio");
        const newAudioElement = document.createElement('audio');
        newAudioElement.id = 'remoteAudio';
        newAudioElement.autoplay = true;
        newAudioElement.controls = false; // Hidden controls by default
        newAudioElement.style.display = 'none';
        newAudioElement.volume = 1.0;
        newAudioElement.setAttribute('playsinline', ''); // Important for iOS
        newAudioElement.setAttribute('webkit-playsinline', ''); // For older iOS
        
        // Important: Add to document body so it's part of the DOM
        document.body.appendChild(newAudioElement);
        this.audioElement = newAudioElement;
      }
      
      // Add event listeners to monitor audio element state
      this.setupAudioElementListeners();
    }
    
    return this.audioElement;
  }
  
  /**
   * Set up listeners to monitor the audio element state
   */
  private setupAudioElementListeners(): void {
    if (!this.audioElement) return;
    
    this.audioElement.addEventListener('play', () => {
      console.log("Audio element started playing");
      this.autoplayAttempted = true;
    });
    
    this.audioElement.addEventListener('pause', () => {
      console.warn("Audio element paused - may need user interaction");
      
      // Only try to auto-resume if we have user interaction
      if (userInteractionService.userHasInteracted()) {
        // Try to auto-resume playback
        setTimeout(() => {
          if (this.audioElement && 
              this.audioElement.paused && 
              this.audioElement.srcObject &&
              (this.audioElement.srcObject as MediaStream).getAudioTracks().length > 0) {
            console.log("Attempting to resume paused audio with user interaction");
            this.forcePlayAudio().catch(e => console.warn("Resume failed:", e));
          }
        }, 500);
      } else {
        console.log("Audio paused but no user interaction yet - waiting for interaction");
      }
    });
    
    this.audioElement.addEventListener('ended', () => {
      console.warn("Audio element playback ended unexpectedly");
    });
    
    this.audioElement.addEventListener('error', (e) => {
      console.error("Audio element error:", e);
    });
    
    // For iOS/Safari - listen for audio interruptions
    this.audioElement.addEventListener('suspend', () => {
      console.warn("Audio playback suspended (iOS audio interruption)");
      
      if (userInteractionService.userHasInteracted()) {
        setTimeout(() => this.forcePlayAudio().catch(e => console.warn("Resume after suspend failed:", e)), 500);
      }
    });
    
    // Important for Safari - can reveal autoplay issues
    this.audioElement.addEventListener('waiting', () => {
      console.warn("Audio element waiting for data");
    });
    
    // Get early detection of autoplay issues
    this.audioElement.addEventListener('canplay', () => {
      console.log("Audio element can play - readyState:", this.audioElement?.readyState);
      
      // If we have user interaction and audio is ready but paused, try to play
      if (this.audioElement && 
          this.audioElement.paused && 
          userInteractionService.userHasInteracted() &&
          !this.autoplayAttempted) {
        console.log("Audio can play and we have user interaction - attempting playback");
        this.forcePlayAudio().catch(e => console.warn("Canplay autostart failed:", e));
      }
    });
  }
  
  /**
   * Directly attach WebRTC audio track to the audio element
   * This is more reliable than using a MediaStream in some browsers
   * @param track Audio track from WebRTC
   */
  public attachAudioTrack(track: MediaStreamTrack): boolean {
    if (!track || track.kind !== 'audio') {
      console.warn("Invalid audio track provided");
      return false;
    }
    
    console.log("Attaching individual audio track:", {
      enabled: track.enabled,
      muted: track.muted,
      readyState: track.readyState,
      id: track.id,
      kind: track.kind,
      label: track.label
    });
    
    // Ensure track is enabled
    if (!track.enabled) {
      console.log("Enabling disabled audio track");
      track.enabled = true;
    }
    
    // Create a new stream with just this track
    const stream = new MediaStream([track]);
    return this.attachStream(stream);
  }
  
  /**
   * Attach a media stream to the audio element, ensuring proper audio output routing
   * @param stream The media stream containing audio tracks
   * @returns True if successfully attached, false otherwise
   */
  public attachStream(stream: MediaStream | null): boolean {
    if (!stream) {
      console.warn("No stream provided to attachStream");
      return false;
    }
    
    // If audio isn't initialized yet or we don't have user interaction,
    // store stream for later attachment
    if (!this.audioInitialized || !userInteractionService.userHasInteracted()) {
      console.log("Storing stream for later attachment after user interaction");
      this.streamToAttachOnInitialization = stream;
      
      // If the audio element already exists, attach the stream now but don't play
      if (this.audioElement) {
        console.log("Setting stream to existing audio element (won't play until user interacts)");
        this.audioElement.srcObject = stream;
      }
      
      return true;
    }
    
    const audioElement = this.getAudioElement();
    
    // Log detailed stream information
    console.log("Attaching stream to audio element:", {
      audioTracks: stream.getAudioTracks().length,
      videoTracks: stream.getVideoTracks().length,
      streamId: stream.id,
      userHasInteracted: userInteractionService.userHasInteracted()
    });
    
    // Log audio track details
    stream.getAudioTracks().forEach((track, idx) => {
      console.log(`Audio track ${idx}:`, {
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState,
        id: track.id,
        kind: track.kind,
        label: track.label
      });
      
      // Ensure tracks are enabled
      if (!track.enabled) {
        console.log("Enabling disabled audio track");
        track.enabled = true;
      }
      
      // Patch audio track for Safari browser if needed
      if (!this.audioTrackPatched) {
        this.patchAudioTrack(track);
        this.audioTrackPatched = true;
      }
    });
    
    // Connect the audio analyzer if available
    if (this.audioContext && this.audioAnalyser && stream.getAudioTracks().length > 0) {
      try {
        const source = this.audioContext.createMediaStreamSource(stream);
        source.connect(this.audioAnalyser);
        console.log("Connected stream to audio analyzer");
      } catch (e) {
        console.warn("Could not connect to audio analyzer:", e);
      }
    }
    
    // Attach the stream to the audio element
    audioElement.srcObject = stream;
    
    // Apply preferred audio output device if available
    const audioOutput = this.getPreferredAudioOutput();
    if (audioOutput) {
      this.setAudioOutput(audioOutput);
    }
    
    // Force play the audio only if we have user interaction
    if (userInteractionService.userHasInteracted()) {
      console.log("User has interacted - trying to auto-play audio");
      this.forcePlayAudio();
    } else {
      console.log("No user interaction yet - audio will play when user interacts");
    }
    
    return true;
  }
  
  /**
   * Patch audio track for Safari compatibility
   * Safari has some unique WebRTC audio routing issues
   */
  private patchAudioTrack(track: MediaStreamTrack): void {
    // Check if browser is Safari
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isSafari) {
      console.log("Applying Safari-specific audio track patches");
      
      // Create an audio context to process the audio track directly
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioCtx.createMediaStreamSource(new MediaStream([track]));
        const destination = audioCtx.createMediaStreamDestination();
        source.connect(destination);
        
        console.log("Applied Safari audio track patch");
      } catch (e) {
        console.error("Failed to apply Safari audio patch:", e);
      }
    }
  }
  
  /**
   * Set the audio output device using the setSinkId API
   * @param deviceId ID of the audio output device
   * @returns Promise that resolves when the audio output has been set
   */
  public setAudioOutput(deviceId: string): Promise<void> {
    if (!this.audioElement) {
      return Promise.reject(new Error("No audio element available"));
    }
    
    this.currentAudioOutput = deviceId;
    
    if (!('setSinkId' in HTMLAudioElement.prototype)) {
      console.warn("Audio output device selection not supported by this browser");
      return Promise.resolve();
    }
    
    console.log("Setting audio output device to:", deviceId);
    
    // Cast to any to access the non-standard setSinkId method
    return (this.audioElement as any).setSinkId(deviceId)
      .then(() => {
        console.log("Audio output set successfully to:", deviceId);
      })
      .catch((error: any) => {
        console.error("Failed to set audio output device:", error);
        throw error;
      });
  }
  
  /**
   * Force play the audio element to overcome browser autoplay restrictions
   * @returns Promise resolving to a boolean indicating if playback started
   */
  public forcePlayAudio(): Promise<boolean> {
    if (!this.audioElement) {
      return Promise.resolve(false);
    }
    
    if (!this.audioElement.paused) {
      console.log("Audio is already playing");
      return Promise.resolve(true);
    }
    
    if (!userInteractionService.userHasInteracted()) {
      console.warn("Cannot force-play audio without user interaction");
      return Promise.resolve(false);
    }
    
    console.log("Attempting to force play audio with user interaction");
    
    // For iOS Safari specifically
    if (this.audioElement.srcObject && this.audioElement.srcObject instanceof MediaStream) {
      const stream = this.audioElement.srcObject as MediaStream;
      if (stream.getAudioTracks().length > 0) {
        console.log("Ensuring audio tracks are enabled before play");
        stream.getAudioTracks().forEach(track => {
          track.enabled = true;
        });
      }
    }
    
    // Set volume explicitly to make sure it's not muted
    this.audioElement.volume = 1.0;
    this.audioElement.muted = false;
    
    // Try to start audio context if it exists and is suspended
    if (this.audioContext && this.audioContext.state === 'suspended') {
      console.log("Resuming suspended AudioContext before play");
      this.audioContext.resume().catch(e => console.warn("Failed to resume audio context:", e));
    }
    
    this.autoplayAttempted = true;
    
    return this.audioElement.play()
      .then(() => {
        console.log("Audio playback started successfully");
        return true;
      })
      .catch(error => {
        console.warn("Audio playback failed (probably due to autoplay policy):", error);
        
        // Make the audio element visible with controls as a fallback
        // but only if we actually have a stream to play
        if (this.audioElement?.srcObject instanceof MediaStream && 
            (this.audioElement.srcObject as MediaStream).getAudioTracks().length > 0) {
          this.showAudioControls();
        }
        
        return false;
      });
  }
  
  /**
   * Show audio controls to allow user to manually start playback
   * This is needed when autoplay is blocked by browser policy
   */
  public showAudioControls(): void {
    if (!this.audioElement) return;
    
    console.log("Showing audio controls for user interaction");
    
    // Make the audio element visible with controls
    this.audioElement.controls = true;
    this.audioElement.style.display = 'block';
    this.audioElement.style.position = 'fixed';
    this.audioElement.style.bottom = '20px';
    this.audioElement.style.right = '20px';
    this.audioElement.style.width = '300px';
    this.audioElement.style.zIndex = '9999';
  }
  
  /**
   * Hide the audio controls
   */
  public hideAudioControls(): void {
    if (!this.audioElement) return;
    
    this.audioElement.controls = false;
    this.audioElement.style.display = 'none';
  }
  
  /**
   * Check if audio is currently playing
   */
  public isAudioPlaying(): boolean {
    // Check if audio element exists and is playing
    if (!this.audioElement) return false;
    
    // If we have the AudioAnalyzer, use it for more accurate detection
    if (this.analyzeAudioFlow()) {
      return true;
    }
    
    // Fall back to standard paused check
    return !this.audioElement.paused;
  }
  
  /**
   * Clean up resources when audio is no longer needed
   */
  public cleanup(): void {
    if (this.analyticsInterval) {
      clearInterval(this.analyticsInterval);
      this.analyticsInterval = null;
    }
    
    if (this.audioElement) {
      // Don't remove the element, just reset it
      this.audioElement.srcObject = null;
      this.audioElement.pause();
      this.hideAudioControls();
    }
    
    // Clean up audio context if it exists
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {
        console.warn("Error closing audio context:", e);
      }
    }
    
    this.audioTrackPatched = false;
    this.autoplayAttempted = false;
  }
  
  /**
   * Prompt user for interaction to enable audio
   * This creates a visible button the user can click to enable audio
   * @returns Promise that resolves when user interacts
   */
  public promptForUserInteraction(): Promise<boolean> {
    return new Promise((resolve) => {
      // Check if we already have interaction
      if (userInteractionService.userHasInteracted()) {
        console.log("User has already interacted, no need for prompt");
        resolve(true);
        return;
      }
      
      console.log("Creating user interaction prompt");
      
      // Create a modal overlay with a button
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      overlay.style.display = 'flex';
      overlay.style.justifyContent = 'center';
      overlay.style.alignItems = 'center';
      overlay.style.zIndex = '10000';
      overlay.style.flexDirection = 'column';
      
      const message = document.createElement('div');
      message.textContent = 'Audio permission required';
      message.style.color = 'white';
      message.style.marginBottom = '20px';
      message.style.fontSize = '20px';
      
      const button = document.createElement('button');
      button.textContent = 'Enable Audio';
      button.style.padding = '12px 24px';
      button.style.backgroundColor = '#4CAF50';
      button.style.border = 'none';
      button.style.color = 'white';
      button.style.fontSize = '16px';
      button.style.borderRadius = '4px';
      button.style.cursor = 'pointer';
      
      overlay.appendChild(message);
      overlay.appendChild(button);
      document.body.appendChild(overlay);
      
      // Ensure button is focused for keyboard users
      button.focus();
      
      button.addEventListener('click', () => {
        // Remove the overlay
        document.body.removeChild(overlay);
        
        // Force the interaction state
        userInteractionService.forceInteractionState(true);
        
        console.log("User clicked the interaction button");
        
        // Resume audio context if it exists
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch(e => console.warn("Failed to resume audio context:", e));
        }
        
        // Try to play audio if we have a stream
        this.forcePlayAudio().catch(e => console.warn("Play after interaction prompt failed:", e));
        
        resolve(true);
      });
    });
  }
}

// Export singleton instance
const audioService = AudioService.getInstance();
export default audioService;
