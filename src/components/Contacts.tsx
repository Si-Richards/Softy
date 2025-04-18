
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import ContactSearchBar from "./contacts/ContactSearchBar";
import ContactItem from "./contacts/ContactItem";
import { mockContacts } from "@/data/mockContacts";
import { Contact } from "@/types/contacts";

const Contacts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  
  const toggleFavorite = (contactId: number) => {
    setContacts(contacts.map(contact => 
      contact.id === contactId 
        ? { ...contact, favorite: !contact.favorite }
        : contact
    ));
  };
  
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.number.includes(searchTerm)
  );

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
