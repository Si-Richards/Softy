
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ContactSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const ContactSearchBar = ({ searchTerm, onSearchChange }: ContactSearchBarProps) => {
  return (
    <div className="relative mb-6">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      <Input 
        placeholder="Search by name or company..." 
        className="pl-10"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
};

export default ContactSearchBar;
