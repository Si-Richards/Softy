
import { useState, useEffect } from 'react';

interface AudioSettings {
  noiseCancellation: boolean;
  echoSuppression: boolean;
  autoGainControl: boolean;
  highPassFilter: boolean;
  selectedAudioInput: string;
  selectedAudioOutput: string;
}

interface VideoSettings {
  videoEnabled: boolean;
  hdVideo: boolean;
  selectedVideoInput: string;
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
    };
  });

  const [videoSettings, setVideoSettings] = useState<VideoSettings>(() => {
    const saved = localStorage.getItem('videoSettings');
    return saved ? JSON.parse(saved) : {
      videoEnabled: true,
      hdVideo: false,
      selectedVideoInput: '',
    };
  });

  useEffect(() => {
    localStorage.setItem('audioSettings', JSON.stringify(audioSettings));
  }, [audioSettings]);

  useEffect(() => {
    localStorage.setItem('videoSettings', JSON.stringify(videoSettings));
  }, [videoSettings]);

  return {
    audioSettings,
    setAudioSettings,
    videoSettings,
    setVideoSettings,
  };
};
