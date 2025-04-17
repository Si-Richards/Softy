
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Phone, UserPlus } from "lucide-react";

// Sample contacts data
const mockContacts = [
  { id: 1, name: "John Doe", number: "+1 (555) 123-4567", favorite: true },
  { id: 2, name: "Alice Smith", number: "+1 (555) 987-6543", favorite: true },
  { id: 3, name: "Bob Johnson", number: "+1 (555) 456-7890", favorite: false },
  { id: 4, name: "Carol Williams", number: "+1 (555) 567-8901", favorite: false },
  { id: 5, name: "David Brown", number: "+1 (555) 678-9012", favorite: false },
  { id: 6, name: "Emma Davis", number: "+1 (555) 789-0123", favorite: false },
  { id: 7, name: "Frank Miller", number: "+1 (555) 890-1234", favorite: false },
  { id: 8, name: "Grace Wilson", number: "+1 (555) 901-2345", favorite: false },
].sort((a, b) => a.name.localeCompare(b.name));

const Contacts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredContacts = mockContacts.filter(contact => 
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
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input 
          placeholder="Search contacts..." 
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="space-y-1">
        {filteredContacts.map(contact => (
          <div 
            key={contact.id}
            className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <div>
              <div className="font-medium">{contact.name}</div>
              <div className="text-sm text-gray-500">{contact.number}</div>
            </div>
            <Button size="icon" variant="ghost" className="text-softphone-success">
              <Phone className="h-4 w-4" />
            </Button>
          </div>
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
