
/**
 * Helper class to manage audio output device selection
 */
export class AudioOutputHandler {
  /**
   * Set up remote audio with the specified output device
   */
  static setupRemoteAudio(stream: MediaStream, deviceId?: string): void {
    if (!stream) {
      console.warn("No stream provided to setupRemoteAudio");
      return;
    }
    
    console.log("Setting up remote audio with output device:", deviceId);
    
    try {
      // Get the audio element
      const audioElement = document.getElementById('remoteAudio') as HTMLAudioElement;
      
      if (!audioElement) {
        console.warn("Audio element not found");
        return;
      }
      
      // Set the stream to the audio element
      if (audioElement.srcObject !== stream) {
        audioElement.srcObject = stream;
        console.log("Updated audio element with new stream");
      }
      
      // Set the audio output device if the browser supports it and deviceId is provided
      if (deviceId && 'setSinkId' in HTMLAudioElement.prototype) {
        (audioElement as any).setSinkId(deviceId)
          .then(() => console.log("Audio output set to:", deviceId))
          .catch((e: any) => console.error("Error setting audio output:", e));
      } else if (!deviceId) {
        console.log("No deviceId provided, using default audio output");
      } else {
        console.warn("setSinkId not supported in this browser");
      }
      
      // Try to play the audio
      audioElement.play()
        .then(() => console.log("Audio playback started"))
        .catch(err => {
          console.error("Audio playback failed:", err);
          
          // Make controls visible on error
          audioElement.controls = true;
          audioElement.style.display = 'block';
          audioElement.style.position = 'fixed';
          audioElement.style.bottom = '10px';
          audioElement.style.right = '10px';
          audioElement.style.zIndex = '1000';
        });
    } catch (error) {
      console.error("Error in setupRemoteAudio:", error);
    }
  }
  
  /**
   * Check and play remote audio stream
   * This method checks the current audio element status and tries to play any attached stream
   */
  static async checkAndPlayRemoteAudio(): Promise<boolean> {
    try {
      const audioElement = document.getElementById('remoteAudio') as HTMLAudioElement;
      
      if (!audioElement) {
        console.warn("Audio element not found when checking remote audio");
        return false;
      }
      
      console.log("Checking remote audio element:", {
        hasStream: !!audioElement.srcObject,
        paused: audioElement.paused,
        muted: audioElement.muted,
        volume: audioElement.volume
      });
      
      // If no stream is attached, we can't play anything
      if (!audioElement.srcObject) {
        console.warn("No stream attached to audio element");
        return false;
      }
      
      // If audio is already playing, no need to do anything
      if (!audioElement.paused) {
        console.log("Audio is already playing");
        return true;
      }
      
      // Try to play the audio
      await audioElement.play();
      console.log("Successfully played audio after check");
      return true;
    } catch (error) {
      console.error("Error checking and playing remote audio:", error);
      
      // As a fallback, make the audio controls visible
      const audioElement = document.getElementById('remoteAudio') as HTMLAudioElement;
      if (audioElement) {
        audioElement.controls = true;
        audioElement.style.display = 'block';
        audioElement.style.position = 'fixed';
        audioElement.style.bottom = '10px';
        audioElement.style.right = '10px';
        audioElement.style.zIndex = '1000';
      }
      
      return false;
    }
  }
  
  /**
   * Prompt user for interaction to enable audio playback
   * Returns a promise that resolves to true if user interacted, false otherwise
   */
  static promptForUserInteraction(): Promise<boolean> {
    return new Promise((resolve) => {
      // Create a modal overlay
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      overlay.style.display = 'flex';
      overlay.style.justifyContent = 'center';
      overlay.style.alignItems = 'center';
      overlay.style.zIndex = '10000';
      overlay.style.flexDirection = 'column';
      
      // Create message text
      const message = document.createElement('div');
      message.textContent = 'Click to enable audio';
      message.style.color = 'white';
      message.style.fontSize = '18px';
      message.style.marginBottom = '20px';
      
      // Create button
      const button = document.createElement('button');
      button.textContent = 'Enable Audio';
      button.style.padding = '10px 20px';
      button.style.fontSize = '16px';
      button.style.cursor = 'pointer';
      button.style.backgroundColor = '#4CAF50';
      button.style.color = 'white';
      button.style.border = 'none';
      button.style.borderRadius = '4px';
      
      // Add elements to the overlay
      overlay.appendChild(message);
      overlay.appendChild(button);
      document.body.appendChild(overlay);
      
      // Handle click events
      button.addEventListener('click', () => {
        // Remove the overlay
        document.body.removeChild(overlay);
        
        // Try to play audio
        this.checkAndPlayRemoteAudio()
          .then(success => {
            console.log("Audio play after user interaction:", success ? "succeeded" : "failed");
          })
          .catch(err => console.warn("Error playing audio after interaction:", err));
        
        // Resolve with true to indicate user interacted
        resolve(true);
      });
      
      // Auto-dismiss after 20 seconds
      setTimeout(() => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
          resolve(false);
        }
      }, 20000);
    });
  }
}
