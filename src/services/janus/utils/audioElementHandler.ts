
/**
 * Minimal audio element handler - SipCallManager handles all audio
 */
export class AudioElementHandler {
  /**
   * Get existing audio element (SipCallManager creates it)
   */
  static getAudioElement(): HTMLAudioElement | null {
    return document.getElementById('remoteAudio') as HTMLAudioElement;
  }

  /**
   * Set audio output device on existing element
   */
  static async setAudioOutput(deviceId: string): Promise<void> {
    const audioElement = this.getAudioElement();
    
    if (audioElement && 'setSinkId' in HTMLAudioElement.prototype) {
      try {
        await (audioElement as any).setSinkId(deviceId);
        console.log("🎵 Audio output set to:", deviceId);
      } catch (error) {
        console.error("🎵 Error setting audio output:", error);
      }
    }
  }

  /**
   * Compatibility methods - no-op (SipCallManager handles audio)
   */
  static async playStream(stream: MediaStream | null): Promise<void> {
    console.log("🎵 playStream called (no-op, handled by SipCallManager)");
  }

  static async forcePlay(): Promise<void> {
    console.log("🎵 forcePlay called (no-op, handled by SipCallManager)");
  }

  static logAudioState(): void {
    const audioElement = this.getAudioElement();
    if (audioElement) {
      console.log("🎵 Audio state:", {
        hasSource: !!audioElement.srcObject,
        volume: audioElement.volume,
        muted: audioElement.muted,
        paused: audioElement.paused
      });
    } else {
      console.log("🎵 No audio element found");
    }
  }

  static async checkAndPlayRemoteAudio(): Promise<boolean> {
    console.log("🎵 checkAndPlayRemoteAudio called (no-op, handled by SipCallManager)");
    return false;
  }

  /**
   * Simple user interaction prompt for autoplay issues
   */
  static async promptForUserInteraction(): Promise<boolean> {
    return new Promise((resolve) => {
      console.log("🎵 Prompting for user interaction");
      
      // Create simple overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      `;
      
      const modal = document.createElement('div');
      modal.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
      `;
      
      modal.innerHTML = `
        <p>Click to enable audio</p>
        <button style="margin-top: 10px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Enable Audio
        </button>
      `;
      
      const button = modal.querySelector('button');
      button?.addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(true);
      });
      
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      
      // Auto-dismiss after 10 seconds
      setTimeout(() => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
          resolve(false);
        }
      }, 10000);
    });
  }
}
