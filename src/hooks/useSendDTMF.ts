
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
  
  // New function to handle multiple DTMF tones with delay between each
  const sendMultipleDTMFTones = useCallback(async (digits: string) => {
    if (!digits) return;
    
    // Show feedback that we're starting to send tones
    toast({
      title: `Sending: ${digits}`,
      description: "Sending tones sequentially...",
      duration: 1500,
    });
    
    // Use a delay to space out the DTMF tones
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    try {
      // Process each character in the string
      for (let i = 0; i < digits.length; i++) {
        const digit = digits[i];
        
        // Play the tone locally for feedback
        playDTMFTone(digit);
        
        // Send the DTMF tone to the remote party
        await janusService.sendDTMF(digit);
        
        // Wait a bit between tones to ensure they're recognized separately
        if (i < digits.length - 1) {
          await delay(300);
        }
      }
      
      // Show success notification
      toast({
        title: "DTMF Sequence Sent",
        description: `Successfully sent: ${digits}`,
        duration: 2000,
      });
    } catch (error) {
      console.error("Error sending DTMF sequence:", error);
      toast({
        title: "DTMF Sequence Failed",
        description: `Problem sending sequence: ${error}`,
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [playDTMFTone, toast]);
  
  return { sendDTMFTone, sendMultipleDTMFTones };
};
