
import React from "react";
import { Phone, MessageSquare, Video, Star } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Contact } from "@/types/contacts";

interface ContactItemProps {
  contact: Contact;
  onToggleFavorite: (contactId: number) => void;
}

const ContactItem = ({ contact, onToggleFavorite }: ContactItemProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const getPresenceColor = (presence: Contact["presence"]) => {
    switch (presence) {
      case "available":
        return "bg-softphone-success";
      case "busy":
        return "bg-softphone-error";
      case "away":
        return "bg-yellow-500";
      case "offline":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const getPresenceLabel = (presence: Contact["presence"]) => {
    switch (presence) {
      case "available":
        return "Available";
      case "busy":
        return "Busy";
      case "away":
        return "Away";
      case "offline":
        return "Offline";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="flex items-center p-3 rounded-lg hover:bg-gray-100">
      <div className="relative">
        <Avatar className="h-12 w-12 mr-3">
          {contact.avatar ? (
            <AvatarImage src={contact.avatar} alt={contact.name} />
          ) : (
            <AvatarFallback className="bg-softphone-accent text-white">
              {getInitials(contact.name)}
            </AvatarFallback>
          )}
        </Avatar>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "absolute bottom-0 right-1 w-3 h-3 rounded-full border-2 border-white",
                getPresenceColor(contact.presence)
              )}></div>
            </TooltipTrigger>
            <TooltipContent side="right">
              {getPresenceLabel(contact.presence)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="flex-1">
        <div className="font-medium">{contact.name}</div>
        <div className="text-sm text-gray-500">
          <span className="mr-2">{contact.countryCode}</span>
          {contact.number}
        </div>
      </div>
      
      <div className="flex space-x-1">
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={() => onToggleFavorite(contact.id)}
          className={cn(
            "text-gray-400 hover:text-yellow-500",
            contact.favorite && "text-yellow-500"
          )}
        >
          <Star className={cn("h-4 w-4", contact.favorite && "fill-current")} />
        </Button>
        <Button size="icon" variant="ghost" className="text-softphone-success">
          <Phone className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="text-softphone-accent">
          <Video className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="text-softphone-primary">
          <MessageSquare className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ContactItem;
