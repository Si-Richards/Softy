import { useState, useEffect } from 'react';
import { useToast } from './use-toast';

interface MediaDeviceInfo {
  deviceId: string;
  label: string;
  kind: string;
}

export const useMediaDevices = () => {
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>('');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>('');
  const [selectedVideoInput, setSelectedVideoInput] = useState<string>('');
  const { toast } = useToast();

  const updateSelectedAudioInput = (deviceId: string) => {
    localStorage.setItem('selectedAudioInput', deviceId);
    setSelectedAudioInput(deviceId);
    console.log("Audio input device set to:", deviceId);
  };

  const updateSelectedAudioOutput = (deviceId: string) => {
    localStorage.setItem('selectedAudioOutput', deviceId);
    setSelectedAudioOutput(deviceId);
    console.log("Audio output device set to:", deviceId);
  };

  const updateSelectedVideoInput = (deviceId: string) => {
    localStorage.setItem('selectedVideoInput', deviceId);
    setSelectedVideoInput(deviceId);
    console.log("Video input device set to:", deviceId);
  };

  const loadDevices = async () => {
    try {
      // Request permission to access media devices
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const inputs = devices.filter(device => device.kind === 'audioinput');
      const outputs = devices.filter(device => device.kind === 'audiooutput');
      const videos = devices.filter(device => device.kind === 'videoinput');
      
      setAudioInputs(inputs);
      setAudioOutputs(outputs);
      setVideoInputs(videos);
      
      console.log("Available devices:", { inputs, outputs, videos });
      
      // Load saved preferences
      const savedAudioInput = localStorage.getItem('selectedAudioInput');
      const savedAudioOutput = localStorage.getItem('selectedAudioOutput');
      const savedVideoInput = localStorage.getItem('selectedVideoInput');
      
      // Set devices from storage or set defaults if available
      if (savedAudioInput && inputs.some(d => d.deviceId === savedAudioInput)) {
        setSelectedAudioInput(savedAudioInput);
      } else if (inputs.length > 0) {
        updateSelectedAudioInput(inputs[0].deviceId);
      }
      
      if (savedAudioOutput && outputs.some(d => d.deviceId === savedAudioOutput)) {
        setSelectedAudioOutput(savedAudioOutput);
      } else if (outputs.length > 0) {
        updateSelectedAudioOutput(outputs[0].deviceId);
      }
      
      if (savedVideoInput && videos.some(d => d.deviceId === savedVideoInput)) {
        setSelectedVideoInput(savedVideoInput);
      } else if (videos.length > 0) {
        updateSelectedVideoInput(videos[0].deviceId);
      }
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
    setSelectedAudioInput: updateSelectedAudioInput,
    setSelectedAudioOutput: updateSelectedAudioOutput,
    setSelectedVideoInput: updateSelectedVideoInput,
  };
};
