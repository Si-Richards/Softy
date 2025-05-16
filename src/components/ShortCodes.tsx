
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Phone, 
  Users, 
  UserCheck, 
  User, 
  Clock, 
  MessageCircle, 
  Lock, 
  Volume, 
  Headphones,
  Bell,
  MailOpen,
  Mic
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDTMFTone } from "@/hooks/useDTMFTone";
import { useSendDTMF } from "@/hooks/useSendDTMF";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface ShortCode {
  id: string;
  title: string;
  code: string;
  icon: React.ElementType;
  description: string;
  requiresInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
}

const shortCodes: ShortCode[] = [
  {
    id: "emergency",
    title: "Emergency",
    code: "999",
    icon: Phone,
    description: "Emergency Services (999 or 112)"
  },
  {
    id: "groupCall",
    title: "Call Group",
    code: "*",
    icon: Users,
    description: "Call a group of phones",
    requiresInput: true,
    inputLabel: "Group Number",
    inputPlaceholder: "Enter group number"
  },
  {
    id: "pickupGroup",
    title: "Pickup Group",
    code: "*0#",
    icon: UserCheck,
    description: "Intercept/Pickup group call",
    requiresInput: true,
    inputLabel: "Pickup Group ID",
    inputPlaceholder: "Enter pickup group ID"
  },
  {
    id: "pickupExt",
    title: "Pickup Extension",
    code: "**",
    icon: User,
    description: "Intercept/Pickup extension call",
    requiresInput: true,
    inputLabel: "Extension Number",
    inputPlaceholder: "Enter extension number"
  },
  {
    id: "extension",
    title: "Call Extension",
    code: "",
    icon: Phone,
    description: "Call another extension (internal only)",
    requiresInput: true,
    inputLabel: "Extension Number",
    inputPlaceholder: "Enter extension number"
  },
  {
    id: "speakingClock",
    title: "Speaking Clock",
    code: "123",
    icon: Clock,
    description: "Speaking clock (on-platform)"
  },
  {
    id: "welcome",
    title: "Welcome Message",
    code: "1234",
    icon: MessageCircle,
    description: "Dial Welcome Message"
  },
  {
    id: "withhold",
    title: "Withhold Number",
    code: "141",
    icon: Lock,
    description: "Withhold number prefix (per call)",
    requiresInput: true,
    inputLabel: "Telephone Number",
    inputPlaceholder: "Enter telephone number"
  },
  {
    id: "lastCall",
    title: "Last Call ID",
    code: "1471",
    icon: Phone,
    description: "Last Call Identified (DDI calls and Group calls only)"
  },
  {
    id: "customPrompt",
    title: "Record Prompt",
    code: "151",
    icon: Mic,
    description: "Record a custom prompt (IVR greeting, Queue greeting)"
  },
  {
    id: "echoTest",
    title: "Echo Test",
    code: "160",
    icon: Volume,
    description: "Dial Echo Test (used for latency diagnostics)"
  },
  {
    id: "voicemailExt",
    title: "Extension Voicemail",
    code: "1571",
    icon: MailOpen,
    description: "Access Extension Voicemail"
  },
  {
    id: "voicemailShared",
    title: "Shared Voicemail",
    code: "1572",
    icon: MailOpen,
    description: "Access Shared Voicemail"
  },
  {
    id: "nightMode",
    title: "Night Mode",
    code: "*1#",
    icon: Bell,
    description: "Time Profile Night Mode",
    requiresInput: true,
    inputLabel: "Time Profile Number",
    inputPlaceholder: "Enter time profile number"
  },
  {
    id: "callMonitoring",
    title: "Call Monitoring",
    code: "154",
    icon: Headphones,
    description: "Call Monitoring (Call Whisper)",
    requiresInput: true,
    inputLabel: "Seat Number and Password",
    inputPlaceholder: "seat number,password"
  },
];

export default function ShortCodes() {
  const { toast } = useToast();
  const { playDTMFTone } = useDTMFTone();
  const { sendDTMFTone } = useSendDTMF();
  const [selectedShortCode, setSelectedShortCode] = useState<ShortCode | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleShortCodeClick = (shortCode: ShortCode) => {
    if (shortCode.requiresInput) {
      setSelectedShortCode(shortCode);
      setInputValue("");
      setIsDialogOpen(true);
    } else {
      // Dial the code directly
      dialShortCode(shortCode.code);
    }
  };

  const handleDialWithInput = () => {
    if (!selectedShortCode) return;
    
    let codeToSend = selectedShortCode.code;
    
    // Build the full code based on the input pattern
    if (selectedShortCode.id === "withhold") {
      codeToSend = `${codeToSend}${inputValue}`;
    } else if (selectedShortCode.id === "extension") {
      codeToSend = inputValue;
    } else {
      codeToSend = `${codeToSend}${inputValue}`;
    }
    
    dialShortCode(codeToSend);
    setIsDialogOpen(false);
  };

  const dialShortCode = (code: string) => {
    // Play feedback tones for each digit
    for (let i = 0; i < code.length; i++) {
      const char = code.charAt(i);
      setTimeout(() => {
        playDTMFTone(char);
        sendDTMFTone(char).catch(err => {
          console.error("Error sending DTMF:", err);
        });
      }, i * 300); // Play each tone with a 300ms delay
    }

    // Show toast notification
    toast({
      title: "Dialing Short Code",
      description: `Sending code: ${code}`,
    });
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4">Short Codes</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {shortCodes.map((shortCode) => (
          <Button
            key={shortCode.id}
            variant="outline"
            className="flex flex-col items-center justify-center h-24 p-2 text-xs gap-1 hover:bg-softphone-accent hover:text-white"
            onClick={() => handleShortCodeClick(shortCode)}
          >
            <shortCode.icon className="h-6 w-6 mb-1" />
            <span className="font-medium">{shortCode.title}</span>
            <span className="text-xs text-muted-foreground">
              {shortCode.code}{shortCode.requiresInput ? "..." : ""}
            </span>
          </Button>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedShortCode?.title}</DialogTitle>
            <DialogDescription>
              {selectedShortCode?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">
                {selectedShortCode?.inputLabel || "Enter Value"}:
              </p>
              <div className="flex items-center gap-2">
                {selectedShortCode?.code && (
                  <div className="bg-muted px-3 py-2 rounded-md">
                    {selectedShortCode.code}
                  </div>
                )}
                <Input 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={selectedShortCode?.inputPlaceholder || ""}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDialWithInput}>
              Dial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
