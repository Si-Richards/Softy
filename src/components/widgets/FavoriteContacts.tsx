import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, MessageSquare } from "lucide-react";
import { mockContacts } from "../Contacts";  // Ensure this import is correct

const FavoriteContacts = () => {
  const favoriteContacts = mockContacts.filter(contact => contact.favorite);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Favorite Contacts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {favoriteContacts.map((contact) => (
          <div key={contact.id} className="flex items-center space-x-4">
            <Avatar className="h-10 w-10">
              {contact.avatar ? (
                <AvatarImage src={contact.avatar} alt={contact.name} />
              ) : (
                <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <div className="font-medium">{contact.name}</div>
              <div className="text-sm text-gray-500">
                <span className="mr-2">{contact.countryCode}</span>
                {contact.number}
              </div>
            </div>
            <div className="flex space-x-1">
              <Button size="icon" variant="ghost" className="text-softphone-success">
                <Phone className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="text-softphone-primary">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        
        {favoriteContacts.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No favorite contacts yet
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FavoriteContacts;
