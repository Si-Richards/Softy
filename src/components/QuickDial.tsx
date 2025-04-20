
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useContacts } from "@/hooks/useContacts";
import { useNavigate } from "react-router-dom";
import QuickDialSkeleton from "./quick-dial/QuickDialSkeleton";
import FavoriteContactItem from "./quick-dial/FavoriteContactItem";

const QuickDial = () => {
  const { contacts, isLoading, error, toggleFavorite } = useContacts();
  const navigate = useNavigate();
  const favoriteContacts = contacts.filter(contact => contact.favorite);

  const handleEditContact = (contactId: number) => {
    navigate(`/contacts/edit/${contactId}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Favorites</CardTitle>
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
          <CardTitle>Favorites</CardTitle>
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
        <CardTitle>Favorites</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {favoriteContacts.map((contact) => (
            <FavoriteContactItem
              key={contact.id}
              contact={contact}
              onEditContact={handleEditContact}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
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
