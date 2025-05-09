
import { useState, useEffect } from 'react';

interface AudioSettings {
  noiseCancellation: boolean;
  echoSuppression: boolean;
  autoGainControl: boolean;
  highPassFilter: boolean;
  selectedAudioInput: string;
  selectedAudioOutput: string;
  masterVolume: number;
  ringtoneVolume: number;
}

export const useSettings = () => {
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => {
    const saved = localStorage.getItem('audioSettings');
    return saved ? JSON.parse(saved) : {
      noiseCancellation: true,
      echoSuppression: true,
      autoGainControl: true,
      highPassFilter: false,
      selectedAudioInput: '',
      selectedAudioOutput: '',
      masterVolume: 100,
      ringtoneVolume: 100,
    };
  });

  useEffect(() => {
    localStorage.setItem('audioSettings', JSON.stringify(audioSettings));
  }, [audioSettings]);

  return {
    audioSettings,
    setAudioSettings
  };
};
