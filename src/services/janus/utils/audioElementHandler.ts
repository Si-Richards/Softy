
/**
 * Simplified audio element handler - audio handling centralized in SipCallManager
 */
export class AudioElementHandler {
  /**
   * Get or create the remote audio element (for compatibility only)
   */
  static getAudioElement(): HTMLAudioElement {
    let audioElement = document.getElementById('remoteAudio') as HTMLAudioElement;
    
    if (!audioElement) {
      console.log("AudioElementHandler: Creating audio element (managed by SipCallManager)");
      audioElement = document.createElement('audio');
      audioElement.id = 'remoteAudio';
      audioElement.autoplay = true;
      audioElement.setAttribute('playsinline', '');
      audioElement.controls = false;
      document.body.appendChild(audioElement);
    }
    
    return audioElement;
  }

  /**
   * Compatibility method - actual stream handling in SipCallManager
   */
  static async playStream(stream: MediaStream | null): Promise<void> {
    console.log("AudioElementHandler: playStream called (handled by SipCallManager)");
  }

  /**
   * Set audio output device
   */
  static async setAudioOutput(deviceId: string): Promise<void> {
    const audioElement = this.getAudioElement();
    
    if ('setSinkId' in HTMLAudioElement.prototype) {
      try {
        await (audioElement as any).setSinkId(deviceId);
        console.log("AudioElementHandler: Audio output set to:", deviceId);
      } catch (error) {
        console.error("AudioElementHandler: Error setting audio output:", error);
      }
    } else {
      console.warn("AudioElementHandler: setSinkId not supported");
    }
  }

  /**
   * Log current audio state
   */
  static logAudioState(): void {
    const audioElement = this.getAudioElement();
    console.log("AudioElementHandler: Audio state:", {
      hasSource: !!audioElement.srcObject,
      volume: audioElement.volume,
      muted: audioElement.muted,
      paused: audioElement.paused
    });
  }

  /**
   * Compatibility method - actual handling in SipCallManager
   */
  static async forcePlay(): Promise<void> {
    console.log("AudioElementHandler: forcePlay called (handled by SipCallManager)");
  }
}
