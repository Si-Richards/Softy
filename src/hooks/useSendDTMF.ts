
import { useCallback } from 'react';
import janusService from '@/services/JanusService';
import { useDTMFTone } from './useDTMFTone';

export const useSendDTMF = () => {
  const { playDTMFTone } = useDTMFTone();
  
  const sendDTMFTone = useCallback(async (digit: string) => {
    // Play the local tone for immediate feedback
    playDTMFTone(digit);
    
    try {
      // Send the DTMF tone to the remote party
      await janusService.sendDTMF(digit);
    } catch (error) {
      console.error("Error sending DTMF tone:", error);
    }
  }, [playDTMFTone]);
  
  return { sendDTMFTone };
};
