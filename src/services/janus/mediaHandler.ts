
export class JanusMediaHandler {
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private remoteGain: GainNode | null = null;

  constructor() {
    try {
      // Initialize audio context for better audio handling
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log("Audio context initialized:", this.audioContext.state);
      
      // If audio context is in suspended state, we'll need user interaction to resume it
      if (this.audioContext.state === 'suspended') {
        const resumeAudio = () => {
          this.audioContext?.resume().then(() => {
            console.log("AudioContext resumed successfully");
            document.removeEventListener('click', resumeAudio);
            document.removeEventListener('touchstart', resumeAudio);
          });
        };
        
        document.addEventListener('click', resumeAudio, { once: true });
        document.addEventListener('touchstart', resumeAudio, { once: true });
      }
    } catch (e) {
      console.error("Could not create AudioContext:", e);
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
      
      // Connect remote stream to audio context for better control
      this.connectRemoteStreamToAudioContext(stream);
      
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

  private connectRemoteStreamToAudioContext(stream: MediaStream) {
    if (!this.audioContext) return;
    
    try {
      // Create a source from the remote stream
      const source = this.audioContext.createMediaStreamSource(stream);
      
      // Create a gain node to control volume
      this.remoteGain = this.audioContext.createGain();
      this.remoteGain.gain.value = 1.0; // Default volume
      
      // Connect the source to the gain node and then to the destination (speakers)
      source.connect(this.remoteGain);
      this.remoteGain.connect(this.audioContext.destination);
      
      console.log("Remote stream connected to audio context");
    } catch (e) {
      console.error("Error connecting remote stream to audio context:", e);
    }
  }

  setRemoteVolume(volume: number) {
    if (this.remoteGain) {
      // Scale volume from 0-100 to 0-2 (allowing a bit of boost)
      const scaledVolume = volume / 50;
      this.remoteGain.gain.value = scaledVolume;
      console.log("Remote volume set to:", scaledVolume);
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  clearStreams() {
    if (this.remoteGain) {
      this.remoteGain.disconnect();
      this.remoteGain = null;
    }
    this.localStream = null;
    this.remoteStream = null;
  }
}
