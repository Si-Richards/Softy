
import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type CallStatusProps = {
  status: "idle" | "connecting" | "ringing" | "active" | "on-hold" | "ended" | "failed";
  duration?: string;
};

const CallStatus = ({ status, duration }: CallStatusProps) => {
  const getStatusColor = () => {
    switch (status) {
      case "active":
        return "bg-softphone-success text-white";
      case "connecting":
      case "ringing":
        return "bg-softphone-accent text-white";
      case "on-hold":
        return "bg-yellow-500 text-white";
      case "ended":
        return "bg-gray-500 text-white";
      case "failed":
        return "bg-softphone-error text-white";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "idle":
        return "Ready";
      case "connecting":
        return "Connecting...";
      case "ringing":
        return "Ringing...";
      case "active":
        return "In Call";
      case "on-hold":
        return "On Hold";
      case "ended":
        return "Call Ended";
      case "failed":
        return "Call Failed";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Badge className={cn("py-1 px-3", getStatusColor())}>
        {getStatusText()}
      </Badge>
      {duration && status === "active" && (
        <span className="text-sm font-medium text-gray-600">{duration}</span>
      )}
    </div>
  );
};

export default CallStatus;
