
import { useCallback } from 'react';
import janusService from '@/services/JanusService';
import { useDTMFTone } from './useDTMFTone';
import { useToast } from './use-toast';

export const useSendDTMF = () => {
  const { playDTMFTone } = useDTMFTone();
  const { toast } = useToast();
  
  const sendDTMFTone = useCallback(async (digit: string) => {
    // Play the local tone for immediate feedback
    playDTMFTone(digit);
    
    try {
      // Send the DTMF tone to the remote party
      await janusService.sendDTMF(digit);
      
      // Show a small toast notification
      toast({
        title: `DTMF: ${digit}`,
        description: "Tone sent successfully",
        duration: 1000,
      });
    } catch (error) {
      console.error("Error sending DTMF tone:", error);
      toast({
        title: "DTMF Failed",
        description: `Failed to send tone: ${error}`,
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [playDTMFTone, toast]);
  
  return { sendDTMFTone };
};
