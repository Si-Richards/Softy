
import { useRef } from 'react';

export const useDTMFTone = () => {
  const audioContext = useRef<AudioContext | null>(null);

  const getDTMFFrequencies = (key: string): [number, number] | null => {
    const frequencies: { [key: string]: [number, number] } = {
      '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
      '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
      '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
      '*': [941, 1209], '0': [941, 1336], '#': [941, 1477]
    };
    return frequencies[key] || null;
  };

  const playDTMFTone = (key: string) => {
    if (!audioContext.current) {
      audioContext.current = new AudioContext();
    }

    const ctx = audioContext.current;
    const frequencies = getDTMFFrequencies(key);
    
    if (!frequencies) return;

    const oscillator1 = ctx.createOscillator();
    const oscillator2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator1.frequency.value = frequencies[0];
    oscillator2.frequency.value = frequencies[1];

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(ctx.destination);

    gainNode.gain.value = 0.1;
    oscillator1.start();
    oscillator2.start();

    setTimeout(() => {
      oscillator1.stop();
      oscillator2.stop();
    }, 100);
  };

  return { playDTMFTone };
};
