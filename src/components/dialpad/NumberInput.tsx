
import React from 'react';
import { Button } from "@/components/ui/button";
import { X, Delete } from "lucide-react";

interface NumberInputProps {
  number: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  disabled?: boolean;
}

const NumberInput = ({ number, onChange, onClear, onBackspace, disabled = false }: NumberInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Filter out non-numeric/non-special characters
    const value = e.target.value.replace(/[^0-9*#+]/g, '');
    onChange(value);
  };

  return (
    <div className="relative mb-4">
      <input
        type="text"
        value={number}
        onChange={handleChange}
        className="w-full py-4 px-6 text-2xl text-center rounded-md border border-gray-300 focus:ring-2 focus:ring-softphone-accent focus:border-transparent"
        placeholder="Enter number"
        disabled={disabled}
      />
      {number && (
        <div className="absolute right-0 top-0 h-full flex">
          <Button
            variant="ghost"
            className="h-full px-3 text-gray-500 hover:text-gray-700"
            onClick={onClear}
            disabled={disabled}
          >
            <X className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            className="h-full px-3 mr-1 text-gray-500 hover:text-gray-700"
            onClick={onBackspace}
            disabled={disabled}
          >
            <Delete className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default NumberInput;
