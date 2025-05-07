
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import ContactSearchBar from "./contacts/ContactSearchBar";
import ContactItem from "./contacts/ContactItem";
import { Contact } from "@/types/contacts";
import { useContacts } from "@/hooks/useContacts";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

const ContactSkeleton = () => (
  <div className="flex items-center p-3 space-x-4">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="space-y-2 flex-1">
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-4 w-[150px]" />
    </div>
  </div>
);

const Contacts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { contacts, isLoading, error, toggleFavorite } = useContacts();
  
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.number.includes(searchTerm)
  );

  if (isLoading) {
    return (
      <div className="w-full p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Contacts</h2>
          <Button size="sm" className="bg-softphone-accent hover:bg-blue-600" disabled>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <ContactSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load contacts. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Contacts</h2>
        <Button size="sm" className="bg-softphone-accent hover:bg-blue-600">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>
      
      <ContactSearchBar 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      
      <div className="space-y-2">
        {filteredContacts.map((contact) => (
          <ContactItem
            key={contact.id}
            contact={contact}
            onToggleFavorite={toggleFavorite}
          />
        ))}
        
        {filteredContacts.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            No contacts found
          </div>
        )}
      </div>
    </div>
  );
};

export default Contacts;
