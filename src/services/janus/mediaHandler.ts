
export class JanusMediaHandler {
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  setLocalStream(stream: MediaStream | null) {
    this.localStream = stream;
  }

  setRemoteStream(stream: MediaStream | null) {
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

