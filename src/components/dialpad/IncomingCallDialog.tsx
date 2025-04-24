
import React, { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff } from "lucide-react";
import useSound from 'use-sound';

// Fallback to a default sound or remove sound if file is missing
const ringtoneSrc = '/fallback-ringtone.mp3';

interface IncomingCallDialogProps {
  isOpen: boolean;
  callerNumber: string;
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCallDialog: React.FC<IncomingCallDialogProps> = ({
  isOpen,
  callerNumber,
  onAccept,
  onReject
}) => {
  // Create an audio reference as a backup method
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Optional: Add a check to only use useSound if sound is available
  const [play, { stop }] = useSound(ringtoneSrc, { 
    loop: true,
    volume: 1.0,
    // Add a check to prevent errors if sound fails to load
    onError: (error) => {
      console.warn('Ringtone failed to load with useSound:', error);
      // Try fallback audio element if useSound fails
      if (audioRef.current) {
        audioRef.current.play().catch(e => 
          console.warn('Fallback audio play failed:', e)
        );
      }
    }
  });

  useEffect(() => {
    // Create audio element as backup
    const audio = new Audio(ringtoneSrc);
    audio.loop = true;
    audio.volume = 1.0;
    audioRef.current = audio;

    if (isOpen) {
      // Try primary method first
      play();
      
      // Also attempt with audio element as fallback
      audio.play().catch(e => 
        console.warn('Fallback audio element failed to play:', e)
      );
    } else {
      stop();
      audio.pause();
      audio.currentTime = 0;
    }
    
    return () => {
      stop();
      audio.pause();
      audio.currentTime = 0;
    };
  }, [isOpen, play, stop]);

  const handleAccept = () => {
    stop();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onAccept();
  };

  const handleReject = () => {
    stop();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onReject();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleReject()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Incoming Call</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="text-2xl font-bold animate-pulse">{callerNumber}</div>
          <div className="flex justify-center space-x-8 mt-6">
            <Button 
              onClick={handleAccept}
              className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600"
            >
              <Phone className="h-8 w-8" />
            </Button>
            <Button 
              onClick={handleReject}
              className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600"
            >
              <PhoneOff className="h-8 w-8" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IncomingCallDialog;
