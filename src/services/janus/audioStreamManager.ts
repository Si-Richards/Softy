/**
 * Centralized Audio Stream Management
 * Handles all audio track and stream operations to prevent conflicts
 */
export class AudioStreamManager {
  private remoteStream: MediaStream | null = null;
  private localStream: MediaStream | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private trackListeners: Map<string, () => void> = new Map();
  private initialized: boolean = false;

  initialize(): void {
    if (this.initialized) {
      return;
    }

    console.log("Initializing AudioStreamManager");
    this.createAudioElement();
    this.initialized = true;
  }

  private createAudioElement(): void {
    // Clean up any existing audio element
    this.cleanup();

    this.audioElement = document.createElement('audio');
    this.audioElement.id = 'remoteAudio';
    this.audioElement.autoplay = true;
    this.audioElement.setAttribute('playsinline', 'true');
    this.audioElement.style.display = 'none';
    
    // Add event listeners for debugging
    this.audioElement.onplay = () => console.log("🔊 Audio playback started");
    this.audioElement.onpause = () => console.log("⏸️ Audio playback paused");
    this.audioElement.onended = () => console.log("⏹️ Audio playback ended");
    this.audioElement.onerror = (e) => console.error("❌ Audio error:", e);
    this.audioElement.onloadstart = () => console.log("📡 Audio loading started");
    this.audioElement.oncanplay = () => console.log("▶️ Audio can start playing");

    document.body.appendChild(this.audioElement);
  }

  setRemoteStream(stream: MediaStream): void {
    console.log("🎵 Setting remote stream:", stream.id);
    
    // Clean up previous stream listeners
    this.clearTrackListeners();
    
    this.remoteStream = stream;
    
    // Set up listeners for all audio tracks
    stream.getAudioTracks().forEach((track, idx) => {
      console.log(`🎤 Remote audio track ${idx}:`, {
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState,
        id: track.id,
        label: track.label
      });
      
      // Ensure tracks are enabled
      track.enabled = true;
      
      // Setup listeners for track status changes
      const onEnded = () => {
        console.warn(`⚠️ Audio track ${track.id} ended`);
        this.handleTrackEnded(track);
      };
      
      const onMute = () => {
        console.warn(`🔇 Audio track ${track.id} was muted - re-enabling`);
        track.enabled = true;
      };
      
      track.addEventListener('ended', onEnded);
      track.addEventListener('mute', onMute);
      
      this.trackListeners.set(track.id + '_ended', onEnded);
      this.trackListeners.set(track.id + '_mute', onMute);
    });

    // Attach stream to audio element
    if (this.audioElement) {
      this.audioElement.srcObject = stream;
      this.attemptPlay();
    }

    // Apply saved audio output device
    this.applySavedAudioOutput();
  }

  private handleTrackEnded(track: MediaStreamTrack): void {
    console.log(`🔄 Handling ended track: ${track.id}`);
    
    // Remove the ended track from our stream if it exists
    if (this.remoteStream) {
      const tracks = this.remoteStream.getAudioTracks();
      const trackStillExists = tracks.find(t => t.id === track.id);
      
      if (trackStillExists && track.readyState === 'ended') {
        console.log("Removing ended track from stream");
        this.remoteStream.removeTrack(track);
      }
    }
  }

  private async attemptPlay(): Promise<void> {
    if (!this.audioElement) {
      console.warn("No audio element available for playback");
      return;
    }

    try {
      await this.audioElement.play();
      console.log("✅ Audio playback successful");
    } catch (error) {
      console.warn("⚠️ Audio autoplay failed, trying fallback methods:", error);
      
      // Try muted playback first
      this.audioElement.muted = true;
      try {
        await this.audioElement.play();
        console.log("✅ Muted audio playback successful");
        
        // Unmute after a short delay
        setTimeout(() => {
          if (this.audioElement) {
            this.audioElement.muted = false;
            console.log("🔊 Audio unmuted");
          }
        }, 500);
      } catch (mutedError) {
        console.error("❌ Even muted playback failed:", mutedError);
        
        // Show visible controls as last resort
        this.audioElement.controls = true;
        this.audioElement.style.display = 'block';
        this.audioElement.style.position = 'fixed';
        this.audioElement.style.bottom = '10px';
        this.audioElement.style.right = '10px';
        this.audioElement.style.zIndex = '9999';
      }
    }
  }

  private applySavedAudioOutput(): void {
    const savedOutput = localStorage.getItem('selectedAudioOutput');
    if (savedOutput && this.audioElement && 'setSinkId' in HTMLAudioElement.prototype) {
      (this.audioElement as any).setSinkId(savedOutput)
        .then(() => console.log("🔊 Audio output device set to:", savedOutput))
        .catch((error: any) => console.warn("⚠️ Failed to set audio output device:", error));
    }
  }

  forcePlay(): Promise<void> {
    if (!this.audioElement) {
      return Promise.reject("No audio element available");
    }

    return this.attemptPlay();
  }

  setAudioOutput(deviceId: string): Promise<void> {
    if (!this.audioElement || !('setSinkId' in HTMLAudioElement.prototype)) {
      return Promise.reject("Audio output selection not supported");
    }

    return (this.audioElement as any).setSinkId(deviceId);
  }

  getAudioElement(): HTMLAudioElement | null {
    return this.audioElement;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  addTrackDirectly(track: MediaStreamTrack): void {
    if (track.kind !== 'audio') {
      return;
    }

    console.log("➕ Adding audio track directly:", track.id);
    
    // Create or use existing stream
    if (!this.remoteStream) {
      this.remoteStream = new MediaStream();
    }

    // Check if track is already in the stream
    const existingTrack = this.remoteStream.getAudioTracks().find(t => t.id === track.id);
    if (!existingTrack) {
      this.remoteStream.addTrack(track);
      console.log("✅ Track added to remote stream");
    }

    // Ensure track is enabled
    track.enabled = true;

    // Update audio element if needed
    if (this.audioElement && this.audioElement.srcObject !== this.remoteStream) {
      this.audioElement.srcObject = this.remoteStream;
      this.attemptPlay();
    }
  }

  private clearTrackListeners(): void {
    this.trackListeners.forEach((listener, key) => {
      const [trackId, eventType] = key.split('_');
      if (this.remoteStream) {
        const track = this.remoteStream.getAudioTracks().find(t => t.id === trackId);
        if (track) {
          track.removeEventListener(eventType, listener);
        }
      }
    });
    this.trackListeners.clear();
  }

  cleanup(): void {
    console.log("🧹 Cleaning up AudioStreamManager");
    
    this.clearTrackListeners();
    
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.srcObject = null;
      if (this.audioElement.parentNode) {
        this.audioElement.parentNode.removeChild(this.audioElement);
      }
      this.audioElement = null;
    }

    this.remoteStream = null;
    this.localStream = null;
  }

  reset(): void {
    this.cleanup();
    this.initialized = false;
  }

  // Debug method to log current state
  logState(): void {
    console.log("🔍 AudioStreamManager State:", {
      initialized: this.initialized,
      hasAudioElement: !!this.audioElement,
      hasRemoteStream: !!this.remoteStream,
      remoteStreamTracks: this.remoteStream?.getAudioTracks().length || 0,
      trackListeners: this.trackListeners.size,
      audioElementSrc: this.audioElement?.srcObject ? 'present' : 'null',
      audioElementPaused: this.audioElement?.paused
    });
  }
}

// Singleton instance
export const audioStreamManager = new AudioStreamManager();