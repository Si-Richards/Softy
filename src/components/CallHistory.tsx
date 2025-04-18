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

// Updated mock call history with country codes
const mockCallHistory = [
  { 
    id: 1, 
    number: "+1 (555) 123-4567", 
    name: "John Doe", 
    time: "10:30 AM", 
    duration: "2:34", 
    type: "incoming", 
    status: "completed",
    countryCode: "US"
  },
  { 
    id: 2, 
    number: "+44 (555) 987-6543", 
    name: "Alice Smith", 
    time: "Yesterday", 
    duration: "0:45", 
    type: "outgoing", 
    status: "completed",
    countryCode: "GB"
  },
  { id: 3, number: "+1 (555) 456-7890", name: "Bob Johnson", time: "Yesterday", duration: "-", type: "missed", status: "missed" },
  { id: 4, number: "+1 (555) 567-8901", name: "Carol Williams", time: "2 days ago", duration: "5:12", type: "incoming", status: "completed" },
  { id: 5, number: "+1 (555) 678-9012", name: "David Brown", time: "3 days ago", duration: "1:03", type: "outgoing", status: "completed" },
];

const CallIcon = ({ type, status }: { type: string; status: string }) => {
  if (status === "missed") {
    return <PhoneMissed className="h-4 w-4 text-softphone-error" />;
  } else if (type === "incoming") {
    return <PhoneIncoming className="h-4 w-4 text-softphone-success" />;
  } else {
    return <PhoneOutgoing className="h-4 w-4 text-softphone-accent" />;
  }
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
                <TableCell>{call.time}</TableCell>
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
