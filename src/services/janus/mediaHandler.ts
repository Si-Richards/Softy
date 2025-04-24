
export class JanusMediaHandler {
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private audioOutputDevice: string | null = null;

  constructor() {
    // Initialize with saved audio output device
    this.audioOutputDevice = localStorage.getItem('selectedAudioOutput');
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
        track.enabled = true;
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

  setAudioOutputDevice(deviceId: string | null) {
    this.audioOutputDevice = deviceId;
    if (deviceId) {
      localStorage.setItem('selectedAudioOutput', deviceId);
    }
  }

  getAudioOutputDevice(): string | null {
    return this.audioOutputDevice;
  }

  applyAudioOutputToElement(element: HTMLMediaElement | null) {
    if (!element || !this.audioOutputDevice) return;
    
    // Use the setSinkId API if available (Chrome, Edge)
    if ('setSinkId' in element) {
      try {
        // TypeScript doesn't know about setSinkId yet
        (element as any).setSinkId(this.audioOutputDevice)
          .then(() => console.log(`Audio output device set to ${this.audioOutputDevice}`))
          .catch((error: any) => console.error("Error setting audio output device:", error));
      } catch (error) {
        console.error("Error applying audio output device:", error);
      }
    }
  }

  clearStreams() {
    this.localStream = null;
    this.remoteStream = null;
  }
}
