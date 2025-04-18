
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Widget } from "@/types/widgets";

interface AddWidgetButtonProps {
  availableWidgets: Widget[];
  addWidget: (widgetType: string) => void;
  widgets: Widget[];
}

const AddWidgetButton: React.FC<AddWidgetButtonProps> = ({
  availableWidgets,
  addWidget,
  widgets,
}) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                Add Widget
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add a new widget to your dashboard</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </SheetTrigger>
      <SheetContent side="right">
        <h3 className="text-lg font-medium mb-4">Available Widgets</h3>
        <div className="grid gap-4">
          {availableWidgets.map((widget) => (
            <Button
              key={widget.type}
              variant="outline"
              className="justify-start"
              onClick={() => {
                addWidget(widget.type);
              }}
              disabled={widgets.some(w => w.type === widget.type)}
            >
              {widget.icon}
              <span className="ml-2">{widget.title}</span>
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddWidgetButton;
