
import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Widget } from "@/types/widgets";

interface EmptyDashboardProps {
  availableWidgets: Widget[];
  addWidget: (widgetType: string) => void;
}

const EmptyDashboard: React.FC<EmptyDashboardProps> = ({ availableWidgets, addWidget }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed space-y-4">
      <div className="p-4 rounded-full bg-gray-100">
        <Plus className="h-8 w-8 text-gray-400" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Add Widgets</h3>
        <p className="text-sm text-gray-500 max-w-md">
          Your dashboard is empty. Click "Add Widget" to customize your home page with the information you need.
        </p>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Sheet>
              <SheetTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Widget
                </Button>
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
                    >
                      {widget.icon}
                      <span className="ml-2">{widget.title}</span>
                    </Button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </TooltipTrigger>
          <TooltipContent>Add your first widget to the dashboard</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default EmptyDashboard;
