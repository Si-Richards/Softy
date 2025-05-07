
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, ChevronDown } from "lucide-react";
import ContactSearchBar from "./contacts/ContactSearchBar";
import ContactItem from "./contacts/ContactItem";
import { Contact } from "@/types/contacts";
import { useContacts } from "@/hooks/useContacts";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

type SortOption = "nameAsc" | "nameDesc" | "company";

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
  const [sortBy, setSortBy] = useState<SortOption>("nameAsc");
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const { contacts, isLoading, error, toggleFavorite } = useContacts();
  const navigate = useNavigate();
  
  const getSortedContacts = () => {
    return contacts.filter(contact => 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.company && contact.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      contact.number.includes(searchTerm)
    ).sort((a, b) => {
      switch (sortBy) {
        case "nameAsc":
          return a.name.localeCompare(b.name);
        case "nameDesc":
          return b.name.localeCompare(a.name);
        case "company":
          const companyA = a.company || "";
          const companyB = b.company || "";
          return companyA.localeCompare(companyB) || a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  };

  const handleAddNewContact = () => {
    navigate("/contacts/edit/0");
  };

  const handleEditContact = (contactId: number) => {
    navigate(`/contacts/edit/${contactId}`);
  };

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
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Sort by <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy("nameAsc")}>
                Name (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("nameDesc")}>
                Name (Z-A)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("company")}>
                Company
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            size="sm" 
            className="bg-softphone-accent hover:bg-blue-600"
            onClick={handleAddNewContact}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>
      
      <ContactSearchBar 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      
      <div className="space-y-2">
        {getSortedContacts().map((contact) => (
          <ContactItem
            key={contact.id}
            contact={contact}
            onToggleFavorite={toggleFavorite}
            onEdit={() => handleEditContact(contact.id)}
          />
        ))}
        
        {getSortedContacts().length === 0 && (
          <div className="text-center py-6 text-gray-500">
            No contacts found
          </div>
        )}
      </div>
    </div>
  );
};

export default Contacts;
