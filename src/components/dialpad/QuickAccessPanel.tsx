
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetClose
} from "@/components/ui/sheet";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import {
  Users,
  Phone,
  Headphones,
  User,
  Mic,
  MicOff,
  ParkingMeter,
  ArrowRight,
  ChevronsRight,
  ChevronsLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShortcodeItem {
  name: string;
  code: string;
  description: string;
  placeholder: string;
  icon: React.ReactNode;
}

interface QuickAccessPanelProps {
  isCallActive: boolean;
  setNumber: (value: string) => void;
  isJanusConnected: boolean;
}

const QuickAccessPanel: React.FC<QuickAccessPanelProps> = ({ 
  isCallActive, 
  setNumber,
  isJanusConnected 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Shortcode definitions
  const shortcodes: ShortcodeItem[] = [
    {
      name: "Call Group",
      code: "*",
      description: "Call a group of phones",
      placeholder: "<group number>",
      icon: <Users className="h-4 w-4" />
    },
    {
      name: "Pickup Group",
      code: "*0#",
      description: "Intercept/Pickup group call",
      placeholder: "<pickup group ID>",
      icon: <Phone className="h-4 w-4" />
    },
    {
      name: "Pickup Extension",
      code: "**",
      description: "Intercept/Pickup extension call",
      placeholder: "<seat/extension number>",
      icon: <Phone className="h-4 w-4" />
    },
    {
      name: "Withhold Number",
      code: "141",
      description: "Withhold number prefix (per call)",
      placeholder: "<telephone number>",
      icon: <User className="h-4 w-4" />
    },
    {
      name: "Call Monitoring",
      code: "154,",
      description: "Call Whisper, listen & whisper",
      placeholder: "<seat>,<password>",
      icon: <Headphones className="h-4 w-4" />
    },
    {
      name: "Page Extension",
      code: "*2#",
      description: "One-way audio to extension",
      placeholder: "<seat/extension number>",
      icon: <Mic className="h-4 w-4" />
    },
    {
      name: "Page Group",
      code: "*3#",
      description: "One-way audio to group",
      placeholder: "<call group>",
      icon: <Mic className="h-4 w-4" />
    },
    {
      name: "Intercom",
      code: "*4#",
      description: "Two-way audio",
      placeholder: "<seat/extension number>",
      icon: <MicOff className="h-4 w-4" />
    },
    {
      name: "Park Call",
      code: "1900",
      description: "Parks the current call",
      placeholder: "",
      icon: <ParkingMeter className="h-4 w-4" />
    },
    {
      name: "Retrieve Call",
      code: "",
      description: "Retrieves a parked call",
      placeholder: "<parking reference>",
      icon: <ArrowRight className="h-4 w-4" />
    }
  ];

  const setShortcode = (code: string) => {
    setNumber(code);
    toast({
      title: `Shortcode ${code} set`,
      description: "Enter the remaining numbers and press call",
      duration: 3000
    });
  };

  // Floating trigger button outside of sheet
  const TriggerButton = () => (
    <SheetTrigger asChild>
      <Button 
        variant="outline" 
        size="icon"
        className="fixed right-0 top-1/2 transform -translate-y-1/2 rounded-l-md rounded-r-none border-r-0 bg-white shadow-lg"
        onClick={() => setIsOpen(true)}
        disabled={isCallActive}
      >
        <ChevronsLeft className="h-4 w-4" />
        <span className="sr-only">Open quick access</span>
      </Button>
    </SheetTrigger>
  );

  return (
    <>
      <TriggerButton />
      
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent 
          side="right" 
          className="w-[240px] p-3"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Quick Access</h3>
            <SheetClose asChild>
              <Button variant="ghost" size="sm">
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {shortcodes.map((item, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex justify-start items-center gap-2 h-10 w-full text-left" 
                    onClick={() => {
                      setShortcode(item.code);
                      setIsOpen(false);
                    }}
                    disabled={!isJanusConnected || isCallActive}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span className="text-sm truncate">{item.name}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[200px]">
                  <div className="space-y-1">
                    <p className="text-xs">{item.description}</p>
                    <div className="text-xs font-mono bg-gray-100 rounded px-1 py-0.5">
                      {item.code}<span className="text-gray-400">{item.placeholder}</span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default QuickAccessPanel;
