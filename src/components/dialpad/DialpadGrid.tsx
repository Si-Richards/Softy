
import React from 'react';
import { Button } from "@/components/ui/button";

interface DialpadGridProps {
  onKeyPress: (key: string) => void;
}

const DialpadGrid = ({ onKeyPress }: DialpadGridProps) => {
  const dialpadButtons = [
    "1", "2", "3",
    "4", "5", "6",
    "7", "8", "9",
    "*", "0", "#"
  ];

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {dialpadButtons.map((btn) => (
        <Button
          key={btn}
          variant="outline"
          className="h-14 text-xl font-semibold hover:bg-softphone-accent hover:text-white"
          onClick={() => onKeyPress(btn)}
        >
          {btn}
        </Button>
      ))}
    </div>
  );
};

export default DialpadGrid;
