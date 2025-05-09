
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
  private audioSource: MediaStreamAudioSourceNode | null = null;
  private audioAnalyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private isAudioFlowing = false;
  private lastAudioFlowCheck = 0;
  private audioInitialized = false;
  private streamToAttachOnInitialization: MediaStream | null = null;
  private currentStream: MediaStream | null = null;
  private currentTracks: MediaStreamTrack[] = [];
  private autoplayAttempted = false;
  private enabledByUserInteraction = false;
  private masterVolume: number = 1.0;
  private controlsVisible: boolean = false;
  private browserInfo: {
    name: string;
    version: string;
    isSafari: boolean;
    isChrome: boolean;
    isFirefox: boolean;
    isIOS: boolean;
  };
  
  private constructor() {
    this.getPreferredAudioOutput();
    
    // Early initialization of audio element on service creation
    this.initializeAudio();
    
    // Apply user's master volume setting from local storage
    this.loadVolumeFromSettings();
    
    // Detect browser for specific workarounds
    this.browserInfo = this.detectBrowser();
    
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
    
    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.audioElement && this.audioElement.paused && 
          this.audioElement.srcObject && userInteractionService.userHasInteracted()) {
        console.log("AudioService: Page became visible, attempting to resume audio");
        setTimeout(() => {
          this.forcePlayAudio().catch(e => console.warn("Resume after visibility change failed:", e));
        }, 300);
      }
    });
    
    // Set up interval to log audio status
    setInterval(() => {
      console.log("Audio service status:", {
        hasAudioElement: !!this.audioElement,
        isPlaying: this.isAudioPlaying(),
        hasStream: !!this.currentStream,
        trackCount: this.currentTracks.length,
        audioTracks: this.currentTracks.map(t => ({
          id: t.id,
          enabled: t.enabled,
          muted: t.muted,
          readyState: t.readyState
        }))
      });
    }, 10000);
  }
  
  /**
   * Detect browser info for browser-specific workarounds
   */
  private detectBrowser(): {
    name: string;
    version: string;
    isSafari: boolean;
    isChrome: boolean;
    isFirefox: boolean;
    isIOS: boolean;
  } {
    const userAgent = navigator.userAgent;
    let name = "unknown";
    let version = "unknown";
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    const isChrome = userAgent.indexOf("Chrome") > -1;
    const isFirefox = userAgent.indexOf("Firefox") > -1;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    
    if (isSafari) {
      name = "Safari";
      version = userAgent.match(/Version\/([\d.]+)/)?.[1] || "unknown";
    } else if (isChrome) {
      name = "Chrome";
      version = userAgent.match(/Chrome\/([\d.]+)/)?.[1] || "unknown";
    } else if (isFirefox) {
      name = "Firefox";
      version = userAgent.match(/Firefox\/([\d.]+)/)?.[1] || "unknown";
    }
    
    return { name, version, isSafari, isChrome, isFirefox, isIOS };
  }
  
  /**
   * Load volume setting from local storage
   */
  private loadVolumeFromSettings(): void {
    try {
      const audioSettings = localStorage.getItem('audioSettings');
      if (audioSettings) {
        const settings = JSON.parse(audioSettings);
        if (settings.masterVolume !== undefined) {
          this.masterVolume = settings.masterVolume / 100;
          console.log(`AudioService: Loaded master volume: ${this.masterVolume * 100}%`);
          
          // Apply to audio element if it exists
          if (this.audioElement) {
            this.audioElement.volume = this.masterVolume;
          }
        }
      }
    } catch (e) {
      console.warn("AudioService: Error loading volume settings:", e);
    }
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
          
          // If we already have a stream, connect it to the analyzer
          if (this.currentStream && this.currentStream.getAudioTracks().length > 0) {
            this.connectStreamToAnalyzer(this.currentStream);
          }
        }
      } catch (e) {
        console.warn("Could not initialize audio analyzer:", e);
      }
    }
  }
  
  /**
   * Connect a media stream to the audio analyzer
   */
  private connectStreamToAnalyzer(stream: MediaStream): void {
    if (!this.audioContext || !this.audioAnalyser) {
      console.warn("Cannot connect stream to analyzer: Audio context not initialized");
      return;
    }
    
    try {
      // Disconnect previous source if it exists
      if (this.audioSource) {
        this.audioSource.disconnect();
        this.audioSource = null;
      }
      
      // Create new audio source from the stream
      this.audioSource = this.audioContext.createMediaStreamSource(stream);
      this.audioSource.connect(this.audioAnalyser);
      
      console.log("Stream connected to audio analyzer");
    } catch (e) {
      console.warn("Error connecting stream to analyzer:", e);
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
  
  /**
   * Get the singleton audio element or create it if it doesn't exist
   */
  public getAudioElement(): HTMLAudioElement {
    if (!this.audioElement) {
      // Check if there's already an audio element on the page with id='remoteAudio'
      const existingElement = document.getElementById('remoteAudio') as HTMLAudioElement;
      
      if (existingElement && existingElement.tagName === 'AUDIO') {
        console.log("Found existing audio element, using it");
        this.audioElement = existingElement;
      } else {
        // Create a new audio element
        console.log("Creating new audio element");
        this.audioElement = document.createElement('audio');
        this.audioElement.id = 'remoteAudio';
        this.audioElement.autoplay = true;
        this.audioElement.controls = false;
        this.audioElement.volume = this.masterVolume;
        
        // Safari requires extra attributes
        if (this.browserInfo.isSafari || this.browserInfo.isIOS) {
          this.audioElement.setAttribute('playsinline', 'true');
          this.audioElement.setAttribute('webkit-playsinline', 'true');
        }
        
        document.body.appendChild(this.audioElement);
      }
      
      // Add event listeners for logging
      this.audioElement.addEventListener('play', () => console.log("Audio element: play event"));
      this.audioElement.addEventListener('playing', () => console.log("Audio element: playing event"));
      this.audioElement.addEventListener('pause', () => console.log("Audio element: pause event"));
      this.audioElement.addEventListener('ended', () => console.log("Audio element: ended event"));
      this.audioElement.addEventListener('stalled', () => console.log("Audio element: stalled event"));
      this.audioElement.addEventListener('error', (e) => console.log("Audio element: error event", e));
      
      // Apply preferred output device if available
      if (this.currentAudioOutput && 'setSinkId' in HTMLAudioElement.prototype) {
        (this.audioElement as any).setSinkId(this.currentAudioOutput)
          .then(() => console.log("Audio output device set to:", this.currentAudioOutput))
          .catch((e: Error) => console.warn("Error setting audio output device:", e));
      }
    }
    
    return this.audioElement;
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
  private setupAudioAnalytics(): void {
    if (this.analyticsInterval) {
      clearInterval(this.analyticsInterval);
    }
    
    this.analyticsInterval = window.setInterval(() => {
      if (this.audioElement) {
        // Log audio element state periodically for debugging
        console.log("Audio element status:", {
          volume: this.audioElement.volume,
          muted: this.audioElement.muted,
          paused: this.audioElement.paused,
          currentTime: this.audioElement.currentTime,
          readyState: this.audioElement.readyState,
          networkState: this.audioElement.networkState
        });
      }
    }, 30000); // Every 30 seconds
  }
  
  /**
   * Return detailed status of the audio service and element
   */
  public getAudioStatus(): any {
    return {
      volume: this.audioElement?.volume,
      muted: this.audioElement?.muted,
      paused: this.audioElement?.paused,
      currentTime: this.audioElement?.currentTime,
      readyState: this.audioElement?.readyState,
      networkState: this.audioElement?.networkState,
      hasAudioTracks: this.currentTracks.length,
      audioFlowing: this.isAudioFlowing,
      userHasInteracted: userInteractionService.userHasInteracted(),
      enabledByUserInteraction: this.enabledByUserInteraction,
      controlsVisible: this.controlsVisible,
      browserInfo: this.browserInfo
    };
  }
  
  /**
   * Get the current audio level (0-1)
   * Used for visualization
   */
  public getAudioLevel(): number {
    // No audio analyzer or no data array means no audio level
    if (!this.audioAnalyser || !this.dataArray) return 0;
    
    // No audio tracks means no audio level
    if (this.currentTracks.length === 0) return 0;
    
    // Get frequency data
    this.audioAnalyser.getByteFrequencyData(this.dataArray);
    
    // Calculate average energy level
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    
    // Normalize to 0-1
    const maxPossible = 255 * this.dataArray.length;
    return sum / maxPossible;
  }
  
  /**
   * Attach a MediaStream to the audio element
   */
  public attachStream(stream: MediaStream | null): boolean {
    if (!stream) {
      console.warn("AudioService: Cannot attach null stream");
      return false;
    }
    
    console.log("AudioService: Attaching stream with ID", stream.id);
    
    // Clear any existing tracks
    this.currentTracks = [];
    
    // Get audio tracks from the stream
    const audioTracks = stream.getAudioTracks();
    console.log(`AudioService: Stream has ${audioTracks.length} audio tracks`);
    
    if (audioTracks.length === 0) {
      console.warn("AudioService: Stream has no audio tracks");
      return false;
    }
    
    // Store the current stream and its audio tracks
    this.currentStream = stream;
    this.currentTracks = [...audioTracks];
    
    // Make sure all tracks are enabled
    this.currentTracks.forEach(track => {
      track.enabled = true;
    });
    
    // Connect to audio analyzer if context is initialized
    if (this.audioContext && this.audioAnalyser) {
      this.connectStreamToAnalyzer(stream);
    }
    
    // If user hasn't interacted yet, store the stream for later
    if (!userInteractionService.userHasInteracted()) {
      console.log("AudioService: Storing stream for attachment after user interaction");
      this.streamToAttachOnInitialization = stream;
      return false;
    }
    
    // Get or create the audio element
    const audioElement = this.getAudioElement();
    
    // Make sure we're using the correct audio output device
    this.applyAudioOutput();
    
    // Attach the stream to the audio element
    audioElement.srcObject = stream;
    
    // Try to play the audio
    this.forcePlayAudio().catch(e => {
      console.warn("AudioService: Failed to play audio after attachment:", e);
    });
    
    return true;
  }
  
  /**
   * Attach a specific audio track to the audio element
   */
  public attachAudioTrack(track: MediaStreamTrack): boolean {
    console.log("AudioService: Attaching audio track with ID", track.id);
    
    // Create a new MediaStream with just this track
    const stream = new MediaStream([track]);
    
    // Attach the stream
    return this.attachStream(stream);
  }
  
  /**
   * Detach any stream from the audio element
   */
  public detachStream(): void {
    console.log("AudioService: Detaching stream");
    
    this.currentStream = null;
    this.currentTracks = [];
    
    if (this.audioElement) {
      this.audioElement.srcObject = null;
    }
    
    // Disconnect audio analyzer source if it exists
    if (this.audioSource) {
      this.audioSource.disconnect();
      this.audioSource = null;
    }
  }
  
  /**
   * Handle a track that has ended
   */
  public handleTrackEnded(track: MediaStreamTrack): void {
    console.log("AudioService: Handling ended track", track.id);
    
    // Try to remove this track from our current tracks list
    this.currentTracks = this.currentTracks.filter(t => t.id !== track.id);
    
    // If we have no tracks left, show a warning
    if (this.currentTracks.length === 0) {
      console.warn("AudioService: All audio tracks have ended");
    }
  }
  
  /**
   * Handle a stream becoming inactive
   */
  public handleStreamInactive(): void {
    console.log("AudioService: Handling inactive stream");
    
    // Check if our current stream still has active tracks
    if (this.currentStream) {
      const activeTracks = this.currentStream.getAudioTracks().filter(t => t.readyState === 'live');
      
      if (activeTracks.length === 0) {
        console.warn("AudioService: Stream has no active audio tracks");
        this.currentTracks = [];
      } else {
        // Update our tracks list to only include active tracks
        this.currentTracks = activeTracks;
      }
    }
  }
  
  /**
   * Check if audio is currently playing
   */
  public isAudioPlaying(): boolean {
    if (!this.audioElement) return false;
    return !this.audioElement.paused && this.audioElement.readyState > 2;
  }
  
  /**
   * Force audio playback without requiring user interaction
   */
  public async forcePlayAudio(): Promise<boolean> {
    // If no audio element, create one
    const audioElement = this.getAudioElement();
    
    // If no stream is attached and we don't have any tracks, nothing to play
    if (!audioElement.srcObject && this.currentTracks.length === 0) {
      console.log("AudioService: No stream attached to audio element");
      return false;
    }
    
    // If already playing, nothing to do
    if (!audioElement.paused) {
      console.log("AudioService: Audio already playing");
      return true;
    }
    
    // Set audio element unmuted and with volume
    audioElement.muted = false;
    audioElement.volume = this.masterVolume;
    
    try {
      // Try to play the audio
      await audioElement.play();
      console.log("AudioService: Successfully started audio playback");
      return true;
    } catch (error) {
      console.warn("AudioService: Failed to auto-play audio:", error);
      return false;
    }
  }
  
  /**
   * Set the audio output device
   */
  public async setAudioOutput(deviceId: string): Promise<boolean> {
    console.log("AudioService: Setting audio output device to", deviceId);
    
    this.currentAudioOutput = deviceId;
    
    // Store in local storage
    localStorage.setItem('selectedAudioOutput', deviceId);
    
    return this.applyAudioOutput();
  }
  
  /**
   * Apply the current audio output device to the audio element
   */
  private async applyAudioOutput(): Promise<boolean> {
    if (!this.audioElement) {
      console.warn("AudioService: No audio element to set output device");
      return false;
    }
    
    if (!this.currentAudioOutput) {
      console.log("AudioService: No audio output device specified");
      return false;
    }
    
    if (!('setSinkId' in HTMLAudioElement.prototype)) {
      console.warn("AudioService: setSinkId not supported by this browser");
      return false;
    }
    
    try {
      await (this.audioElement as any).setSinkId(this.currentAudioOutput);
      console.log("AudioService: Audio output device set to", this.currentAudioOutput);
      return true;
    } catch (error) {
      console.error("AudioService: Error setting audio output device:", error);
      return false;
    }
  }
  
  /**
   * Show audio controls for manual playback
   */
  public showAudioControls(): void {
    const audioElement = this.getAudioElement();
    audioElement.controls = true;
    this.controlsVisible = true;
  }
  
  /**
   * Hide audio controls
   */
  public hideAudioControls(): void {
    const audioElement = this.getAudioElement();
    audioElement.controls = false;
    this.controlsVisible = false;
  }
  
  /**
   * Prompt for user interaction to enable audio
   */
  public async promptForUserInteraction(): Promise<boolean> {
    console.log("AudioService: Prompting for user interaction");
    
    // Create a simple prompt that requires interaction
    return new Promise<boolean>((resolve) => {
      const modal = document.createElement('div');
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
      modal.style.display = 'flex';
      modal.style.justifyContent = 'center';
      modal.style.alignItems = 'center';
      modal.style.zIndex = '9999';
      
      const content = document.createElement('div');
      content.style.backgroundColor = 'white';
      content.style.padding = '20px';
      content.style.borderRadius = '8px';
      content.style.maxWidth = '400px';
      content.style.textAlign = 'center';
      
      const message = document.createElement('p');
      message.textContent = 'Click the button below to enable audio';
      message.style.marginBottom = '20px';
      
      const button = document.createElement('button');
      button.textContent = 'Enable Audio';
      button.style.padding = '10px 20px';
      button.style.backgroundColor = '#4CAF50';
      button.style.border = 'none';
      button.style.borderRadius = '4px';
      button.style.color = 'white';
      button.style.cursor = 'pointer';
      
      content.appendChild(message);
      content.appendChild(button);
      modal.appendChild(content);
      document.body.appendChild(modal);
      
      // Focus the button (helps with keyboard navigation)
      button.focus();
      
      button.onclick = () => {
        document.body.removeChild(modal);
        // Force the user interaction state to be true
        userInteractionService.forceInteractionState(true);
        this.enabledByUserInteraction = true;
        
        // Initialize audio context if needed
        this.initializeAudioContext();
        
        // If we have a pending stream, attach it now
        if (this.streamToAttachOnInitialization) {
          console.log("AudioService: Attaching pending stream after prompt");
          this.attachStream(this.streamToAttachOnInitialization);
          this.streamToAttachOnInitialization = null;
        }
        
        resolve(true);
      };
    });
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    console.log("AudioService: Cleaning up");
    
    if (this.analyticsInterval) {
      clearInterval(this.analyticsInterval);
      this.analyticsInterval = null;
    }
    
    // Don't remove the audio element, just clean it
    if (this.audioElement) {
      this.audioElement.srcObject = null;
      this.audioElement.pause();
    }
    
    this.detachStream();
    
    if (this.audioSource) {
      this.audioSource.disconnect();
      this.audioSource = null;
    }
    
    this.currentStream = null;
    this.currentTracks = [];
  }
}

// Export a singleton instance
const audioService = AudioService.getInstance();
export default audioService;
