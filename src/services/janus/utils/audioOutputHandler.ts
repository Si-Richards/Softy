
/**
 * Helper class to manage audio output device selection
 */
export class AudioOutputHandler {
  /**
   * Set up remote audio with the specified output device
   * Simplified - SipCallManager handles creation
   */
  static setupRemoteAudio(stream: MediaStream, deviceId?: string): void {
    console.log("AudioOutputHandler: setupRemoteAudio called - handled by SipCallManager");
  }
  
  /**
   * Check and play remote audio stream
   * Simplified for SipCallManager compatibility
   */
  static async checkAndPlayRemoteAudio(): Promise<boolean> {
    try {
      const audioElement = document.getElementById('remoteAudio') as HTMLAudioElement;
      if (!audioElement || !audioElement.srcObject) {
        return false;
      }
      if (!audioElement.paused) {
        return true;
      }
      await audioElement.play();
      return true;
    } catch (error) {
      console.error("Error playing audio:", error);
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
