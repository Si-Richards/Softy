
import { AudioCallOptions } from './sip/types';

interface MediaConfig {
  audioRecv: boolean;
  audioSend: boolean;
  removeAudio: boolean;
}

export class MediaConfigHandler {
  getCallMediaConstraints(options?: AudioCallOptions): MediaStreamConstraints {
    // Get stored device IDs or use options if provided
    const audioInput = options?.audioInput || localStorage.getItem('selectedAudioInput');
    
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
    
    return {
      audio: audioConstraints,
      video: false
    };
  }

  getCallMediaConfig(): MediaConfig {
    return {
      audioRecv: true,
      audioSend: true,
      removeAudio: false
    };
  }

  getAnswerMediaConfig(): MediaConfig {
    return {
      audioRecv: true,
      audioSend: true,
      removeAudio: false
    };
  }
}
