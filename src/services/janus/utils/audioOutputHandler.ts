
import audioService from '@/services/AudioService';
import userInteractionService from '@/services/UserInteractionService';

export class AudioOutputHandler {
  /**
   * Sets the audio output device for a media element
   * @param element HTML audio or video element
   * @param deviceId ID of the audio output device
   */
  static setAudioOutput(element: HTMLMediaElement, deviceId: string): Promise<void> {
    if (!element) {
      return Promise.reject(new Error("No media element provided"));
    }
    
    if (!('setSinkId' in HTMLAudioElement.prototype)) {
      console.warn("Audio output device selection is not supported by this browser");
      return Promise.reject(new Error("setSinkId not supported"));
    }
    
    // Cast to any to access the non-standard setSinkId method
    return (element as any).setSinkId(deviceId);
  }
  
  /**
   * Creates or gets the remote audio element and sets the output device
   * @param stream MediaStream to attach to the audio element
   * @param deviceId ID of the audio output device
   */
  static setupRemoteAudio(stream: MediaStream | null, deviceId?: string | null): HTMLAudioElement | null {
    if (!stream) {
      console.warn("No remote stream available");
      return null;
    }
    
    // Make sure the stream has audio tracks before proceeding
    if (stream.getAudioTracks().length === 0) {
      console.warn("Remote stream has no audio tracks");
      return null;
    }
    
    // Log audio tracks information first
    stream.getAudioTracks().forEach((track, idx) => {
      console.log(`Audio track ${idx} details:`, {
        id: track.id,
        kind: track.kind,
        label: track.label,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState,
      });
      
      // Ensure the track is enabled
      track.enabled = true;
    });
    
    // Use the centralized audio service - this is the preferred method
    audioService.attachStream(stream);
    
    // Set the output device if provided and supported
    if (deviceId) {
      console.log("Setting audio output device to:", deviceId);
      audioService.setAudioOutput(deviceId)
        .catch(error => console.warn("Couldn't set audio output:", error));
    }
    
    // Auto-play immediately if we have user interaction
    if (userInteractionService.userHasInteracted()) {
      this.checkAndPlayRemoteAudio()
        .then(success => {
          if (success) {
            console.log("Auto-play succeeded during setupRemoteAudio");
          } else {
            console.warn("Auto-play failed during setupRemoteAudio");
            // Prompt user for interaction if auto-play failed
            audioService.promptForUserInteraction();
          }
        })
        .catch(error => {
          console.error("Error during auto-play:", error);
        });
    } else {
      console.log("No user interaction yet - registering callback for when user interacts");
      userInteractionService.onUserInteraction(() => {
        console.log("User has now interacted - trying to play audio");
        this.checkAndPlayRemoteAudio()
          .then(success => console.log("Playback after interaction:", success ? "succeeded" : "failed"))
          .catch(e => console.warn("Playback after interaction error:", e));
      });
    }
    
    return audioService.getAudioElement();
  }

  /**
   * Check if the remote audio is playing and attempt to resume it if paused
   * @returns Promise that resolves to a boolean indicating if audio is playing
   */
  static async checkAndPlayRemoteAudio(): Promise<boolean> {
    try {
      console.log("AudioOutputHandler: Attempting to force play audio");
      
      // If we don't have user interaction yet, we need to wait
      if (!userInteractionService.userHasInteracted()) {
        console.log("AudioOutputHandler: No user interaction yet, cannot play");
        return false;
      }
      
      // Try different playback methods
      // 1. First, try through the audio service
      const success = await audioService.forcePlayAudio();
      
      if (success) {
        console.log("AudioOutputHandler: Successfully resumed audio playback");
        return true;
      }
      
      console.log("AudioOutputHandler: Audio service couldn't resume playback");
      
      // 2. If audio service fails, try manually handling the audio element
      const audioElement = audioService.getAudioElement();
      if (audioElement && audioElement.paused) {
        try {
          // Apply some browser-specific fixes
          if (/Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)) {
            // Safari needs special handling
            audioElement.muted = false;
            audioElement.volume = 1.0;
          }
          
          // Ensure we're not in a muted state
          audioElement.muted = false;
          audioElement.volume = 1.0;
          
          // Try to play with user gesture simulation
          // This works in some browsers when regular play() fails
          const playPromise = audioElement.play();
          
          if (playPromise) {
            await playPromise;
            console.log("AudioOutputHandler: Manual play succeeded");
            return true;
          }
        } catch (innerError) {
          console.warn("AudioOutputHandler: Manual play attempt failed:", innerError);
        }
      }
      
      return false;
    } catch (error) {
      console.error("AudioOutputHandler: Failed to resume audio playback:", error);
      return false;
    }
  }
  
  /**
   * Show audio controls when autoplay is blocked
   */
  static showAudioControls(): void {
    audioService.showAudioControls();
  }
  
  /**
   * Hide audio controls
   */
  static hideAudioControls(): void {
    audioService.hideAudioControls();
  }
  
  /**
   * Check if audio is currently playing
   */
  static isAudioPlaying(): boolean {
    return audioService.isAudioPlaying();
  }
  
  /**
   * Prompt for user interaction to enable audio
   */
  static promptForUserInteraction(): Promise<boolean> {
    return audioService.promptForUserInteraction();
  }
}
