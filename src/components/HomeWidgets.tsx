
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Phone, Clock, Users, MessageSquare, Voicemail, ChartBar } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import Dialpad from "@/components/Dialpad";
import FavoriteContacts from "./widgets/FavoriteContacts";
import AddWidgetButton from "./widgets/AddWidgetButton";
import EmptyDashboard from "./widgets/EmptyDashboard";
import WidgetHeader from "./widgets/WidgetHeader";
import { Widget } from "@/types/widgets";

interface HomeWidgetsProps {
  setActiveTab: (tab: string) => void;
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
          <AddWidgetButton 
            availableWidgets={availableWidgets}
            addWidget={addWidget}
            widgets={widgets}
          />
          
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
              <WidgetHeader
                title={widget.title}
                type={widget.type}
                onRemove={removeWidget}
                onOpen={handleWidgetClick}
                widgetId={widget.id}
              />
              <CardDescription>Quick access to {widget.title.toLowerCase()}</CardDescription>
            </CardHeader>
            {renderWidget(widget)}
          </Card>
        ))}
      </div>

      {widgets.length === 0 && (
        <EmptyDashboard availableWidgets={availableWidgets} addWidget={addWidget} />
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
