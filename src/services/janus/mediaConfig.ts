
interface MediaConfig {
  audioRecv: boolean;
  videoRecv: boolean;
  audioSend: boolean;
  videoSend: boolean;
  removeAudio: boolean;
  removeVideo: boolean;
}

export class MediaConfigHandler {
  getCallMediaConstraints(): MediaStreamConstraints {
    const audioInput = localStorage.getItem('selectedAudioInput');
    const videoInput = localStorage.getItem('selectedVideoInput');
    
    // Ensure we're explicitly requesting audio with echo cancellation and noise suppression
    const audioConstraints = audioInput 
      ? { 
          deviceId: { exact: audioInput }, 
          echoCancellation: true, 
          noiseSuppression: true,
          autoGainControl: true
        }
      : { 
          echoCancellation: true, 
          noiseSuppression: true,
          autoGainControl: true
        };
    
    return {
      audio: audioConstraints,
      video: videoInput ? { deviceId: { exact: videoInput } } : false
    };
  }

  getCallMediaConfig(videoInput: string | null): MediaConfig {
    return {
      audioRecv: true,  // Always receive audio
      videoRecv: true,  // Always be ready to receive video even if not displaying
      audioSend: true,  // Always send audio
      videoSend: !!videoInput, // Only send video if a camera is selected
      removeAudio: false, // Never remove audio
      removeVideo: !videoInput // Remove video if no camera is selected
    };
  }

  getAnswerMediaConfig(): MediaConfig {
    // For answering calls, ensure we are ready to receive all media
    return {
      audioRecv: true,
      videoRecv: true,
      audioSend: true,
      videoSend: true,
      removeAudio: false,
      removeVideo: false
    };
  }
}
