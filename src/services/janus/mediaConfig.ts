
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
    
    // Only include video constraints if explicitly requested with a device
    return {
      audio: audioConstraints,
      video: false // Default to no video
    };
  }

  getCallMediaConfig(isVideoCall: boolean): MediaConfig {
    return {
      audioRecv: true, // Always receive audio
      videoRecv: isVideoCall,
      audioSend: true, // Always send audio
      videoSend: isVideoCall,
      removeAudio: false, // Never remove audio
      removeVideo: !isVideoCall
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
