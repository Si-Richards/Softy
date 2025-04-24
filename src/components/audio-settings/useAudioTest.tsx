
import { useToast } from "@/hooks/use-toast";

export const useAudioTest = () => {
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

  const testSpeaker = (deviceId: string) => {
    if (!deviceId) {
      toast({
        title: "No speaker selected",
        description: "Please select a speaker first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create an audio element and explicitly type it as HTMLAudioElement
      const audio = document.createElement('audio') as HTMLAudioElement;
      audio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
      
      if ('setSinkId' in audio) {
        (audio as HTMLAudioElement).setSinkId(deviceId)
          .then(() => {
            // Make sure we properly handle the play promise
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
              playPromise
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
            }
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
        // Make sure we properly handle the play promise here too
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise
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

  return {
    testMicrophone,
    testSpeaker
  };
};
