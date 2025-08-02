/**
 * Unified Audio Manager based on official Janus SIP demo patterns
 * Handles audio through single authoritative element managed by Janus plugin
 */

export class UnifiedAudioManager {
  private audioElement: HTMLAudioElement | null = null;
  private remoteStream: MediaStream | null = null;
  private initialized: boolean = false;
  private streamListeners: Map<string, () => void> = new Map();

  initialize(): void {
    if (this.initialized) {
      console.log('🎵 UnifiedAudioManager already initialized');
      return;
    }

    console.log('🎵 Initializing UnifiedAudioManager');
    this.cleanup(); // Remove any conflicting elements
    this.createAudioElement();
    this.initialized = true;
  }

  private createAudioElement(): void {
    // Remove any existing conflicting audio elements
    this.removeConflictingElements();

    this.audioElement = document.createElement('audio');
    this.audioElement.id = 'remoteAudio';
    this.audioElement.autoplay = true;
    this.audioElement.setAttribute('playsinline', 'true');
    this.audioElement.muted = false;
    this.audioElement.controls = false;
    this.audioElement.style.display = 'none';
    
    // Add comprehensive event listeners for debugging
    this.setupAudioEventListeners();

    document.body.appendChild(this.audioElement);
    console.log('✅ Audio element created and added to DOM');
  }

  private setupAudioEventListeners(): void {
    if (!this.audioElement) return;

    const events = [
      'loadstart', 'loadeddata', 'loadedmetadata', 'canplay', 'canplaythrough',
      'play', 'playing', 'pause', 'ended', 'waiting', 'seeking', 'seeked',
      'emptied', 'stalled', 'suspend', 'abort', 'error', 'durationchange',
      'timeupdate', 'progress', 'ratechange', 'volumechange'
    ];

    events.forEach(eventName => {
      this.audioElement!.addEventListener(eventName, (e) => {
        if (['timeupdate', 'progress'].includes(eventName)) return; // Too verbose
        console.log(`🎵 Audio event: ${eventName}`, {
          currentTime: this.audioElement!.currentTime,
          duration: this.audioElement!.duration,
          paused: this.audioElement!.paused,
          muted: this.audioElement!.muted,
          volume: this.audioElement!.volume
        });
      });
    });

    // Special handling for error events
    this.audioElement.addEventListener('error', (e) => {
      const error = this.audioElement!.error;
      console.error('❌ Audio error:', {
        code: error?.code,
        message: error?.message,
        srcObject: !!this.audioElement!.srcObject
      });
    });
  }

  private removeConflictingElements(): void {
    // Remove all potential conflicting audio elements
    const conflictingIds = ['remoteAudio', 'audioServiceElement'];
    const conflictingSelectors = ['audio[data-audio-manager]', 'audio[id^="audio-track-"]'];
    
    conflictingIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        console.log(`🧹 Removing conflicting audio element: ${id}`);
        element.remove();
      }
    });

    conflictingSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        console.log(`🧹 Removing conflicting audio element: ${selector}`);
        element.remove();
      });
    });
  }

  setRemoteStream(stream: MediaStream): void {
    if (!this.initialized) {
      this.initialize();
    }

    console.log('🎵 Setting remote stream:', {
      id: stream.id,
      active: stream.active,
      audioTracks: stream.getAudioTracks().length
    });

    // Clean up previous stream
    this.clearStreamListeners();
    this.remoteStream = stream;

    // Log detailed track information
    stream.getAudioTracks().forEach((track, idx) => {
      console.log(`🎤 Audio track ${idx}:`, {
        id: track.id,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState,
        label: track.label
      });

      // Ensure track is enabled
      track.enabled = true;

      // Set up track event listeners
      this.setupTrackListeners(track);
    });

    // Attach stream to audio element
    if (this.audioElement) {
      this.audioElement.srcObject = stream;
      this.attemptPlayback();
      this.applySavedAudioOutput();
    }
  }

  private setupTrackListeners(track: MediaStreamTrack): void {
    const onEnded = () => {
      console.warn(`⚠️ Track ${track.id} ended`);
      this.handleTrackEnded(track);
    };

    const onMute = () => {
      console.warn(`🔇 Track ${track.id} muted - re-enabling`);
      track.enabled = true;
    };

    track.addEventListener('ended', onEnded);
    track.addEventListener('mute', onMute);

    this.streamListeners.set(track.id + '_ended', onEnded);
    this.streamListeners.set(track.id + '_mute', onMute);
  }

  private handleTrackEnded(track: MediaStreamTrack): void {
    if (this.remoteStream) {
      const activeTracks = this.remoteStream.getAudioTracks().filter(t => t.readyState === 'live');
      console.log(`🔄 ${activeTracks.length} active tracks remaining after track end`);
      
      if (activeTracks.length === 0) {
        console.warn('⚠️ No active audio tracks remaining');
      }
    }
  }

  private async attemptPlayback(): Promise<void> {
    if (!this.audioElement) {
      console.warn('⚠️ No audio element for playback');
      return;
    }

    try {
      // First attempt: normal playback
      await this.audioElement.play();
      console.log('✅ Audio playback started successfully');
    } catch (error) {
      console.warn('⚠️ Initial playback failed, trying recovery methods:', error);
      
      try {
        // Second attempt: muted playback then unmute
        this.audioElement.muted = true;
        await this.audioElement.play();
        console.log('✅ Muted playback started, unmuting...');
        
        setTimeout(() => {
          if (this.audioElement) {
            this.audioElement.muted = false;
            console.log('🔊 Audio unmuted');
          }
        }, 100);
      } catch (mutedError) {
        console.error('❌ Even muted playback failed:', mutedError);
        this.showFallbackControls();
      }
    }
  }

  private showFallbackControls(): void {
    if (!this.audioElement) return;

    console.log('🆘 Showing fallback audio controls');
    this.audioElement.controls = true;
    this.audioElement.style.display = 'block';
    this.audioElement.style.position = 'fixed';
    this.audioElement.style.bottom = '10px';
    this.audioElement.style.right = '10px';
    this.audioElement.style.zIndex = '9999';
    this.audioElement.style.backgroundColor = 'rgba(0,0,0,0.8)';
    this.audioElement.style.border = '2px solid #ff0000';
    this.audioElement.style.borderRadius = '4px';
  }

  private applySavedAudioOutput(): void {
    const savedOutput = localStorage.getItem('selectedAudioOutput');
    if (savedOutput && this.audioElement && 'setSinkId' in HTMLAudioElement.prototype) {
      (this.audioElement as any).setSinkId(savedOutput)
        .then(() => console.log('🔊 Audio output device applied:', savedOutput))
        .catch((error: any) => console.warn('⚠️ Failed to set audio output:', error));
    }
  }

  private clearStreamListeners(): void {
    this.streamListeners.forEach((listener, key) => {
      const [trackId, eventType] = key.split('_');
      if (this.remoteStream) {
        const track = this.remoteStream.getAudioTracks().find(t => t.id === trackId);
        if (track) {
          track.removeEventListener(eventType, listener);
        }
      }
    });
    this.streamListeners.clear();
  }

  // Force playback method for user interaction
  async forcePlayback(): Promise<void> {
    if (!this.audioElement) {
      throw new Error('No audio element available');
    }

    return this.attemptPlayback();
  }

  // Set audio output device
  async setAudioOutput(deviceId: string): Promise<void> {
    if (!this.audioElement || !('setSinkId' in HTMLAudioElement.prototype)) {
      throw new Error('Audio output selection not supported');
    }

    return (this.audioElement as any).setSinkId(deviceId);
  }

  // Get audio element reference
  getAudioElement(): HTMLAudioElement | null {
    return this.audioElement;
  }

  // Get current stream
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  // Check if audio is playing
  isPlaying(): boolean {
    if (!this.audioElement || !this.remoteStream) return false;
    
    const hasActiveTracks = this.remoteStream.getAudioTracks().some(
      track => track.enabled && track.readyState === 'live'
    );
    
    return !this.audioElement.paused && hasActiveTracks;
  }

  // Debug state logging
  logState(): void {
    console.log('🔍 UnifiedAudioManager State:', {
      initialized: this.initialized,
      hasAudioElement: !!this.audioElement,
      hasRemoteStream: !!this.remoteStream,
      audioElementSrc: this.audioElement?.srcObject ? 'present' : 'null',
      audioElementPaused: this.audioElement?.paused,
      audioElementMuted: this.audioElement?.muted,
      streamTracks: this.remoteStream?.getAudioTracks().length || 0,
      activeTracks: this.remoteStream?.getAudioTracks().filter(t => t.enabled && t.readyState === 'live').length || 0,
      streamListeners: this.streamListeners.size,
      isPlaying: this.isPlaying()
    });
  }

  // Complete cleanup
  cleanup(): void {
    console.log('🧹 Cleaning up UnifiedAudioManager');
    
    this.clearStreamListeners();
    
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.srcObject = null;
      if (this.audioElement.parentNode) {
        this.audioElement.parentNode.removeChild(this.audioElement);
      }
      this.audioElement = null;
    }

    this.remoteStream = null;
  }

  // Reset manager
  reset(): void {
    this.cleanup();
    this.initialized = false;
  }
}

// Singleton instance
export const unifiedAudioManager = new UnifiedAudioManager();