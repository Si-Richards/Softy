
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useContacts } from "@/hooks/useContacts";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
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

const QuickDialSkeleton = () => (
  <div className="flex items-center space-x-4 p-3">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-[150px]" />
      <Skeleton className="h-3 w-[100px]" />
    </div>
    <div className="flex space-x-2">
      <Skeleton className="h-8 w-8 rounded-md" />
      <Skeleton className="h-8 w-8 rounded-md" />
    </div>
  </div>
);

const QuickDial = () => {
  const { contacts, isLoading, error, toggleFavorite } = useContacts();
  const navigate = useNavigate();
  const favoriteContacts = contacts.filter(contact => contact.favorite);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const getPresenceColor = (presence: string) => {
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
  
  const handleEditContact = (contactId: number) => {
    navigate(`/contacts/edit/${contactId}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quick Dial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <QuickDialSkeleton key={i} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quick Dial</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load contacts. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Dial</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {favoriteContacts.map((contact) => (
          <ContextMenu key={contact.id}>
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
                  <div className="text-sm text-gray-500">
                    <span className="mr-2">{contact.countryCode}</span>
                    {contact.number}
                  </div>
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
                    <DropdownMenuItem onClick={() => handleEditContact(contact.id)}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Edit Contact</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleFavorite(contact.id)}>
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
              <ContextMenuItem onClick={() => handleEditContact(contact.id)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit Contact</span>
              </ContextMenuItem>
              <ContextMenuItem onClick={() => toggleFavorite(contact.id)}>
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
        ))}
        {favoriteContacts.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            No favorite contacts available. Mark contacts as favorites to see them here.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickDial;
