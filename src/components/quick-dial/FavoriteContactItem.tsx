
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Phone, 
  MessageSquare, 
  Video, 
  MoreHorizontal, 
  Edit, 
  Star, 
  Trash2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getInitials, getPresenceColor } from "./utils";
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
import type { Contact } from "@/types/contacts";

interface FavoriteContactItemProps {
  contact: Contact;
  onEditContact: (id: number) => void;
  onToggleFavorite: (id: number) => void;
}

const FavoriteContactItem = ({ contact, onEditContact, onToggleFavorite }: FavoriteContactItemProps) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
          <div className="relative">
            <Avatar className="h-12 w-12">
              {contact.avatar ? (
                <AvatarImage src={contact.avatar} alt={contact.name} />
              ) : (
                <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
              )}
            </Avatar>
            <div 
              className={cn(
                "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white",
                getPresenceColor(contact.presence)
              )}
            />
          </div>
          <div className="flex-1">
            <div className="font-medium">{contact.name}</div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-8 w-8 p-0" 
                size="icon"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white">
              <DropdownMenuItem onClick={() => onEditContact(contact.id)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit Contact</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleFavorite(contact.id)}>
                <Star className={cn("mr-2 h-4 w-4", contact.favorite && "fill-yellow-500")} />
                <span>Remove from Favorites</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete Contact</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="bg-white">
        <ContextMenuItem onClick={() => onEditContact(contact.id)}>
          <Edit className="mr-2 h-4 w-4" />
          <span>Edit Contact</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onToggleFavorite(contact.id)}>
          <Star className={cn("mr-2 h-4 w-4", contact.favorite && "fill-yellow-500")} />
          <span>Remove from Favorites</span>
        </ContextMenuItem>
        <ContextMenuSeparator />
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
        <ContextMenuSeparator />
        <ContextMenuItem className="text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete Contact</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default FavoriteContactItem;
