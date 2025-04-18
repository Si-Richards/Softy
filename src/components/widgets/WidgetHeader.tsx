
import React from "react";
import { Button } from "@/components/ui/button";
import { GripHorizontal, Plus, X } from "lucide-react";
import { CardTitle } from "@/components/ui/card";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface WidgetHeaderProps {
  title: string;
  type: string;
  onRemove: (id: string) => void;
  onOpen: (type: string) => void;
  widgetId: string;
}

const WidgetHeader: React.FC<WidgetHeaderProps> = ({
  title,
  type,
  onRemove,
  onOpen,
  widgetId,
}) => {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <GripHorizontal className="h-4 w-4 text-gray-400 cursor-grab" />
        <CardTitle className="text-base">{title}</CardTitle>
      </div>
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={() => onOpen(type)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open {title} page</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-gray-500" 
                onClick={() => onRemove(widgetId)}
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove widget</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default WidgetHeader;
