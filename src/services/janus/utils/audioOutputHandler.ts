
/**
 * Utility class for handling audio output device selection and setup
 */
export class AudioOutputHandler {
  /**
   * Set up remote audio with the specified output device
   * @param stream The remote media stream
   * @param deviceId Optional device ID for audio output
   */
  static setupRemoteAudio(stream: MediaStream, deviceId?: string): void {
    if (!stream) {
      console.warn("Cannot setup remote audio: No stream provided");
      return;
    }
    
    // First, check if we have audio tracks
    if (stream.getAudioTracks().length === 0) {
      console.warn("No audio tracks found in remote stream");
      return;
    }
    
    console.log("Setting up remote audio with", deviceId ? `device ID ${deviceId}` : "default device");
    
    // Find existing audio element or create a new one
    let audioElement = document.querySelector('audio#remoteAudio') as HTMLAudioElement;
    if (!audioElement) {
      console.log("Creating new audio element for remote audio");
      audioElement = document.createElement('audio');
      audioElement.id = 'remoteAudio';
      audioElement.autoplay = true;
      audioElement.setAttribute('playsinline', '');
      audioElement.style.display = 'none';
      document.body.appendChild(audioElement);
    }

    // Set the audio output device if the browser supports it and a device ID was provided
    if (deviceId && ('setSinkId' in HTMLAudioElement.prototype)) {
      (audioElement as any).setSinkId(deviceId)
        .then(() => console.log("Audio output set to:", deviceId))
        .catch((e: any) => console.error("Error setting audio output:", e));
    }

    // Attach the stream to the audio element
    audioElement.srcObject = stream;
    
    // Try to play the audio
    if (audioElement.paused) {
      audioElement.play()
        .then(() => console.log("Audio playback started"))
        .catch(e => console.warn("Audio autoplay blocked:", e));
    }
    
    // Set up event listeners for debugging
    if (!audioElement.onended) {
      audioElement.onended = () => console.warn("Audio playback ended unexpectedly");
      audioElement.onpause = () => console.warn("Audio playback paused unexpectedly");
      audioElement.onerror = (event) => console.error("Audio element error:", event);
    }
  }
  
  /**
   * Check if the audio element is playing; if not, try to restart it
   * @returns Promise that resolves to true if audio is playing or was successfully restarted
   */
  static async checkAndPlayRemoteAudio(): Promise<boolean> {
    const audioElement = document.querySelector('audio#remoteAudio') as HTMLAudioElement;
    if (!audioElement) {
      console.warn("No remote audio element found to check");
      return false;
    }
    
    if (!audioElement.paused) {
      console.log("Audio is already playing");
      return true;
    }
    
    if (!audioElement.srcObject) {
      console.warn("No srcObject set on audio element");
      return false;
    }
    
    console.log("Trying to restart audio playback");
    
    try {
      await audioElement.play();
      console.log("Audio playback restarted successfully");
      return true;
    } catch (error) {
      console.warn("Failed to restart audio playback:", error);
      
      // Try with muted first (some browsers allow this) then unmute
      try {
        console.log("Trying to play muted first...");
        audioElement.muted = true;
        await audioElement.play();
        // Small delay then unmute
        await new Promise(resolve => setTimeout(resolve, 100));
        audioElement.muted = false;
        console.log("Workaround succeeded: played muted first, then unmuted");
        return true;
      } catch (e) {
        console.error("Even muted audio playback failed:", e);
        
        // Show controls as a last resort
        console.log("Showing audio controls for user interaction");
        audioElement.controls = true;
        audioElement.style.display = 'block';
        audioElement.style.position = 'fixed';
        audioElement.style.bottom = '20px';
        audioElement.style.right = '20px';
        audioElement.style.width = '300px';
        audioElement.style.zIndex = '9999';
        
        return false;
      }
    }
  }
  
  /**
   * Prompt the user for interaction to enable audio playback
   * @returns Promise that resolves to true if the user interacted, false otherwise
   */
  static promptForUserInteraction(): Promise<boolean> {
    return new Promise((resolve) => {
      // Create a modal overlay with a button
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      overlay.style.display = 'flex';
      overlay.style.justifyContent = 'center';
      overlay.style.alignItems = 'center';
      overlay.style.zIndex = '10000';
      overlay.style.flexDirection = 'column';
      
      const message = document.createElement('div');
      message.textContent = 'Audio permission required';
      message.style.color = 'white';
      message.style.marginBottom = '20px';
      message.style.fontSize = '20px';
      
      const button = document.createElement('button');
      button.textContent = 'Enable Audio';
      button.style.padding = '12px 24px';
      button.style.backgroundColor = '#4CAF50';
      button.style.border = 'none';
      button.style.color = 'white';
      button.style.fontSize = '16px';
      button.style.borderRadius = '4px';
      button.style.cursor = 'pointer';
      
      overlay.appendChild(message);
      overlay.appendChild(button);
      document.body.appendChild(overlay);
      
      // Handle button click
      button.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(true);
      });
    });
  }
}
