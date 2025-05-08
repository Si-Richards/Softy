
import audioService from '@/services/AudioService';

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
    
    // Use our centralized AudioService to get/create the audio element
    const audioElement = audioService.getAudioElement();
    
    // Set the stream using the AudioService
    audioService.attachStream(stream);
    
    // Set the output device if provided and supported
    if (deviceId) {
      audioService.setAudioOutput(deviceId)
        .catch(error => console.warn("Couldn't set audio output:", error));
    }
    
    return audioElement;
  }

  /**
   * Check if the remote audio is playing and attempt to resume it if paused
   */
  static checkAndPlayRemoteAudio(): boolean {
    return audioService.forcePlayAudio()
      .then(success => {
        if (success) {
          console.log("Successfully resumed audio playback");
        }
        return success;
      })
      .catch(error => {
        console.error("Failed to resume audio playback:", error);
        return false;
      });
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
}
