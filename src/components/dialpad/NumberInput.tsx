
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Delete } from "lucide-react";

interface NumberInputProps {
  number: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onBackspace: () => void;
}

const NumberInput = ({ number, onChange, onClear, onBackspace }: NumberInputProps) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers, *, and #
    if (/^[0-9*#]*$/.test(value)) {
      onChange(value);
    }
  };

  return (
    <div className="mb-4 relative">
      <Input
        value={number}
        onChange={handleInputChange}
        className="text-2xl py-6 px-4 text-center font-medium pr-20"
        placeholder="Enter number"
        type="tel"
        pattern="[0-9*#]*"
      />
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBackspace}
          className="hover:bg-gray-100"
        >
          <Delete className="h-5 w-5" />
        </Button>
        {number && (
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-gray-100"
            onClick={onClear}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default NumberInput;
