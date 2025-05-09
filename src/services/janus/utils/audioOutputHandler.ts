
/**
 * Helper class to manage audio output device selection
 */
export class AudioOutputHandler {
  /**
   * Set up remote audio with the specified output device
   */
  static setupRemoteAudio(stream: MediaStream, deviceId: string): void {
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
      
      // Set the audio output device if the browser supports it
      if ('setSinkId' in HTMLAudioElement.prototype) {
        (audioElement as any).setSinkId(deviceId)
          .then(() => console.log("Audio output set to:", deviceId))
          .catch((e: any) => console.error("Error setting audio output:", e));
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
}
