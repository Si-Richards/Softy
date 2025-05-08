
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
    
    // Find or create the remote audio element
    let audioElement = document.querySelector('audio#remoteAudio') as HTMLAudioElement;
    if (!audioElement) {
      audioElement = document.createElement('audio');
      audioElement.id = 'remoteAudio';
      audioElement.autoplay = true;
      audioElement.controls = false;
      audioElement.style.display = 'none';
      document.body.appendChild(audioElement);
      
      // Set volume to maximum
      audioElement.volume = 1.0;
      
      console.log("Created dedicated audio element for remote stream");
    }
    
    // Set the stream
    audioElement.srcObject = stream;
    
    // Set the output device if provided and supported
    if (deviceId && 'setSinkId' in HTMLAudioElement.prototype) {
      this.setAudioOutput(audioElement, deviceId)
        .then(() => console.log("Audio output set to:", deviceId))
        .catch(error => console.warn("Couldn't set audio output:", error));
    } else {
      console.log("Using default audio output device");
    }
    
    // Try to play the audio (may be needed for autoplay policy)
    audioElement.play()
      .then(() => console.log("Remote audio started playing"))
      .catch(error => {
        console.warn("Audio autoplay failed:", error);
        
        // Add click handler to play on user interaction
        const playOnInteraction = () => {
          audioElement.play()
            .then(() => {
              console.log("Audio playing on user interaction");
              document.removeEventListener('click', playOnInteraction);
            })
            .catch(e => console.error("Still failed to play audio:", e));
        };
        
        document.addEventListener('click', playOnInteraction, { once: true });
      });
    
    return audioElement;
  }
}
