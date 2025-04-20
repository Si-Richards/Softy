import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed 
} from "lucide-react";
import { format } from "date-fns";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const mockCallHistory = [
  { 
    id: 1, 
    number: "+1 (555) 123-4567", 
    name: "John Doe", 
    time: new Date("2025-04-15T10:30:00"), 
    duration: "2:34", 
    type: "incoming", 
    status: "completed",
    countryCode: "US"
  },
  { 
    id: 2, 
    number: "+44 (555) 987-6543", 
    name: "Alice Smith", 
    time: new Date("2025-04-14T15:00:00"), 
    duration: "0:45", 
    type: "outgoing", 
    status: "completed",
    countryCode: "GB"
  },
  { id: 3, number: "+1 (555) 456-7890", name: "Bob Johnson", time: new Date("2025-04-13T12:00:00"), duration: "-", type: "missed", status: "missed" },
  { id: 4, number: "+1 (555) 567-8901", name: "Carol Williams", time: new Date("2025-04-12T18:00:00"), duration: "5:12", type: "incoming", status: "completed" },
  { id: 5, number: "+1 (555) 678-9012", name: "David Brown", time: new Date("2025-04-11T09:00:00"), duration: "1:03", type: "outgoing", status: "completed" },
];

const CallIcon = ({ type, status }: { type: string; status: string }) => {
  const getTooltipText = () => {
    if (status === "missed") return "Missed Call";
    return type === "incoming" ? "Incoming Call" : "Outgoing Call";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          {status === "missed" ? (
            <PhoneMissed className="h-4 w-4 text-softphone-error" />
          ) : type === "incoming" ? (
            <PhoneIncoming className="h-4 w-4 text-softphone-success" />
          ) : (
            <PhoneOutgoing className="h-4 w-4 text-softphone-accent" />
          )}
        </TooltipTrigger>
        <TooltipContent>
          {getTooltipText()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const CallHistory = () => {
  return (
    <div className="w-full p-4">
      <h2 className="text-xl font-semibold mb-4">Call History</h2>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockCallHistory.map((call) => (
              <TableRow key={call.id} className="hover:bg-gray-50 cursor-pointer">
                <TableCell>
                  <CallIcon type={call.type} status={call.status} />
                </TableCell>
                <TableCell>
                  <div className="font-medium">{call.name}</div>
                  <div className="text-sm text-gray-500">
                    <span className="mr-2">{call.countryCode}</span>
                    {call.number}
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(call.time), "dd/MM/yy HH:mm:ss")}
                </TableCell>
                <TableCell>{call.duration}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CallHistory;
