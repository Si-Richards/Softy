
import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Phone, 
  Users, 
  Headphones, 
  Clock, 
  MicOff, 
  Mic, 
  Voicemail,
  ParkingSquare,
  ArrowDown,
  Intercom,
  AlarmClock,
  PhoneIncoming,
  UserPlus,
  UserMinus
} from "lucide-react";
import { useSendDTMF } from "@/hooks/useSendDTMF";

interface ShortCodeProps {
  onShortCodeSelect: (code: string) => void;
}

const ShortCodes: React.FC<ShortCodeProps> = ({ onShortCodeSelect }) => {
  // Group shortcodes by category for better organization
  const shortCodes = [
    { 
      category: "Call Management", 
      codes: [
        { name: "Call Recording", code: "#1", icon: <Mic /> },
        { name: "Stop Recording", code: "#2", icon: <MicOff /> },
        { name: "Call Park", code: "1900", icon: <ParkingSquare /> },
        { name: "Call Monitor", code: "154", icon: <Headphones /> },
        { name: "Voicemail", code: "1571", icon: <Voicemail /> },
        { name: "Echo Test", code: "160", icon: <Phone /> }
      ] 
    },
    { 
      category: "Paging & Intercom", 
      codes: [
        { name: "Page Extension", code: "*2#", description: "+ extension number", icon: <ArrowDown /> },
        { name: "Page Group", code: "*3#", description: "+ call group", icon: <ArrowDown /> },
        { name: "Intercom", code: "*4#", description: "+ extension number", icon: <Intercom /> },
        { name: "Wake-up Call", code: "*5#", description: "+ 24H time", icon: <AlarmClock /> }
      ] 
    },
    { 
      category: "Extensions & Queue Management", 
      codes: [
        { name: "Call Pickup", code: "**", description: "+ seat number", icon: <PhoneIncoming /> },
        { name: "Queue Login", code: "120*", description: "+ queue number", icon: <UserPlus /> },
        { name: "Queue Logout", code: "121*", description: "+ queue number", icon: <UserMinus /> },
        { name: "Last Call (DND)", code: "1471", icon: <Phone /> }
      ] 
    }
  ];

  const handleShortCodeClick = (code: string) => {
    onShortCodeSelect(code);
  };

  return (
    <div className="mt-6 space-y-4 pb-8">
      {shortCodes.map((category) => (
        <div key={category.category} className="space-y-2">
          <h4 className="text-xs font-medium text-gray-400">{category.category}</h4>
          <div className="grid grid-cols-3 gap-2">
            {category.codes.map((item) => (
              <Button
                key={item.code}
                variant="outline"
                className="flex flex-col justify-center items-center h-20 px-2 hover:bg-softphone-accent/10"
                onClick={() => handleShortCodeClick(item.code)}
              >
                <div className="mb-1">
                  {item.icon}
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.code} {item.description && <span className="text-[10px]">{item.description}</span>}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ShortCodes;
