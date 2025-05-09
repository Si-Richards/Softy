
import audioService from '@/services/AudioService';
import userInteractionService from '@/services/UserInteractionService';

export class JanusMediaHandler {
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private trackListeners: Map<string, () => void> = new Map();
  private autoPlayAttempted: boolean = false;

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
    
    // Clean up previous track listeners
    this.clearTrackListeners();
    
    if (stream) {
      // Log detailed information about the remote stream
      console.log("Remote stream details:", {
        id: stream.id,
        active: stream.active,
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length,
        userHasInteracted: userInteractionService.userHasInteracted()
      });
      
      // Ensure audio tracks are enabled by default
      stream.getAudioTracks().forEach(track => {
        console.log("Remote audio track:", track.label, "enabled:", track.enabled);
        
        // Explicitly enable remote audio tracks
        if (!track.enabled) {
          console.log("Enabling disabled remote audio track");
          track.enabled = true;
        }
        
        // Directly attach this track to our audio service
        audioService.attachAudioTrack(track);
        
        // Set up listeners for track status changes
        const onEnded = () => {
          console.warn(`Audio track ${track.id} ended - attempting to re-enable`);
          // Try to re-enable the track if possible
          if (track.readyState !== 'ended') {
            track.enabled = true;
          }
          
          // Notify audio service about the ended track
          audioService.handleTrackEnded(track);
        };
        
        track.addEventListener('ended', onEnded);
        this.trackListeners.set(track.id, onEnded);
        
        // Also listen for muted events
        track.addEventListener('mute', () => {
          console.warn(`Audio track ${track.id} was muted - unmuting`);
          track.enabled = true;
        });
      });
      
      // Add stream ended event listener
      stream.addEventListener('inactive', () => {
        console.warn("Remote stream became inactive");
        audioService.handleStreamInactive();
      });
      
      // Auto-play audio as soon as we get the stream
      this.tryAutoPlayAudio();
    }
    
    this.remoteStream = stream;
    
    // Directly attach the stream to our audio service
    if (stream) {
      audioService.attachStream(stream);
    } else {
      // Clear the audio service if stream is null
      audioService.detachStream();
    }
  }

  /**
   * Attempt to auto-play audio without user interaction
   */
  private tryAutoPlayAudio(): void {
    // Only try once per media session
    if (this.autoPlayAttempted) return;
    
    this.autoPlayAttempted = true;
    console.log("JanusMediaHandler: Attempting to auto-play audio");
    
    if (!userInteractionService.userHasInteracted()) {
      console.log("JanusMediaHandler: No user interaction yet, showing prompt");
      
      // Show prompt for user interaction if needed
      audioService.promptForUserInteraction()
        .then(interacted => {
          if (interacted) {
            console.log("JanusMediaHandler: User interacted with prompt");
            setTimeout(() => {
              audioService.forcePlayAudio()
                .then(success => console.log("Auto-play after prompt result:", success))
                .catch(error => console.error("Auto-play error after prompt:", error));
            }, 300);
          }
        });
        
      return;
    }
    
    // Small delay to ensure browser has processed the stream
    setTimeout(() => {
      audioService.forcePlayAudio()
        .then(success => {
          if (success) {
            console.log("JanusMediaHandler: Auto-play succeeded");
          } else {
            console.warn("JanusMediaHandler: Auto-play failed, will need user interaction");
            // Try to prompt for interaction as fallback
            audioService.promptForUserInteraction();
          }
        })
        .catch(error => {
          console.error("JanusMediaHandler: Auto-play error:", error);
        });
    }, 300);
  }

  private clearTrackListeners(): void {
    if (this.remoteStream) {
      this.remoteStream.getAudioTracks().forEach(track => {
        const listener = this.trackListeners.get(track.id);
        if (listener) {
          track.removeEventListener('ended', listener);
          this.trackListeners.delete(track.id);
        }
      });
    }
    this.trackListeners.clear();
    
    // Reset auto-play flag when switching streams
    this.autoPlayAttempted = false;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  getAudioTracks(): MediaStreamTrack[] {
    return this.remoteStream?.getAudioTracks() || [];
  }

  hasAudioTracks(): boolean {
    return this.getAudioTracks().length > 0;
  }

  clearStreams() {
    this.clearTrackListeners();
    audioService.detachStream(); // Make sure to detach from audio service
    this.localStream = null;
    this.remoteStream = null;
    this.autoPlayAttempted = false;
  }
}
