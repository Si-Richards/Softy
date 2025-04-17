
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Phone, UserPlus, MessageSquare, Video } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Sample contacts data with avatars
const mockContacts = [
  { 
    id: 1, 
    name: "John Doe", 
    number: "+1 (555) 123-4567", 
    favorite: true,
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=120&h=120"
  },
  { 
    id: 2, 
    name: "Alice Smith", 
    number: "+1 (555) 987-6543", 
    favorite: true,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120"
  },
  { 
    id: 3, 
    name: "Bob Johnson", 
    number: "+1 (555) 456-7890", 
    favorite: false,
    avatar: null
  },
  { 
    id: 4, 
    name: "Carol Williams", 
    number: "+1 (555) 567-8901", 
    favorite: false,
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=120&h=120"
  },
  { 
    id: 5, 
    name: "David Brown", 
    number: "+1 (555) 678-9012", 
    favorite: false,
    avatar: null
  },
  { 
    id: 6, 
    name: "Emma Davis", 
    number: "+1 (555) 789-0123", 
    favorite: false,
    avatar: "https://images.unsplash.com/photo-1629467057571-42d22d8f0cbd?auto=format&fit=crop&q=80&w=120&h=120"
  },
  { 
    id: 7, 
    name: "Frank Miller", 
    number: "+1 (555) 890-1234", 
    favorite: false,
    avatar: null
  },
  { 
    id: 8, 
    name: "Grace Wilson", 
    number: "+1 (555) 901-2345", 
    favorite: false,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120&h=120"
  },
].sort((a, b) => a.name.localeCompare(b.name));

const Contacts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredContacts = mockContacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.number.includes(searchTerm)
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

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
      
      <div className="space-y-2">
        {filteredContacts.map(contact => (
          <div 
            key={contact.id}
            className="flex items-center p-3 rounded-lg hover:bg-gray-100"
          >
            <Avatar className="h-12 w-12 mr-3">
              {contact.avatar ? (
                <AvatarImage src={contact.avatar} alt={contact.name} />
              ) : (
                <AvatarFallback className="bg-softphone-accent text-white">
                  {getInitials(contact.name)}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="flex-1">
              <div className="font-medium">{contact.name}</div>
              <div className="text-sm text-gray-500">{contact.number}</div>
            </div>
            
            <div className="flex space-x-1">
              <Button size="icon" variant="ghost" className="text-softphone-success">
                <Phone className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="text-softphone-accent">
                <Video className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="text-softphone-primary">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
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
