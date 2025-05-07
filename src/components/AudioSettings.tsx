
import React, { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Camera, Mic, Speaker } from "lucide-react";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { useToast } from "@/hooks/use-toast";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isBlurEnabled, setIsBlurEnabled] = useState(false);
  const [blurAmount, setBlurAmount] = useState(5);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    return () => {
      // Clean up when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stream]);

  const startVideo = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedVideoInput ? { exact: selectedVideoInput } : undefined }
      });
      
      setStream(newStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        setIsVideoOn(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast({
        title: "Camera Error",
        description: "Could not access the selected camera",
        variant: "destructive"
      });
    }
  };

  const stopVideo = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsVideoOn(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  useEffect(() => {
    if (isVideoOn && videoRef.current && canvasRef.current && stream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) return;

      const drawFrame = () => {
        if (!video || !canvas || !ctx || !isVideoOn) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        if (isBlurEnabled) {
          // Draw original video frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Apply blur effect
          ctx.filter = `blur(${blurAmount}px)`;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Reset filter for next frame
          ctx.filter = 'none';
        } else {
          // Just draw the video directly without effects
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        animationFrameRef.current = requestAnimationFrame(drawFrame);
      };

      video.onloadedmetadata = () => {
        animationFrameRef.current = requestAnimationFrame(drawFrame);
      };

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [isVideoOn, isBlurEnabled, blurAmount, stream]);

  useEffect(() => {
    if (selectedVideoInput && isVideoOn) {
      // Restart video with new device
      startVideo();
    }
  }, [selectedVideoInput]);

  const handleVideoToggle = () => {
    if (isVideoOn) {
      stopVideo();
    } else {
      startVideo();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-6">Devices</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center">
              <Mic className="w-5 h-5 mr-2 text-softphone-accent" />
              <h3 className="font-medium">Microphone</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="microphone">Input device</Label>
              <Select 
                value={selectedAudioInput} 
                onValueChange={(value) => {
                  setSelectedAudioInput(value);
                  console.log("Selected audio input:", value);
                }}
              >
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
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <Speaker className="w-5 h-5 mr-2 text-softphone-accent" />
              <h3 className="font-medium">Speaker</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="speaker">Output device</Label>
              <Select 
                value={selectedAudioOutput} 
                onValueChange={(value) => {
                  setSelectedAudioOutput(value);
                  console.log("Selected audio output:", value);
                }}
              >
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
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <Camera className="w-5 h-5 mr-2 text-softphone-accent" />
              <h3 className="font-medium">Camera</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="camera">Video device</Label>
              <Select 
                value={selectedVideoInput} 
                onValueChange={(value) => {
                  setSelectedVideoInput(value);
                  console.log("Selected video input:", value);
                }}
              >
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
            
            <div className="flex items-center justify-between">
              <Label htmlFor="blur-bg">Background blur</Label>
              <Switch
                id="blur-bg"
                checked={isBlurEnabled}
                onCheckedChange={setIsBlurEnabled}
                disabled={!isVideoOn}
              />
            </div>

            {isBlurEnabled && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="blur-amount">Blur amount</Label>
                  <span className="text-sm text-gray-500">{blurAmount}px</span>
                </div>
                <Slider
                  id="blur-amount"
                  min={1}
                  max={20}
                  step={1}
                  value={[blurAmount]}
                  onValueChange={(values) => setBlurAmount(values[0])}
                  disabled={!isVideoOn || !isBlurEnabled}
                />
              </div>
            )}
            
            <Button 
              onClick={handleVideoToggle}
              variant={isVideoOn ? "destructive" : "default"}
              className={isVideoOn ? "" : "bg-softphone-accent"}
            >
              {isVideoOn ? "Stop Camera" : "Start Camera"}
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <div className="bg-gray-100 rounded-lg overflow-hidden aspect-video flex items-center justify-center border">
            {isVideoOn ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="hidden"
                />
                <canvas 
                  ref={canvasRef}
                  className="max-w-full max-h-full object-contain"
                />
              </>
            ) : (
              <div className="text-center text-gray-400">
                <Camera className="mx-auto w-12 h-12 mb-2" />
                <p>Camera preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioSettings;
