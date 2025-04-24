
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
    
    // Enhanced audio constraints with fallback options
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
      audioRecv: true,
      videoRecv: true,
      audioSend: true,
      videoSend: !!videoInput,
      removeAudio: false, // Never remove audio
      removeVideo: !videoInput
    };
  }

  getAnswerMediaConfig(): MediaConfig {
    return {
      audioRecv: true,
      videoRecv: true,
      audioSend: true,
      videoSend: true,
      removeAudio: false, // Never remove audio
      removeVideo: false
    };
  }
}
