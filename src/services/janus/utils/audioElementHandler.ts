
/**
 * Utility to handle consistent access to the audio element
 */
export class AudioElementHandler {
  /**
   * Get the main audio element, creating it if it doesn't exist
   */
  static getAudioElement(): HTMLAudioElement {
    let audio = document.getElementById("remoteAudio") as HTMLAudioElement;
    
    if (!audio) {
      console.log("Creating main audio element as it doesn't exist");
      audio = document.createElement('audio');
      audio.id = 'remoteAudio';
      audio.autoplay = true;
      audio.setAttribute('playsinline', '');
      audio.dataset.mainAudio = 'true';
      document.body.appendChild(audio);
      
      // Set up debug event handlers
      audio.onplay = () => console.log("Audio playback started");
      audio.onpause = () => console.log("Audio playback paused");
      audio.onended = () => console.log("Audio playback ended");
      audio.onerror = (e) => console.error("Audio error:", e);
    }
    
    return audio;
  }
  
  /**
   * Play audio with the provided stream
   */
  static playStream(stream: MediaStream | null): Promise<void> {
    if (!stream) {
      console.warn("Attempted to play null stream");
      return Promise.reject("No stream provided");
    }
    
    console.log("Playing stream:", stream.id);
    console.log("Stream audio tracks:", stream.getAudioTracks().length);
    
    const audio = this.getAudioElement();
    audio.srcObject = stream;
    
    return audio.play()
      .then(() => {
        console.log("Audio playback started successfully");
        return Promise.resolve();
      })
      .catch(error => {
        console.error("Error playing audio:", error);
        
        // Make audio visible with controls if autoplay fails
        audio.controls = true;
        audio.style.display = 'block';
        audio.style.position = 'fixed';
        audio.style.bottom = '10px';
        audio.style.right = '10px';
        audio.style.zIndex = '1000';
        
        return Promise.reject(error);
      });
  }
  
  /**
   * Set output device for audio element
   */
  static setAudioOutput(deviceId: string): Promise<void> {
    const audio = this.getAudioElement();
    
    if ('setSinkId' in HTMLAudioElement.prototype) {
      return (audio as any).setSinkId(deviceId)
        .then(() => {
          console.log("Audio output device set to:", deviceId);
        });
    } else {
      console.warn("setSinkId not supported in this browser");
      return Promise.reject("setSinkId not supported");
    }
  }
  
  /**
   * Log the current audio element state
   */
  static logAudioState(): void {
    const audio = this.getAudioElement();
    console.log("Audio element status:", {
      srcObject: audio.srcObject ? "present" : "null",
      volume: audio.volume,
      muted: audio.muted,
      paused: audio.paused,
      readyState: audio.readyState,
      currentTime: audio.currentTime,
      duration: audio.duration
    });
  }
  
  /**
   * Force audio to play
   */
  static forcePlay(): Promise<void> {
    const audio = this.getAudioElement();
    
    if (!audio.srcObject) {
      console.warn("No stream attached to audio element");
      return Promise.reject("No stream to play");
    }
    
    // Try to play unmuted first
    return audio.play()
      .catch(error => {
        console.warn("Normal play failed, trying with mute/unmute:", error);
        
        // Try muted play as a fallback (some browsers allow this)
        audio.muted = true;
        return audio.play().then(() => {
          // Small delay before unmuting
          setTimeout(() => {
            audio.muted = false;
          }, 300);
        });
      });
  }
}
