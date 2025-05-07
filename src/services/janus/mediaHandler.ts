
export class JanusMediaHandler {
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

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
}
