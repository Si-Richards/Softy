import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Clock, Users, MessageSquare, Voicemail, ChartBar, Plus, X, GripHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Dialpad from "@/components/Dialpad";
import FavoriteContacts from "./widgets/FavoriteContacts";

interface HomeWidgetsProps {
  setActiveTab: (tab: string) => void;
}

interface Widget {
  id: string;
  title: string;
  type: string;
  icon: React.ReactNode;
  size: "small" | "medium" | "large";
}

const HomeWidgets = ({ setActiveTab }: HomeWidgetsProps) => {
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: "recent-calls", title: "Recent Calls", type: "history", icon: <Clock className="h-5 w-5" />, size: "medium" },
    { id: "quick-contacts", title: "Quick Contacts", type: "contacts", icon: <Users className="h-5 w-5" />, size: "medium" },
    { id: "recent-messages", title: "Recent Messages", type: "messages", icon: <MessageSquare className="h-5 w-5" />, size: "small" },
    { id: "call-stats", title: "Call Statistics", type: "statistics", icon: <ChartBar className="h-5 w-5" />, size: "small" },
  ]);

  const availableWidgets: Widget[] = [
    { id: "recent-calls", title: "Recent Calls", type: "history", icon: <Clock className="h-5 w-5" />, size: "medium" },
    { id: "quick-contacts", title: "Quick Contacts", type: "contacts", icon: <Users className="h-5 w-5" />, size: "medium" },
    { id: "recent-messages", title: "Recent Messages", type: "messages", icon: <MessageSquare className="h-5 w-5" />, size: "small" },
    { id: "call-stats", title: "Call Statistics", type: "statistics", icon: <ChartBar className="h-5 w-5" />, size: "small" },
    { id: "voicemail", title: "Voicemail", type: "voicemail", icon: <Voicemail className="h-5 w-5" />, size: "small" },
    { 
      id: "favorite-contacts", 
      title: "Favorite Contacts", 
      type: "favorite-contacts", 
      icon: <Users className="h-5 w-5" />, 
      size: "medium" 
    },
  ];

  const addWidget = (widgetType: string) => {
    const newWidget = availableWidgets.find(w => w.type === widgetType);
    if (newWidget && !widgets.some(w => w.type === widgetType)) {
      setWidgets([...widgets, {...newWidget, id: `${widgetType}-${Date.now()}`}]);
    }
  };

  const removeWidget = (widgetId: string) => {
    setWidgets(widgets.filter(w => w.id !== widgetId));
  };

  const handleWidgetClick = (type: string) => {
    setActiveTab(type);
  };

  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case "favorite-contacts":
        return <FavoriteContacts />;
      default:
        return (
          <CardContent className="min-h-[100px] flex items-center justify-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="text-softphone-primary border-softphone-accent/50"
                    onClick={() => handleWidgetClick(widget.type)}
                  >
                    {widget.icon}
                    <span className="ml-2">Open {widget.title}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Open {widget.title} page</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        );
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <div className="flex space-x-2">
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
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button className="bg-softphone-primary">
                      <Phone className="h-4 w-4 mr-2" />
                      Dialpad
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0">
                    <Dialpad />
                  </PopoverContent>
                </Popover>
              </TooltipTrigger>
              <TooltipContent>Open dialpad</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {widgets.map((widget) => (
          <Card 
            key={widget.id} 
            className={`${
              widget.size === "large" ? "col-span-full" : 
              widget.size === "medium" ? "col-span-1" : 
              "col-span-1"
            } shadow-sm hover:shadow transition-shadow`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <GripHorizontal className="h-4 w-4 text-gray-400 cursor-grab" />
                  <CardTitle className="text-base">{widget.title}</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0" 
                          onClick={() => handleWidgetClick(widget.type)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Open {widget.title} page</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-gray-500" 
                          onClick={() => removeWidget(widget.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Remove widget</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <CardDescription>Quick access to {widget.title.toLowerCase()}</CardDescription>
            </CardHeader>
            {renderWidget(widget)}
          </Card>
        ))}
      </div>

      {widgets.length === 0 && (
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
      )}

      {/* Global floating dialpad for mobile */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Sheet>
                <SheetTrigger asChild>
                  <Button size="lg" className="rounded-full h-14 w-14 bg-softphone-primary">
                    <Phone className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80%]">
                  <div className="pt-6">
                    <Dialpad />
                  </div>
                </SheetContent>
              </Sheet>
            </TooltipTrigger>
            <TooltipContent>Open dialpad</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default HomeWidgets;
