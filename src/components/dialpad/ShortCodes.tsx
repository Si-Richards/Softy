
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
  ParkingSquare
} from "lucide-react";
import { useSendDTMF } from "@/hooks/useSendDTMF";

interface ShortCodeProps {
  onShortCodeSelect: (code: string) => void;
}

const ShortCodes: React.FC<ShortCodeProps> = ({ onShortCodeSelect }) => {
  // Group shortcodes by category for better organization
  const shortCodes = [
    { 
      category: "Common Services", 
      codes: [
        { name: "Emergency", code: "999", icon: <Phone className="text-red-500" /> },
        { name: "Voicemail", code: "1571", icon: <Voicemail /> },
        { name: "Welcome Message", code: "1234", icon: <Mic /> },
        { name: "Speaking Clock", code: "123", icon: <Clock /> }
      ] 
    },
    { 
      category: "Call Management", 
      codes: [
        { name: "Call Recording", code: "#1", icon: <Mic /> },
        { name: "Stop Recording", code: "#2", icon: <MicOff /> },
        { name: "Call Park", code: "1900", icon: <ParkingSquare /> },
        { name: "Call Monitor", code: "154", icon: <Headphones /> }
      ] 
    },
    { 
      category: "Group Features", 
      codes: [
        { name: "Group Call", code: "*", description: "+ group number", icon: <Users /> },
        { name: "Pickup Group", code: "*8", description: "+ pickup group ID", icon: <Users /> },
        { name: "Last Call (DND)", code: "1471", icon: <Phone /> },
        { name: "Echo Test", code: "160", icon: <Phone /> }
      ] 
    }
  ];

  const handleShortCodeClick = (code: string) => {
    onShortCodeSelect(code);
  };

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-sm font-medium text-gray-500">Quick Access Codes</h3>
      
      {shortCodes.map((category) => (
        <div key={category.category} className="space-y-2">
          <h4 className="text-xs font-medium text-gray-400">{category.category}</h4>
          <div className="grid grid-cols-2 gap-2">
            {category.codes.map((item) => (
              <Button
                key={item.code}
                variant="outline"
                className="flex justify-start items-center h-12 px-3 hover:bg-softphone-accent/10"
                onClick={() => handleShortCodeClick(item.code)}
              >
                <div className="mr-2">
                  {item.icon}
                </div>
                <div className="text-left">
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
