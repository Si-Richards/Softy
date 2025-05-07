
export class JanusMediaHandler {
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private audioOutputDevice: string | null = null;
  private activeAudioElements: HTMLMediaElement[] = [];

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
      
      // Apply audio output to all active elements when we get a new stream
      if (this.activeAudioElements.length > 0) {
        console.log(`Applying audio output to ${this.activeAudioElements.length} active elements`);
        this.activeAudioElements.forEach(element => {
          element.srcObject = stream;
          
          // Ensure we start playing - this is crucial for audio to work
          if (element.paused) {
            element.play().catch(err => console.error("Error playing audio:", err));
          }
          
          this.applyAudioOutputToElement(element);
        });
      }
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
    console.log("Setting audio output device to:", deviceId);
    this.audioOutputDevice = deviceId;
    if (deviceId) {
      localStorage.setItem('selectedAudioOutput', deviceId);
      
      // Apply to all active elements
      this.activeAudioElements.forEach(element => {
        this.applyAudioOutputToElement(element);
      });
    }
  }

  getAudioOutputDevice(): string | null {
    return this.audioOutputDevice;
  }

  applyAudioOutputToElement(element: HTMLMediaElement | null) {
    if (!element) return;
    
    // Track this element for future updates
    if (!this.activeAudioElements.includes(element)) {
      this.activeAudioElements.push(element);
    }
    
    // Apply the selected output device if available
    if (this.audioOutputDevice) {
      // Use the setSinkId API if available (Chrome, Edge)
      if ('setSinkId' in element) {
        try {
          // TypeScript doesn't know about setSinkId yet
          console.log(`Setting audio output device ${this.audioOutputDevice} to element`, element);
          (element as any).setSinkId(this.audioOutputDevice)
            .then(() => console.log(`Audio output device set to ${this.audioOutputDevice}`))
            .catch((error: any) => console.error("Error setting audio output device:", error));
        } catch (error) {
          console.error("Error applying audio output device:", error);
        }
      } else {
        console.warn("setSinkId not supported in this browser");
      }
    }
    
    // Ensure the element is playing if it has content
    if (element.srcObject && element.paused) {
      console.log("Starting playback of audio element with remote stream");
      element.play()
        .then(() => console.log("Audio playback started successfully"))
        .catch(err => console.error("Error playing audio:", err));
    }
  }

  clearStreams() {
    console.log("Clearing all streams");
    this.localStream = null;
    this.remoteStream = null;
    
    // Clear all active elements
    this.activeAudioElements.forEach(element => {
      if (element && element.srcObject) {
        element.srcObject = null;
      }
    });
    this.activeAudioElements = [];
  }
}
