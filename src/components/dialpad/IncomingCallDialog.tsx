
import React, { useEffect } from 'react';
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
  // Optional: Add a check to only use useSound if sound is available
  const [play, { stop }] = useSound(ringtoneSrc, { 
    loop: true,
    // Add a check to prevent errors if sound fails to load
    onError: (error) => {
      console.warn('Ringtone failed to load:', error);
    }
  });

  useEffect(() => {
    if (isOpen) {
      play();
    } else {
      stop();
    }
    
    return () => {
      stop();
    };
  }, [isOpen, play, stop]);

  const handleAccept = () => {
    stop();
    onAccept();
  };

  const handleReject = () => {
    stop();
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
