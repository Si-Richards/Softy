
import React from "react";
import { Phone, MessageSquare, Video, Star, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Contact } from "@/types/contacts";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

interface ContactItemProps {
  contact: Contact;
  onToggleFavorite: (contactId: number) => void;
  onEdit: () => void;
}

const ContactItem = ({ contact, onToggleFavorite, onEdit }: ContactItemProps) => {
  const navigate = useNavigate();

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

  const handleEdit = () => {
    navigate(`/contacts/edit/${contact.id}`);
  };

  // Check if primary number is an extension
  const isPrimaryExtension = contact.phoneNumbers?.find(p => p.isPrimary)?.type === "extension";

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="flex items-center p-3 rounded-lg hover:bg-gray-50">
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
            <div className="text-sm text-gray-500 flex items-center gap-2">
              {!isPrimaryExtension && contact.countryCode && (
                <span>{contact.countryCode}</span>
              )}
              {isPrimaryExtension && (
                <span className="text-gray-500 italic">Ext:</span>
              )}
              <span>{contact.number}</span>
              {contact.company && (
                <>
                  <span className="text-gray-300">•</span>
                  <span>{contact.company}</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex space-x-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost"
                  className="text-gray-400 hover:text-yellow-500"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white">
                <DropdownMenuItem onClick={() => onToggleFavorite(contact.id)}>
                  <Star className={cn("mr-2 h-4 w-4", contact.favorite && "fill-yellow-500")} />
                  <span>{contact.favorite ? "Remove from Favorites" : "Add to Favorites"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-softphone-success">
                  <Phone className="mr-2 h-4 w-4" />
                  <span>Call</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-softphone-accent">
                  <Video className="mr-2 h-4 w-4" />
                  <span>Video Call</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-softphone-primary">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Message</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete Contact</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="bg-white">
        <ContextMenuItem onClick={() => onToggleFavorite(contact.id)}>
          <Star className={cn("mr-2 h-4 w-4", contact.favorite && "fill-yellow-500")} />
          <span>{contact.favorite ? "Remove from Favorites" : "Add to Favorites"}</span>
        </ContextMenuItem>
        <ContextMenuItem className="text-softphone-success">
          <Phone className="mr-2 h-4 w-4" />
          <span>Call</span>
        </ContextMenuItem>
        <ContextMenuItem className="text-softphone-accent">
          <Video className="mr-2 h-4 w-4" />
          <span>Video Call</span>
        </ContextMenuItem>
        <ContextMenuItem className="text-softphone-primary">
          <MessageSquare className="mr-2 h-4 w-4" />
          <span>Message</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          <span>Edit</span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete Contact</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default ContactItem;
