
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, PhoneIncoming } from "lucide-react";
import Dialpad from "@/components/Dialpad";
import useSound from "use-sound";

interface IncomingCallDialogProps {
  isOpen: boolean;
  callerNumber: string;
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCallDialog = ({
  isOpen,
  callerNumber,
  onAccept,
  onReject,
}: IncomingCallDialogProps) => {
  const [playRingtone, { stop: stopRingtone }] = useSound("/ringtone.mp3", {
    loop: true,
  });

  React.useEffect(() => {
    if (isOpen) {
      playRingtone();
    } else {
      stopRingtone();
    }
    return () => stopRingtone();
  }, [isOpen, playRingtone, stopRingtone]);

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="flex items-center gap-2">
          <PhoneIncoming className="h-5 w-5 text-softphone-accent animate-pulse" />
          Incoming Call
        </DialogTitle>
        <DialogDescription>
          Call from: {callerNumber}
        </DialogDescription>

        <Dialpad />

        <DialogFooter className="flex justify-between sm:justify-between gap-2">
          <Button
            type="button"
            variant="destructive"
            className="flex-1"
            onClick={() => {
              stopRingtone();
              onReject();
            }}
          >
            Reject
          </Button>
          <Button
            type="button"
            variant="default"
            className="flex-1 bg-softphone-success hover:bg-softphone-success/90"
            onClick={() => {
              stopRingtone();
              onAccept();
            }}
          >
            <Phone className="mr-2 h-4 w-4" />
            Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IncomingCallDialog;
