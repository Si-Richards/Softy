
import { audioStreamManager } from '@/services/janus/audioStreamManager';
import userInteractionService from '@/services/UserInteractionService';

export class JanusMediaHandler {
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private trackListeners: Map<string, () => void> = new Map();
  private autoPlayAttempted: boolean = false;
  private audioElement: HTMLAudioElement | null = null;

  constructor() {
    // Don't create audio element here - let AudioStreamManager handle it
    console.log("📱 JanusMediaHandler initialized");
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
      
      // Log audio track information
      stream.getAudioTracks().forEach((track, idx) => {
        console.log(`Remote audio track ${idx}:`, {
          id: track.id,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          label: track.label
        });
        
        // Explicitly enable remote audio tracks
        if (!track.enabled) {
          console.log("Enabling disabled remote audio track");
          track.enabled = true;
        }
        
        // Setup listeners for track status changes
        const onEnded = () => {
          console.warn(`Audio track ${track.id} ended - attempting to re-enable`);
          // Try to re-enable the track if possible
          if (track.readyState !== 'ended') {
            track.enabled = true;
          }
        };
        
        track.addEventListener('ended', onEnded);
        this.trackListeners.set(track.id, onEnded);
        
        // Also listen for muted events
        track.addEventListener('mute', () => {
          console.warn(`Audio track ${track.id} was muted - unmuting`);
          track.enabled = true;
        });
      });
      
      // Use AudioStreamManager for consistent audio handling
      audioStreamManager.setRemoteStream(stream);
    }
    
    this.remoteStream = stream;
  }

  /**
   * Handle track events from the peer connection directly
   */
  handleTrackEvent(event: RTCTrackEvent): void {
    console.log("📡 Incoming track event:", event);
    
    // Log the streams
    console.log("event.streams:", event.streams);
    
    // Check if we have any streams
    if (event.streams.length > 0) {
      const stream = event.streams[0];
      console.log("🎵 Using stream from track event:", stream.id);
      
      // Store the remote stream for future reference
      this.remoteStream = stream;
      
      // Log information about audio tracks
      const tracks = stream.getAudioTracks();
      console.log(`🎤 Audio tracks (${tracks.length}):`, tracks);
      
      // Use AudioStreamManager for consistent handling
      audioStreamManager.setRemoteStream(stream);
    } else {
      console.warn("⚠️ Track event had no streams");
    }
  }

  /**
   * Attempt to auto-play audio without user interaction
   */
  private tryAutoPlayAudio(): void {
    // Only try once per media session
    if (this.autoPlayAttempted) return;
    
    this.autoPlayAttempted = true;
    console.log("🎵 JanusMediaHandler: Attempting to auto-play audio");
    
    if (!userInteractionService.userHasInteracted()) {
      console.log("⚠️ JanusMediaHandler: No user interaction yet");
      return;
    }
    
    // Use AudioStreamManager for consistent playback
    setTimeout(() => {
      audioStreamManager.forcePlay()
        .then(() => {
          console.log("✅ JanusMediaHandler: Auto-play succeeded");
        })
        .catch(error => {
          console.warn("⚠️ JanusMediaHandler: Auto-play failed:", error);
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
  
  getAudioElement(): HTMLAudioElement | null {
    return audioStreamManager.getAudioElement();
  }

  clearStreams() {
    this.clearTrackListeners();
    
    // Use AudioStreamManager for cleanup
    audioStreamManager.cleanup();
    
    this.localStream = null;
    this.remoteStream = null;
    this.autoPlayAttempted = false;
  }
}
