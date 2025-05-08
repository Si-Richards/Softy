
import { AudioCallOptions } from './sip/types';

interface MediaConfig {
  audioRecv: boolean;
  videoRecv: boolean;
  audioSend: boolean;
  videoSend: boolean;
  removeAudio: boolean;
  removeVideo: boolean;
}

export class MediaConfigHandler {
  getCallMediaConstraints(options?: AudioCallOptions): MediaStreamConstraints {
    // Get stored device IDs or use options if provided
    const audioInput = options?.audioInput || localStorage.getItem('selectedAudioInput');
    const videoInput = localStorage.getItem('selectedVideoInput');
    
    // Get audio settings from localStorage
    let audioSettings;
    try {
      const storedSettings = localStorage.getItem('audioSettings');
      if (storedSettings) {
        audioSettings = JSON.parse(storedSettings);
      }
    } catch (error) {
      console.error("Error parsing audio settings:", error);
    }
    
    // Apply saved audio input device if available
    console.log("Using audio input device:", audioInput || "default");
    
    // Enhanced audio constraints with saved preferences
    const audioConstraints = audioInput 
      ? { 
          deviceId: { exact: audioInput }, 
          echoCancellation: options?.echoCancellation !== undefined ? options.echoCancellation : audioSettings?.echoSuppression !== false,
          noiseSuppression: options?.noiseSuppression !== undefined ? options.noiseSuppression : audioSettings?.noiseCancellation !== false,
          autoGainControl: options?.autoGainControl !== undefined ? options.autoGainControl : audioSettings?.autoGainControl !== false
        }
      : { 
          echoCancellation: options?.echoCancellation !== undefined ? options.echoCancellation : audioSettings?.echoSuppression !== false, 
          noiseSuppression: options?.noiseSuppression !== undefined ? options.noiseSuppression : audioSettings?.noiseCancellation !== false,
          autoGainControl: options?.autoGainControl !== undefined ? options.autoGainControl : audioSettings?.autoGainControl !== false
        };
    
    console.log("Using audio constraints:", audioConstraints);
    
    // Only include video constraints if explicitly requested with a device
    return {
      audio: audioConstraints,
      video: false // Default to no video for audio calls
    };
  }

  getCallMediaConfig(isVideoCall: boolean): MediaConfig {
    return {
      audioRecv: true,
      videoRecv: isVideoCall,
      audioSend: true,
      videoSend: isVideoCall,
      removeAudio: false, // Never remove audio
      removeVideo: !isVideoCall
    };
  }

  getAnswerMediaConfig(isVideoCall: boolean = false): MediaConfig {
    return {
      audioRecv: true,
      videoRecv: isVideoCall,
      audioSend: true,
      videoSend: isVideoCall,
      removeAudio: false, // Never remove audio
      removeVideo: !isVideoCall
    };
  }
}
