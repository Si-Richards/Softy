
import React, { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff } from "lucide-react";
import useSound from 'use-sound';
import { useSettings } from '@/hooks/useSettings';

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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { audioSettings } = useSettings();
  
  const [play, { stop }] = useSound(ringtoneSrc, { 
    loop: true,
    volume: audioSettings.ringtoneVolume ? audioSettings.ringtoneVolume / 100 : 1.0,
    onError: (error) => {
      console.warn('Ringtone failed to load with useSound:', error);
      if (audioRef.current) {
        audioRef.current.volume = audioSettings.ringtoneVolume ? audioSettings.ringtoneVolume / 100 : 1.0;
        audioRef.current.play().catch(e => 
          console.warn('Fallback audio play failed:', e)
        );
      }
    }
  });

  useEffect(() => {
    const audio = new Audio(ringtoneSrc);
    audio.loop = true;
    audio.volume = audioSettings.ringtoneVolume ? audioSettings.ringtoneVolume / 100 : 1.0;
    audioRef.current = audio;

    if (isOpen) {
      console.log("IncomingCallDialog: Playing ringtone");
      play();
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
  }, [isOpen, play, stop, audioSettings.ringtoneVolume]);

  const handleAccept = () => {
    console.log("IncomingCallDialog: Call accepted by user");
    stop();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onAccept();
  };

  const handleReject = () => {
    console.log("IncomingCallDialog: Call rejected by user");
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
