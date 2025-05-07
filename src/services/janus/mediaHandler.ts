
export class JanusMediaHandler {
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyzer: AnalyserNode | null = null;

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
      // Check if this is a new stream or the same one
      const isNewStream = !this.remoteStream || 
                          this.remoteStream.id !== stream.id;
      
      if (isNewStream) {
        console.log("New remote stream detected");
        
        // Process and enable audio tracks
        const audioTracks = stream.getAudioTracks();
        console.log(`Remote stream has ${audioTracks.length} audio tracks`);
        
        audioTracks.forEach(track => {
          console.log("Remote audio track:", {
            label: track.label,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
            id: track.id
          });
          
          // Explicitly enable remote audio tracks
          if (!track.enabled) {
            console.log("Enabling disabled remote audio track");
            track.enabled = true;
          }
          
          // Add track ended event listener
          track.addEventListener('ended', () => {
            console.warn(`Audio track ${track.id} ended`);
          });
          
          // Add track muted event listeners
          track.addEventListener('mute', () => {
            console.warn(`Audio track ${track.id} muted, attempting to unmute`);
            setTimeout(() => { track.enabled = true; }, 100);
          });
        });
        
        // Setup audio analyzer
        try {
          if (window.AudioContext && audioTracks.length > 0) {
            // Clean up any previous audio context
            if (this.audioContext) {
              this.audioContext.close();
            }
            
            this.audioContext = new AudioContext();
            const source = this.audioContext.createMediaStreamSource(stream);
            this.analyzer = this.audioContext.createAnalyser();
            source.connect(this.analyzer);
            
            // Log that we've set up audio monitoring
            console.log("Audio analyzer connected to remote stream");
            
            // Monitor audio levels
            this.monitorAudioLevels();
          }
        } catch (error) {
          console.error("Could not initialize audio analyzer:", error);
        }
        
        // Add stream inactive event listener
        stream.addEventListener('inactive', () => {
          console.warn("Remote stream became inactive");
        });
        
        // Add stream active event listener
        stream.addEventListener('active', () => {
          console.log("Remote stream became active");
        });
      }
      
      this.remoteStream = stream;
    } else {
      // Clean up audio context if stream is removed
      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
        this.analyzer = null;
      }
      
      this.remoteStream = null;
    }
  }
  
  private monitorAudioLevels() {
    if (!this.analyzer || !this.remoteStream) return;
    
    const dataArray = new Uint8Array(this.analyzer.frequencyBinCount);
    let silentFrames = 0;
    
    const checkLevel = () => {
      if (!this.analyzer || !this.remoteStream) return;
      
      this.analyzer.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      
      // Only log every 30 frames (about once per second) to avoid console spam
      if (silentFrames % 30 === 0) {
        console.log(`Audio level: ${average.toFixed(2)}`);
        
        // If we detect silence for too long, log a warning
        if (average < 1 && silentFrames > 90) { // 3 seconds of silence
          console.warn("Possible audio issue: detecting silence for 3+ seconds");
          
          // Re-enable audio tracks as a precaution
          this.remoteStream.getAudioTracks().forEach(track => {
            track.enabled = true;
          });
        }
      }
      
      if (average < 1) {
        silentFrames++;
      } else {
        silentFrames = 0;
      }
      
      // Continue monitoring as long as we have a remote stream
      if (this.remoteStream) {
        requestAnimationFrame(checkLevel);
      }
    };
    
    // Start the monitoring
    requestAnimationFrame(checkLevel);
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  clearStreams() {
    // Clean up audio context if we have one
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.analyzer = null;
    }
    
    this.localStream = null;
    this.remoteStream = null;
  }
}
