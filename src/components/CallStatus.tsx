
import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Phone, Video, BellOff } from "lucide-react";

type CallStatusProps = {
  status: "idle" | "connecting" | "ringing" | "active" | "video-active" | "on-hold" | "ended" | "failed" | "dnd";
  duration?: string;
};

const CallStatus = ({ status, duration }: CallStatusProps) => {
  const getStatusColor = () => {
    switch (status) {
      case "active":
      case "video-active":
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
      case "dnd":
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
        return "Voice Call";
      case "video-active":
        return "Video Call";
      case "on-hold":
        return "On Hold";
      case "ended":
        return "Call Ended";
      case "failed":
        return "Call Failed";
      case "dnd":
        return "Do Not Disturb";
      default:
        return "Unknown";
    }
  };

  const getStatusIcon = () => {
    if (status === "video-active") {
      return <Video className="w-4 h-4 mr-1" />;
    } else if (status === "dnd") {
      return <BellOff className="w-4 h-4 mr-1" />;
    } else if (["active", "connecting", "ringing", "on-hold"].includes(status)) {
      return <Phone className="w-4 h-4 mr-1" />;
    }
    return null;
  };

  return (
    <div className="flex items-center space-x-2">
      <Badge className={cn("py-1 px-3 flex items-center", getStatusColor())}>
        {getStatusIcon()}
        {getStatusText()}
      </Badge>
      {duration && (status === "active" || status === "video-active" || status === "on-hold") && (
        <span className="text-sm font-medium text-gray-600">{duration}</span>
      )}
    </div>
  );
};

export default CallStatus;
