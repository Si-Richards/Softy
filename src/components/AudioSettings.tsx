
import React, { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Volume2, Mic, Speaker } from "lucide-react";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { useToast } from "@/hooks/use-toast";
import janusService from "@/services/JanusService";

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
  
  const { toast } = useToast();

  // Effect to update JanusService with the selected output device
  useEffect(() => {
    if (selectedAudioOutput) {
      janusService.setAudioOutputDevice(selectedAudioOutput);
    }
  }, [selectedAudioOutput]);

  // Test audio input
  const testMicrophone = () => {
    if (!selectedAudioInput) {
      toast({
        title: "No microphone selected",
        description: "Please select a microphone first",
        variant: "destructive",
      });
      return;
    }

    navigator.mediaDevices.getUserMedia({ 
      audio: { deviceId: { exact: selectedAudioInput } } 
    })
    .then(stream => {
      // Create audio context for visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      
      toast({
        title: "Microphone Test",
        description: "Microphone is working!",
        variant: "default",
      });
      
      // Stop the stream after 3 seconds
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
      }, 3000);
    })
    .catch(error => {
      console.error("Error testing microphone:", error);
      toast({
        title: "Microphone Test Failed",
        description: error.message || "Could not access microphone",
        variant: "destructive",
      });
    });
  };

  // Test audio output
  const testSpeaker = () => {
    if (!selectedAudioOutput) {
      toast({
        title: "No speaker selected",
        description: "Please select a speaker first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Fix: Explicitly type the audio element as HTMLAudioElement
      const audio = new Audio() as HTMLAudioElement;
      audio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"; // Short beep
      
      // Set the audio output device if supported
      if ('setSinkId' in audio) {
        (audio as any).setSinkId(selectedAudioOutput)
          .then(() => {
            audio.play()
              .then(() => {
                toast({
                  title: "Speaker Test",
                  description: "Playing test sound...",
                  variant: "default",
                });
              })
              .catch((error: any) => {
                console.error("Error playing audio:", error);
                toast({
                  title: "Speaker Test Failed",
                  description: "Could not play test sound",
                  variant: "destructive",
                });
              });
          })
          .catch((error: any) => {
            console.error("Error setting audio output device:", error);
            toast({
              title: "Speaker Test Failed",
              description: error.message || "Could not set speaker",
              variant: "destructive",
            });
          });
      } else {
        // Fall back to default device if setSinkId is not supported
        audio.play()
          .then(() => {
            toast({
              title: "Speaker Test",
              description: "Playing test sound on default device (browser doesn't support output device selection)",
              variant: "default",
            });
          })
          .catch((error: any) => {
            console.error("Error playing audio:", error);
            toast({
              title: "Speaker Test Failed",
              description: "Could not play test sound",
              variant: "destructive",
            });
          });
      }
    } catch (error: any) {
      console.error("Error testing speaker:", error);
      toast({
        title: "Speaker Test Failed",
        description: error.message || "Could not test speaker",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <h2 className="text-xl font-semibold mb-6">Audio Settings</h2>
      
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center">
            <Mic className="w-5 h-5 mr-2 text-softphone-accent" />
            <h3 className="font-medium">Microphone</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="microphone">Input device</Label>
            <Select value={selectedAudioInput} onValueChange={setSelectedAudioInput}>
              <SelectTrigger id="microphone">
                <SelectValue placeholder="Select microphone" />
              </SelectTrigger>
              <SelectContent>
                {audioInputs.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={testMicrophone}
              className="mt-2 w-full"
            >
              Test Microphone
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <Speaker className="w-5 h-5 mr-2 text-softphone-accent" />
            <h3 className="font-medium">Speaker</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="speaker">Output device</Label>
            <Select value={selectedAudioOutput} onValueChange={setSelectedAudioOutput}>
              <SelectTrigger id="speaker">
                <SelectValue placeholder="Select speaker" />
              </SelectTrigger>
              <SelectContent>
                {audioOutputs.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Speaker ${device.deviceId.slice(0, 5)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={testSpeaker}
              className="mt-2 w-full"
            >
              Test Speaker
            </Button>
          </div>
        </div>

        {videoInputs.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Camera</h3>
            <div className="space-y-2">
              <Label htmlFor="camera">Video device</Label>
              <Select value={selectedVideoInput} onValueChange={setSelectedVideoInput}>
                <SelectTrigger id="camera">
                  <SelectValue placeholder="Select camera" />
                </SelectTrigger>
                <SelectContent>
                  {videoInputs.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioSettings;
