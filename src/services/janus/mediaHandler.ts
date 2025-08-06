/**
 * Simplified media handler - only manages local stream
 * Audio handling is now centralized in SipCallManager
 */
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
    console.log("MediaHandler: Remote stream set (handled by SipCallManager):", stream?.id);
    this.remoteStream = stream;
  }

  /**
   * Handle track events - just log, actual handling is in SipCallManager
   */
  handleTrackEvent(event: RTCTrackEvent): void {
    console.log("MediaHandler: Track event received (handled by SipCallManager):", event.track.kind);
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