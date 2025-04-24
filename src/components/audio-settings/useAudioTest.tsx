import { useToast } from "@/hooks/use-toast";

interface AudioTestHook {
  testMicrophone: (deviceId: string) => void;
  testSpeaker: (deviceId: string) => void;
}

export const useAudioTest = (): AudioTestHook => {
  const { toast } = useToast();

  const testMicrophone = (deviceId: string) => {
    if (!deviceId) {
      toast({
        title: "No microphone selected",
        description: "Please select a microphone first",
        variant: "destructive",
      });
      return;
    }

    navigator.mediaDevices.getUserMedia({ 
      audio: { deviceId: { exact: deviceId } } 
    })
    .then(stream => {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      
      toast({
        title: "Microphone Test",
        description: "Microphone is working!",
        variant: "default",
      });
      
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

  const testSpeaker = (deviceId: string): void => {
    if (!deviceId) {
      toast({
        title: "No speaker selected",
        description: "Please select a speaker first",
        variant: "destructive",
      });
      return;
    }

    try {
      const audioElement: HTMLAudioElement = document.createElement('audio');
      audioElement.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
      
      if ('setSinkId' in audioElement) {
        audioElement.setSinkId(deviceId)
          .then(() => {
            const playPromise: Promise<void> = audioElement.play();
            
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  toast({
                    title: "Speaker Test",
                    description: "Playing test sound...",
                    variant: "default",
                  });
                })
                .catch((error: Error) => {
                  console.error("Error playing audio:", error);
                  toast({
                    title: "Speaker Test Failed",
                    description: "Could not play test sound",
                    variant: "destructive",
                  });
                });
            }
          })
          .catch((error: Error) => {
            console.error("Error setting audio output device:", error);
            toast({
              title: "Speaker Test Failed",
              description: error.message || "Could not set speaker",
              variant: "destructive",
            });
          });
      } else {
        const playPromise: Promise<void> = audioElement.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              toast({
                title: "Speaker Test",
                description: "Playing test sound on default device (browser doesn't support output device selection)",
                variant: "default",
              });
            })
            .catch((error: Error) => {
              console.error("Error playing audio:", error);
              toast({
                title: "Speaker Test Failed",
                description: "Could not play test sound",
                variant: "destructive",
              });
            });
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Could not test speaker";
      console.error("Error testing speaker:", error);
      toast({
        title: "Speaker Test Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return {
    testMicrophone,
    testSpeaker
  };
};
