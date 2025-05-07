
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

  const updateSelectedAudioInput = (deviceId: string) => {
    localStorage.setItem('selectedAudioInput', deviceId);
    setSelectedAudioInput(deviceId);
    
    // Apply the selected input device immediately if possible
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } }
      }).then((stream) => {
        // Stop the stream immediately - we just want to verify it works
        stream.getTracks().forEach(track => track.stop());
        console.log("Audio input device set successfully: ", deviceId);
        toast({
          title: "Audio Input Updated",
          description: "Microphone selection saved",
        });
      }).catch(err => {
        console.error("Error selecting audio input device:", err);
      });
    }
  };

  const updateSelectedAudioOutput = (deviceId: string) => {
    localStorage.setItem('selectedAudioOutput', deviceId);
    setSelectedAudioOutput(deviceId);
    
    // Try to apply to any audio elements if the setSinkId API is available
    try {
      const audioElements = document.querySelectorAll('audio');
      if (audioElements.length > 0 && 'setSinkId' in HTMLAudioElement.prototype) {
        audioElements.forEach((audioEl: any) => {
          if (audioEl.setSinkId) {
            audioEl.setSinkId(deviceId)
              .then(() => {
                console.log("Audio output device set successfully: ", deviceId);
                toast({
                  title: "Audio Output Updated",
                  description: "Speaker selection saved",
                });
              })
              .catch((err: any) => {
                console.error("Error setting audio output device:", err);
              });
          }
        });
      } else {
        console.log("Audio output device saved but cannot be applied (no audio elements or setSinkId not supported)");
        toast({
          title: "Audio Output Updated",
          description: "Speaker selection saved",
        });
      }
    } catch (error) {
      console.error("Error applying audio output device:", error);
      toast({
        title: "Audio Output Updated",
        description: "Speaker selection saved (some browsers may not support this feature)",
      });
    }
  };

  const updateSelectedVideoInput = (deviceId: string) => {
    localStorage.setItem('selectedVideoInput', deviceId);
    setSelectedVideoInput(deviceId);
    
    toast({
      title: "Video Input Updated",
      description: "Camera selection saved",
    });
  };

  const loadDevices = async () => {
    try {
      // Request permission to access media devices
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then(stream => {
          // Stop tracks immediately after getting permissions
          stream.getTracks().forEach(track => track.stop());
        })
        .catch(err => {
          console.error("Error accessing media for permissions:", err);
          // Still try to enumerate devices even if full permissions weren't granted
        });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
      const audioOutputDevices = devices.filter(device => device.kind === 'audiooutput');
      const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
      
      setAudioInputs(audioInputDevices);
      setAudioOutputs(audioOutputDevices);
      setVideoInputs(videoInputDevices);
      
      // Load saved preferences from localStorage
      const savedAudioInput = localStorage.getItem('selectedAudioInput');
      const savedAudioOutput = localStorage.getItem('selectedAudioOutput');
      const savedVideoInput = localStorage.getItem('selectedVideoInput');
      
      // Set defaults if saved preferences are not available
      if (!savedAudioInput && audioInputDevices.length > 0) {
        updateSelectedAudioInput(audioInputDevices[0].deviceId);
      } else if (savedAudioInput) {
        setSelectedAudioInput(savedAudioInput);
      }
      
      if (!savedAudioOutput && audioOutputDevices.length > 0) {
        updateSelectedAudioOutput(audioOutputDevices[0].deviceId);
      } else if (savedAudioOutput) {
        setSelectedAudioOutput(savedAudioOutput);
      }
      
      if (!savedVideoInput && videoInputDevices.length > 0) {
        updateSelectedVideoInput(videoInputDevices[0].deviceId);
      } else if (savedVideoInput) {
        setSelectedVideoInput(savedVideoInput);
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
