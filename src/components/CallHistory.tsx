
import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, Trash } from "lucide-react";
import { format } from "date-fns";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import { useCallHistory } from "@/hooks/useCallHistory";
import { useToast } from "@/hooks/use-toast";

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
  const { callHistory, isLoading, clearCallHistory } = useCallHistory();
  const { toast } = useToast();

  const handleCall = (number: string) => {
    console.log("Calling:", number);
    // This would trigger the actual call functionality
  };

  const handleVideoCall = (number: string) => {
    console.log("Video calling:", number);
    // This would trigger the actual video call functionality
  };

  const handleClearHistory = () => {
    clearCallHistory();
    toast({
      title: "Call History Cleared",
      description: "Your call history has been cleared"
    });
  };

  return (
    <div className="w-full p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Call History</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleClearHistory}
          className="text-softphone-error"
        >
          <Trash className="h-4 w-4 mr-2" />
          Clear History
        </Button>
      </div>
      
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">Loading call history...</TableCell>
              </TableRow>
            ) : callHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">No call history available</TableCell>
              </TableRow>
            ) : (
              callHistory.map((call) => (
                <ContextMenu key={call.id}>
                  <ContextMenuTrigger asChild>
                    <TableRow className="hover:bg-gray-50 cursor-pointer">
                      <TableCell>
                        <CallIcon type={call.type} status={call.status} />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{call.name || "Unknown"}</div>
                        <div className="text-sm text-gray-500">
                          {call.countryCode && <span className="mr-2">{call.countryCode}</span>}
                          {call.number}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(call.time), "dd/MM/yy HH:mm:ss")}
                      </TableCell>
                      <TableCell>{call.duration}</TableCell>
                    </TableRow>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="bg-white">
                    <ContextMenuItem
                      className="text-softphone-success"
                      onClick={() => handleCall(call.number)}
                    >
                      <PhoneIncoming className="mr-2 h-4 w-4" />
                      <span>Call</span>
                    </ContextMenuItem>
                    <ContextMenuItem
                      className="text-softphone-accent"
                      onClick={() => handleVideoCall(call.number)}
                    >
                      <PhoneOutgoing className="mr-2 h-4 w-4" />
                      <span>Video Call</span>
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CallHistory;
