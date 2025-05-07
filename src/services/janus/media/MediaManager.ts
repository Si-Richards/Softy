
/**
 * MediaManager - Handles all media-related operations
 */
export class MediaManager {
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private audioSettings: AudioSettings = {
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
    highPassFilter: false
  };
  private videoSettings: VideoSettings = {
    enabled: false,
    hdVideo: false
  };

  constructor() {
    // Initialize audio context if needed
    if (typeof AudioContext !== 'undefined') {
      this.audioContext = new AudioContext();
    }
    
    // Load saved settings
    this.loadSavedSettings();
  }

  /**
   * Load saved audio and video settings
   */
  private loadSavedSettings(): void {
    try {
      const savedAudio = localStorage.getItem('audioSettings');
      if (savedAudio) {
        this.audioSettings = { ...this.audioSettings, ...JSON.parse(savedAudio) };
      }
      
      const savedVideo = localStorage.getItem('videoSettings');
      if (savedVideo) {
        this.videoSettings = { ...this.videoSettings, ...JSON.parse(savedVideo) };
      }
    } catch (error) {
      console.error("Error loading saved media settings:", error);
    }
  }

  /**
   * Save current settings to localStorage
   */
  saveSettings(): void {
    try {
      localStorage.setItem('audioSettings', JSON.stringify(this.audioSettings));
      localStorage.setItem('videoSettings', JSON.stringify(this.videoSettings));
    } catch (error) {
      console.error("Error saving media settings:", error);
    }
  }

  /**
   * Set local media stream
   */
  setLocalStream(stream: MediaStream | null): void {
    console.log("Setting local stream:", stream);
    if (this.localStream) {
      this.stopLocalStream();
    }
    
    this.localStream = stream;
    
    if (stream) {
      // Ensure audio tracks are enabled
      stream.getAudioTracks().forEach(track => {
        console.log("Local audio track:", track.label, "enabled:", track.enabled);
        track.enabled = true;
      });
    }
  }

  /**
   * Set remote media stream
   */
  setRemoteStream(stream: MediaStream | null): void {
    console.log("Setting remote stream:", stream);
    
    if (this.remoteStream) {
      // Clean up old stream
      this.remoteStream.getTracks().forEach(track => track.stop());
    }
    
    this.remoteStream = stream;
    
    if (stream) {
      // Ensure audio tracks are enabled
      stream.getAudioTracks().forEach(track => {
        console.log("Remote audio track:", track.label, "enabled:", track.enabled);
        if (!track.enabled) {
          console.log("Enabling disabled remote audio track");
          track.enabled = true;
        }
      });
      
      // Monitor stream status
      stream.addEventListener('inactive', () => {
        console.warn("Remote stream became inactive");
      });
      
      // Monitor track endings
      stream.getTracks().forEach(track => {
        track.addEventListener('ended', () => {
          console.warn(`Track ${track.id} (${track.kind}) ended`);
        });
      });
    }
  }

  /**
   * Get the local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get the remote stream
   */
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  /**
   * Stop and clean up the local stream
   */
  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localStream = null;
    }
  }

  /**
   * Stop and clean up all streams
   */
  clearStreams(): void {
    this.stopLocalStream();
    
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => {
        track.stop();
      });
      this.remoteStream = null;
    }
  }

  /**
   * Get media constraints for calls based on current settings
   */
  getCallMediaConstraints(isVideoCall: boolean = false): MediaStreamConstraints {
    const audioInput = localStorage.getItem('selectedAudioInput');
    const videoInput = localStorage.getItem('selectedVideoInput');
    
    // Enhanced audio constraints with current settings
    const audioConstraints: MediaTrackConstraints = {
      deviceId: audioInput ? { ideal: audioInput } : undefined,
      echoCancellation: this.audioSettings.echoCancellation,
      noiseSuppression: this.audioSettings.noiseSuppression,
      autoGainControl: this.audioSettings.autoGainControl
    };
    
    const constraints: MediaStreamConstraints = {
      audio: audioConstraints,
      video: isVideoCall ? (this.getVideoConstraints(videoInput)) : false
    };
    
    console.log("Using media constraints:", constraints);
    return constraints;
  }

  /**
   * Get video constraints based on settings
   */
  private getVideoConstraints(deviceId: string | null): boolean | MediaTrackConstraints {
    if (!this.videoSettings.enabled) {
      return false;
    }
    
    const constraints: MediaTrackConstraints = {
      deviceId: deviceId ? { ideal: deviceId } : undefined
    };
    
    // Add HD video settings if enabled
    if (this.videoSettings.hdVideo) {
      constraints.width = { min: 1280, ideal: 1920 };
      constraints.height = { min: 720, ideal: 1080 };
    }
    
    return constraints;
  }

  /**
   * Set audio muted state
   */
  setAudioMuted(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !muted;
      });
    }
  }

  /**
   * Set video enabled state
   */
  setVideoEnabled(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
    
    this.videoSettings.enabled = enabled;
    this.saveSettings();
  }

  /**
   * Update audio settings
   */
  updateAudioSettings(settings: Partial<AudioSettings>): void {
    this.audioSettings = { ...this.audioSettings, ...settings };
    this.saveSettings();
  }

  /**
   * Update video settings
   */
  updateVideoSettings(settings: Partial<VideoSettings>): void {
    this.videoSettings = { ...this.videoSettings, ...settings };
    this.saveSettings();
  }
}

export interface AudioSettings {
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  highPassFilter: boolean;
}

export interface VideoSettings {
  enabled: boolean;
  hdVideo: boolean;
}
