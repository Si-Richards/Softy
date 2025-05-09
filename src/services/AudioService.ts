/**
 * Service for handling audio playback and visualization
 */
class AudioService {
  private audioContext: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private audioTrackSources: Map<string, MediaStreamAudioSourceNode> = new Map();
  private gainNode: GainNode | null = null;
  private dataArray: Uint8Array = new Uint8Array(0);
  private activeStream: MediaStream | null = null;
  private activeTracks: MediaStreamTrack[] = [];
  private isPlaying: boolean = false;

  constructor() {
    console.log("AudioService initialized");
    // Create our audio element early
    this.createAudioElement();
  }

  /**
   * Create a reusable audio element for playback
   */
  private createAudioElement(): HTMLAudioElement {
    if (!this.audioElement) {
      console.log("Creating audio element");
      this.audioElement = document.createElement('audio');
      this.audioElement.id = 'audioServiceElement';
      this.audioElement.autoplay = true;
      this.audioElement.style.display = 'none';
      document.body.appendChild(this.audioElement);
      
      // Set up event listeners for debugging
      this.audioElement.onplay = () => {
        console.log("Audio element started playing");
        this.isPlaying = true;
      };
      this.audioElement.onpause = () => {
        console.log("Audio element paused");
        this.isPlaying = false;
      };
      this.audioElement.onended = () => {
        console.log("Audio playback ended");
        this.isPlaying = false;
      };
      this.audioElement.onerror = (e) => {
        console.error("Audio element error:", e);
        this.isPlaying = false;
      };
    }
    return this.audioElement;
  }

  /**
   * Initialize or get the audio context
   */
  private getOrCreateAudioContext(): AudioContext {
    if (!this.audioContext) {
      console.log("Creating new AudioContext");
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a gain node once
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 1.0;
      this.gainNode.connect(this.audioContext.destination);
    }
    return this.audioContext;
  }

  /**
   * Set up the analyser node for audio visualization
   */
  private setupAnalyser(): void {
    if (!this.audioContext) return;
    
    if (!this.analyser) {
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      if (this.gainNode) {
        this.analyser.connect(this.gainNode);
      } else {
        this.analyser.connect(this.audioContext.destination);
      }
    }
  }

  /**
   * Get the audio element (creating it if needed)
   */
  getAudioElement(): HTMLAudioElement {
    return this.createAudioElement();
  }

  /**
   * Get the current audio level from the analyser
   */
  getAudioLevel(): number {
    if (!this.analyser || !this.dataArray) return 0;
    
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Calculate average level
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    return sum / (this.dataArray.length * 255);
  }

  /**
   * Set the volume for audio playback
   * @param volume Volume level (0-1)
   */
  setVolume(volume: number): void {
    // Make sure volume is between 0 and 1
    volume = Math.min(1, Math.max(0, volume));
    
    // Set volume on the gain node if it exists
    if (this.gainNode) {
      this.gainNode.gain.value = volume;
      console.log(`AudioService: Volume set to ${volume}`);
    }
    
    // Also set volume on the audio element as a fallback
    if (this.audioElement) {
      this.audioElement.volume = volume;
    }
  }

  /**
   * Attach a media stream to the audio element and analyzer
   */
  attachStream(stream: MediaStream | null): boolean {
    if (!stream) {
      console.warn("Attempting to attach null stream");
      return false;
    }
    
    console.log("Attaching stream to audio service:", stream.id);
    console.log("Stream audio tracks:", stream.getAudioTracks().length);
    
    // Log detailed track information
    stream.getAudioTracks().forEach((track, idx) => {
      console.log(`Stream audio track ${idx}:`, {
        id: track.id,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState,
        label: track.label
      });
    });
    
    // Clean up any previous stream
    this.cleanup();
    
    // Store the active stream
    this.activeStream = stream;
    
    // Create audio element if needed
    const audioElement = this.createAudioElement();
    
    // Set the stream to the audio element
    audioElement.srcObject = stream;
    
    try {
      // Set up Web Audio nodes for visualization if there are audio tracks
      if (stream.getAudioTracks().length > 0) {
        const audioContext = this.getOrCreateAudioContext();
        this.setupAnalyser();
        
        // Create a media stream source from the stream
        this.mediaStreamSource = audioContext.createMediaStreamSource(stream);
        
        // Connect the source to the analyser
        if (this.analyser) {
          this.mediaStreamSource.connect(this.analyser);
        }
        
        // Listen for track ended events
        stream.getAudioTracks().forEach(track => {
          this.activeTracks.push(track);
          track.onended = () => {
            console.log(`Audio track ${track.id} ended`);
            this.activeTracks = this.activeTracks.filter(t => t.id !== track.id);
          };
        });
        
        console.log("Audio stream connected to Web Audio API");
        return true;
      } else {
        console.warn("Stream has no audio tracks");
        return false;
      }
    } catch (error) {
      console.error("Error setting up audio:", error);
      return false;
    }
  }

  /**
   * Attach a specific audio track directly
   */
  attachAudioTrack(track: MediaStreamTrack): boolean {
    if (!track || track.kind !== 'audio') {
      console.warn("Invalid audio track provided");
      return false;
    }
    
    console.log(`Attaching individual audio track: ${track.id}`);
    
    try {
      // Add to our active tracks array for monitoring
      if (!this.activeTracks.find(t => t.id === track.id)) {
        this.activeTracks.push(track);
        
        // Listen for track events
        track.onended = () => {
          console.log(`Audio track ${track.id} ended`);
          this.activeTracks = this.activeTracks.filter(t => t.id !== track.id);
          // Clean up the source node
          if (this.audioTrackSources.has(track.id)) {
            this.audioTrackSources.get(track.id)?.disconnect();
            this.audioTrackSources.delete(track.id);
          }
        };
      }
      
      // Create a new stream with just this track for audio element
      const trackStream = new MediaStream([track]);
      
      // Ensure we have a Web Audio context
      const audioContext = this.getOrCreateAudioContext();
      this.setupAnalyser();
      
      // Create a source node for this track if we don't have one yet
      if (!this.audioTrackSources.has(track.id)) {
        const trackSource = audioContext.createMediaStreamSource(trackStream);
        
        // Connect to analyser if we have one
        if (this.analyser) {
          trackSource.connect(this.analyser);
        }
        
        // Store the source for later cleanup
        this.audioTrackSources.set(track.id, trackSource);
      }
      
      // If we don't have an active stream yet, set this track stream as the active one
      if (!this.activeStream) {
        this.activeStream = trackStream;
        const audioElement = this.createAudioElement();
        audioElement.srcObject = trackStream;
      }
      
      console.log(`Audio track ${track.id} connected to Web Audio API`);
      return true;
    } catch (error) {
      console.error("Error attaching audio track:", error);
      return false;
    }
  }

  /**
   * Attempt to force audio playback
   */
  async forcePlayAudio(): Promise<boolean> {
    try {
      // Check if we have an audio element and stream
      if (!this.audioElement || !this.audioElement.srcObject) {
        console.warn("No audio element or stream to play");
        return false;
      }
      
      // Resume audio context if suspended
      if (this.audioContext && this.audioContext.state === "suspended") {
        await this.audioContext.resume();
        console.log("AudioContext resumed");
      }
      
      // Try to play the audio element
      await this.audioElement.play();
      this.isPlaying = true;
      console.log("Audio playback started successfully");
      return true;
    } catch (error) {
      console.warn("Error forcing audio playback:", error);
      
      // Try with muted first (some browsers allow this) then unmute
      try {
        if (!this.audioElement) return false;
        
        console.log("Trying with muted first...");
        this.audioElement.muted = true;
        await this.audioElement.play();
        
        // Short delay then unmute
        await new Promise(resolve => setTimeout(resolve, 100));
        this.audioElement.muted = false;
        this.isPlaying = true;
        console.log("Audio playback workaround succeeded");
        return true;
      } catch (e) {
        console.error("Even muted playback failed:", e);
        return false;
      }
    }
  }

  /**
   * Set the output device for the audio element
   */
  async setAudioOutput(deviceId: string): Promise<void> {
    if (!this.audioElement) {
      this.createAudioElement();
    }
    
    if (this.audioElement && 'setSinkId' in HTMLAudioElement.prototype) {
      try {
        await (this.audioElement as any).setSinkId(deviceId);
        console.log("Audio output device set to:", deviceId);
      } catch (error) {
        console.error("Error setting audio output device:", error);
        throw error;
      }
    } else {
      console.warn("setSinkId not supported in this browser");
      throw new Error("setSinkId not supported in this browser");
    }
  }

  /**
   * Check if audio is currently playing
   */
  isAudioPlaying(): boolean {
    if (!this.audioElement) return false;
    
    const hasAudioTracks = this.activeStream?.getAudioTracks().filter(t => t.enabled).length > 0;
    const elementPlaying = !this.audioElement.paused;
    
    return this.isPlaying && elementPlaying && !!hasAudioTracks;
  }
  
  /**
   * Get detailed audio status for debugging
   */
  getAudioStatus(): any {
    const audioElement = this.audioElement;
    
    return {
      volume: audioElement?.volume ?? 0,
      masterVolume: this.gainNode?.gain.value ?? 1,
      muted: audioElement?.muted ?? true,
      paused: audioElement?.paused ?? true,
      readyState: audioElement?.readyState ?? 0,
      networkState: audioElement?.networkState ?? 0,
      hasAudioTracks: this.activeStream?.getAudioTracks().length ?? 0,
      tracks: this.activeTracks.map(track => ({
        id: track.id,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState
      })),
      audioFlowing: this.isAudioPlaying(),
      currentTime: audioElement?.currentTime ?? 0,
      duration: audioElement?.duration ?? null,
      controlsVisible: audioElement?.controls ?? false,
      browserInfo: {
        name: navigator.userAgent.includes("Chrome") ? "Chrome" : 
              navigator.userAgent.includes("Safari") ? "Safari" : 
              navigator.userAgent.includes("Firefox") ? "Firefox" : "Unknown",
        version: this.getBrowserVersion(),
        isSafari: navigator.userAgent.includes("Safari") && !navigator.userAgent.includes("Chrome"),
        isChrome: navigator.userAgent.includes("Chrome"),
        isFirefox: navigator.userAgent.includes("Firefox"),
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent)
      }
    };
  }
  
  /**
   * Get browser version
   */
  private getBrowserVersion(): string {
    const ua = navigator.userAgent;
    let match;
    
    if (ua.includes("Chrome")) {
      match = ua.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
    } else if (ua.includes("Firefox")) {
      match = ua.match(/Firefox\/(\d+\.\d+)/);
    } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
      match = ua.match(/Version\/(\d+\.\d+)/);
    }
    
    return match ? match[1] : "unknown";
  }

  /**
   * Show audio controls for debugging
   */
  showAudioControls(): void {
    if (!this.audioElement) return;
    
    this.audioElement.controls = true;
    this.audioElement.style.display = 'block';
    this.audioElement.style.position = 'fixed';
    this.audioElement.style.bottom = '10px';
    this.audioElement.style.right = '10px';
    this.audioElement.style.zIndex = '10000';
    this.audioElement.style.background = '#000';
    this.audioElement.style.borderRadius = '4px';
    
    console.log("Audio controls displayed");
  }

  /**
   * Hide audio controls
   */
  hideAudioControls(): void {
    if (!this.audioElement) return;
    
    this.audioElement.controls = false;
    this.audioElement.style.display = 'none';
  }
  
  /**
   * Prompt for user interaction to enable audio playback
   */
  async promptForUserInteraction(): Promise<boolean> {
    return new Promise((resolve) => {
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
      
      // Handle button click
      button.addEventListener('click', async () => {
        document.body.removeChild(overlay);
        
        // Try to resume audio context
        if (this.audioContext && this.audioContext.state === "suspended") {
          try {
            await this.audioContext.resume();
          } catch (e) {
            console.warn("Error resuming audio context:", e);
          }
        }
        
        // Try to play any audio we have
        if (this.audioElement && this.audioElement.srcObject) {
          this.audioElement.play()
            .catch(e => console.warn("Error playing audio after interaction:", e));
        }
        
        resolve(true);
      });
    });
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    // Disconnect any media stream source nodes
    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
      this.mediaStreamSource = null;
    }
    
    // Disconnect individual track sources
    this.audioTrackSources.forEach(source => {
      source.disconnect();
    });
    this.audioTrackSources.clear();
    
    // Clear references to streams and tracks
    this.activeStream = null;
    this.activeTracks = [];
    
    // Note: We don't destroy the audio context or element since they can be reused
    console.log("AudioService cleanup complete");
  }
}

const audioService = new AudioService();
export default audioService;
