
import { useEffect } from 'react';
import { useDTMFTone } from './useDTMFTone';

export const useKeypadInput = (onDigitAdd: (key: string) => void) => {
  const { playDTMFTone } = useDTMFTone();

  useEffect(() => {
    const handleKeyboardPress = (event: KeyboardEvent) => {
      const key = event.key;
      const validKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '#'];
      
      if (validKeys.includes(key)) {
        event.preventDefault();
        playDTMFTone(key);
        onDigitAdd(key);
      }
    };

    window.addEventListener('keydown', handleKeyboardPress);
    return () => window.removeEventListener('keydown', handleKeyboardPress);
  }, [onDigitAdd, playDTMFTone]);
};
