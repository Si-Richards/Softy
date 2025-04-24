import { useState, useEffect } from 'react';
import { useToast } from './use-toast';

interface MediaDevice {
  deviceId: string;
  label: string;
  kind: string;
}

export const useMediaDevices = () => {
  const [audioInputs, setAudioInputs] = useState<MediaDevice[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDevice[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDevice[]>([]);
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>('');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>('');
  const [selectedVideoInput, setSelectedVideoInput] = useState<string>('');
  const { toast } = useToast();

  const setSelectedAudioInput = (deviceId: string) => {
    localStorage.setItem('selectedAudioInput', deviceId);
    setSelectedAudioInput(deviceId);
  };

  const setSelectedAudioOutput = (deviceId: string) => {
    localStorage.setItem('selectedAudioOutput', deviceId);
    setSelectedAudioOutput(deviceId);
  };

  const setSelectedVideoInput = (deviceId: string) => {
    localStorage.setItem('selectedVideoInput', deviceId);
    setSelectedVideoInput(deviceId);
  };

  const loadDevices = async () => {
    try {
      // Request permission to access media devices
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      setAudioInputs(devices.filter(device => device.kind === 'audioinput'));
      setAudioOutputs(devices.filter(device => device.kind === 'audiooutput'));
      setVideoInputs(devices.filter(device => device.kind === 'videoinput'));
      
      // Set defaults if available
      const defaultAudioInput = devices.find(d => d.kind === 'audioinput')?.deviceId;
      const defaultAudioOutput = devices.find(d => d.kind === 'audiooutput')?.deviceId;
      const defaultVideoInput = devices.find(d => d.kind === 'videoinput')?.deviceId;
      
      if (defaultAudioInput) setSelectedAudioInput(defaultAudioInput);
      if (defaultAudioOutput) setSelectedAudioOutput(defaultAudioOutput);
      if (defaultVideoInput) setSelectedVideoInput(defaultVideoInput);
    } catch (error) {
      console.error('Error loading devices:', error);
      toast({
        title: "Device Access Error",
        description: "Could not access media devices. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Load saved preferences
    const savedAudioInput = localStorage.getItem('selectedAudioInput');
    const savedAudioOutput = localStorage.getItem('selectedAudioOutput');
    const savedVideoInput = localStorage.getItem('selectedVideoInput');

    if (savedAudioInput) setSelectedAudioInput(savedAudioInput);
    if (savedAudioOutput) setSelectedAudioOutput(savedAudioOutput);
    if (savedVideoInput) setSelectedVideoInput(savedVideoInput);

    loadDevices();

    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
    };
  }, []);

  return {
    audioInputs,
    audioOutputs,
    videoInputs,
    selectedAudioInput,
    selectedAudioOutput,
    selectedVideoInput,
    setSelectedAudioInput,
    setSelectedAudioOutput,
    setSelectedVideoInput,
  };
};
