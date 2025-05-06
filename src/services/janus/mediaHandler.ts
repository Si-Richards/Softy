
export class JanusMediaHandler {
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private audioOutput: AudioDestinationNode | null = null;
  private audioGain: GainNode | null = null;

  constructor() {
    // Initialize the AudioContext for better audio handling
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.audioOutput = this.audioContext.destination;
      this.audioGain = this.audioContext.createGain();
      this.audioGain.connect(this.audioOutput);
      this.audioGain.gain.value = 1.0; // Default volume
      console.log("Audio context initialized successfully");
    } catch (e) {
      console.error("Failed to initialize audio context:", e);
    }
  }

  setLocalStream(stream: MediaStream | null) {
    console.log("Setting local stream:", stream);
    if (stream) {
      // Ensure audio tracks are enabled by default
      stream.getAudioTracks().forEach(track => {
        console.log("Local audio track:", track.label, "enabled:", track.enabled);
        track.enabled = true;
      });
    }
    this.localStream = stream;
  }

  setRemoteStream(stream: MediaStream | null) {
    console.log("Setting remote stream:", stream);
    if (stream) {
      // Ensure audio tracks are enabled by default
      stream.getAudioTracks().forEach(track => {
        console.log("Remote audio track:", track.label, "enabled:", track.enabled);
        // Explicitly enable remote audio tracks
        if (!track.enabled) {
          console.log("Enabling disabled remote audio track");
          track.enabled = true;
        }
      });
      
      // Connect remote stream to audio context if available
      if (this.audioContext && stream.getAudioTracks().length > 0) {
        try {
          const source = this.audioContext.createMediaStreamSource(stream);
          source.connect(this.audioGain!);
          console.log("Connected remote audio to audio context");
          
          // Resume audio context if it's suspended (due to autoplay policy)
          if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
              console.log("Audio context resumed successfully");
            }).catch(err => {
              console.error("Failed to resume audio context:", err);
            });
          }
        } catch (e) {
          console.error("Failed to connect remote stream to audio context:", e);
        }
      }
      
      // Add stream ended event listener
      stream.addEventListener('inactive', () => {
        console.warn("Remote stream became inactive");
      });

      // Log when audio tracks end
      stream.getAudioTracks().forEach(track => {
        track.addEventListener('ended', () => {
          console.warn(`Audio track ${track.id} ended`);
        });
      });
    }
    this.remoteStream = stream;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  clearStreams() {
    this.localStream = null;
    this.remoteStream = null;
  }

  setAudioVolume(volume: number) {
    if (this.audioGain) {
      // Convert percentage (0-100) to gain value (0-1)
      const gainValue = Math.max(0, Math.min(1, volume / 100));
      this.audioGain.gain.value = gainValue;
      console.log(`Audio volume set to ${volume}%, gain value: ${gainValue}`);
    }
  }

  // Method to ensure audio is playing
  ensureAudioPlayback() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().then(() => {
        console.log("Audio context resumed on user interaction");
      }).catch(err => {
        console.error("Failed to resume audio context:", err);
      });
    }
    
    // Force re-enable all audio tracks
    if (this.remoteStream) {
      this.remoteStream.getAudioTracks().forEach(track => {
        if (!track.enabled) {
          track.enabled = true;
          console.log("Re-enabled audio track on user interaction");
        }
      });
    }
  }
}
