
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, MessageSquare, Video } from "lucide-react";
import { useContacts } from "@/hooks/useContacts";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

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
  const { contacts, isLoading, error } = useContacts();
  const favoriteContacts = contacts.filter(contact => contact.favorite);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
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
      <CardContent className="space-y-4">
        {favoriteContacts.map((contact) => (
          <div key={contact.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50">
            <Avatar className="h-12 w-12">
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
            <div className="flex space-x-2">
              <Button 
                size="icon"
                variant="outline"
                className="text-softphone-success hover:text-white hover:bg-softphone-success"
              >
                <Phone className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="text-softphone-accent hover:text-white hover:bg-softphone-accent"
              >
                <Video className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="text-softphone-primary hover:text-white hover:bg-softphone-primary"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>
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
