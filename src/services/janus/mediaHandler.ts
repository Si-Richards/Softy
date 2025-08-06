
import audioService from '@/services/AudioService';
import userInteractionService from '@/services/UserInteractionService';

export class JanusMediaHandler {
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private trackListeners: Map<string, () => void> = new Map();
  private autoPlayAttempted: boolean = false;
  private audioElement: HTMLAudioElement | null = null;

  constructor() {
    // Create the remote audio element on initialization
    this.ensureAudioElement();
  }

  /**
   * Ensure the remote audio element exists and is properly configured
   */
  private ensureAudioElement(): HTMLAudioElement {
    if (!this.audioElement) {
      // Check if the element already exists in the DOM
      let audioElement = document.getElementById('remoteAudio') as HTMLAudioElement;
      
      if (!audioElement) {
        console.log("Creating new remoteAudio element");
        audioElement = document.createElement('audio');
        audioElement.id = 'remoteAudio';
        audioElement.autoplay = true;
        audioElement.setAttribute('playsinline', '');
        audioElement.controls = false; // Will be shown only if autoplay fails
        audioElement.style.display = 'none';
        document.body.appendChild(audioElement);
      } else {
        console.log("Using existing remoteAudio element");
      }
      
      // Set up event listeners for debugging
      audioElement.onplay = () => console.log("Audio element started playing");
      audioElement.onpause = () => console.warn("Audio element paused");
      audioElement.onended = () => console.warn("Audio playback ended unexpectedly");
      audioElement.onerror = (event) => console.error("Audio element error:", event);
      
      this.audioElement = audioElement;
    }
    
    return this.audioElement;
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
      
      // Get or create audio element
      const audioElement = this.ensureAudioElement();
      
      // Assign the stream to the audio element
      audioElement.srcObject = stream;
      
      // Try to play the audio
      audioElement.play()
        .then(() => {
          console.log("Audio playback started successfully");
        })
        .catch(err => {
          console.warn("Audio playback failed to autostart:", err);
          this.tryAutoPlayAudio();
        });
      
      // Also use the audio service as a fallback
      audioService.attachStream(stream);
    }
    
    this.remoteStream = stream;
  }

  /**
   * Handle track events from the peer connection directly
   */
  handleTrackEvent(event: RTCTrackEvent): void {
    console.log("Incoming track event:", event);
    
    // Log the streams
    console.log("event.streams:", event.streams);
    
    // Check if we have any streams
    if (event.streams.length > 0) {
      const stream = event.streams[0];
      console.log("Using stream from track event:", stream.id);
      
      // Get the audio element
      const audioElement = this.ensureAudioElement();
      
      // Set the stream as the source object
      audioElement.srcObject = stream;
      
      // Try to play the audio element
      audioElement.play()
        .then(() => console.log("Audio playback started from track event"))
        .catch(err => {
          console.error("Playback error:", err);
          this.tryAutoPlayAudio();
        });
      
      // Store the remote stream for future reference
      this.remoteStream = stream;
      
      // Log information about audio tracks
      const tracks = stream.getAudioTracks();
      console.log(`Audio tracks (${tracks.length}):`, tracks);
      
      // Attach to audio service as well for redundancy
      audioService.attachStream(stream);
    } else {
      console.warn("Track event had no streams");
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
      
      // Show audio element with controls as a visual cue
      const audioElement = this.ensureAudioElement();
      audioElement.controls = true;
      audioElement.style.display = 'block';
      audioElement.style.position = 'fixed';
      audioElement.style.bottom = '20px';
      audioElement.style.right = '20px';
      audioElement.style.zIndex = '9999';
      
      // Show prompt for user interaction if needed
      audioService.promptForUserInteraction()
        .then(interacted => {
          if (interacted) {
            console.log("JanusMediaHandler: User interacted with prompt");
            setTimeout(() => {
              const audioElement = this.ensureAudioElement();
              audioElement.play()
                .then(() => console.log("Auto-play after prompt succeeded"))
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
  
  getAudioElement(): HTMLAudioElement | null {
    return this.audioElement;
  }

  clearStreams() {
    this.clearTrackListeners();
    
    // Clear audio element source
    if (this.audioElement) {
      this.audioElement.srcObject = null;
    }
    
    this.localStream = null;
    this.remoteStream = null;
    this.autoPlayAttempted = false;
  }
}
