
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface NumberInputProps {
  number: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

const NumberInput = ({ number, onChange, onClear }: NumberInputProps) => {
  return (
    <div className="mb-4 relative">
      <Input
        value={number}
        onChange={(e) => onChange(e.target.value)}
        className="text-2xl py-6 px-4 text-center font-medium"
        placeholder="Enter number"
      />
      {number && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 transform -translate-y-1/2"
          onClick={onClear}
        >
          <X className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

export default NumberInput;
