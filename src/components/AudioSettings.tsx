
import React, { useEffect } from "react";
import { Mic, Speaker } from "lucide-react";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import janusService from "@/services/JanusService";
import AudioDeviceSelect from "./audio-settings/AudioDeviceSelect";
import VideoDeviceSelect from "./audio-settings/VideoDeviceSelect";
import { useAudioTest } from "./audio-settings/useAudioTest";

const AudioSettings = () => {
  const {
    audioInputs,
    audioOutputs,
    videoInputs,
    selectedAudioInput,
    selectedAudioOutput,
    selectedVideoInput,
    setSelectedAudioInput,
    setSelectedAudioOutput,
    setSelectedVideoInput,
  } = useMediaDevices();

  const { testMicrophone, testSpeaker } = useAudioTest();

  useEffect(() => {
    if (selectedAudioOutput) {
      janusService.setAudioOutputDevice(selectedAudioOutput);
    }
  }, [selectedAudioOutput]);

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <h2 className="text-xl font-semibold mb-6">Audio Settings</h2>
      
      <div className="space-y-8">
        <AudioDeviceSelect
          label="Microphone"
          icon={<Mic className="w-5 h-5 mr-2 text-softphone-accent" />}
          deviceId={selectedAudioInput}
          devices={audioInputs}
          onDeviceChange={setSelectedAudioInput}
          onTest={() => testMicrophone(selectedAudioInput)}
          testButtonLabel="Test Microphone"
        />

        <AudioDeviceSelect
          label="Speaker"
          icon={<Speaker className="w-5 h-5 mr-2 text-softphone-accent" />}
          deviceId={selectedAudioOutput}
          devices={audioOutputs}
          onDeviceChange={setSelectedAudioOutput}
          onTest={() => testSpeaker(selectedAudioOutput)}
          testButtonLabel="Test Speaker"
        />

        <VideoDeviceSelect
          devices={videoInputs}
          selectedDevice={selectedVideoInput}
          onDeviceChange={setSelectedVideoInput}
        />
      </div>
    </div>
  );
};

export default AudioSettings;
