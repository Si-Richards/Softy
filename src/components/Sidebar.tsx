
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Home, Phone, Clock, Users, Settings, Laptop, ChartBar, Voicemail, MessageSquare, ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar = ({ activeTab, setActiveTab }: SidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const user = {
    name: "John Doe",
    avatar: "/placeholder.svg"
  };

  const version = "v1.0.0";

  // Static badge counts - these won't update dynamically
  const BADGE_COUNTS = {
    history: 3,
    messages: 5,
    voicemail: 3
  };

  const tabs = [
    { id: "home", label: "Home", icon: <Home className="w-[27.5px] h-[27.5px]" /> },
    { id: "dialpad", label: "Dialpad", icon: <Phone className="w-[27.5px] h-[27.5px]" /> },
    { 
      id: "history", 
      label: "Call History", 
      icon: <Clock className="w-[27.5px] h-[27.5px]" />,
      badge: BADGE_COUNTS.history
    },
    { id: "contacts", label: "Contacts", icon: <Users className="w-[27.5px] h-[27.5px]" /> },
    { 
      id: "messages", 
      label: "Messages", 
      icon: <MessageSquare className="w-[27.5px] h-[27.5px]" />,
      badge: BADGE_COUNTS.messages
    },
    { 
      id: "voicemail", 
      label: "Voicemail", 
      icon: <Voicemail className="w-[27.5px] h-[27.5px]" />,
      badge: BADGE_COUNTS.voicemail
    },
    { id: "statistics", label: "Statistics", icon: <ChartBar className="w-[27.5px] h-[27.5px]" /> },
    { id: "devices", label: "Devices", icon: <Laptop className="w-[27.5px] h-[27.5px]" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-[27.5px] h-[27.5px]" /> },
  ];

  const handleExpandToggle = () => {
    setIsTransitioning(true);
    setIsExpanded(!isExpanded);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  return (
    <div className={cn(
      "h-full bg-softphone-dark flex flex-col border-r border-gray-700 transition-all duration-300",
      isExpanded ? "w-52" : "w-20"
    )}>
      <div className="p-4 border-b border-gray-700">
        <div className={cn(
          "flex items-center gap-3",
          !isExpanded && "justify-center"
        )}>
          <Avatar>
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>
              <UserRound className="w-6 h-6 text-gray-400" />
            </AvatarFallback>
          </Avatar>
          {isExpanded && (
            <div className={cn(
              "flex flex-col transition-opacity duration-200",
              isTransitioning ? "opacity-0" : "opacity-100"
            )}>
              <span className="text-sm font-medium text-white">{user.name}</span>
              <span className="text-xs text-gray-400">Online</span>
            </div>
          )}
        </div>
      </div>

      <TooltipProvider>
        <div className="flex-1 py-6 flex flex-col items-center">
          {tabs.map((tab) => (
            <Tooltip key={tab.id} delayDuration={300}>
              <TooltipTrigger asChild>
                <div className="relative w-full px-3 mb-4">
                  <Button
                    variant="ghost"
                    size={isExpanded ? "default" : "icon"}
                    className={cn(
                      "w-full rounded-xl flex items-center gap-3",
                      !isExpanded ? "justify-center" : "justify-start",
                      activeTab === tab.id
                        ? "bg-softphone-primary text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-700"
                    )}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.icon}
                    {isExpanded && (
                      <div className={cn(
                        "flex items-center justify-between flex-1 transition-opacity duration-200",
                        isTransitioning ? "opacity-0" : "opacity-100"
                      )}>
                        <span>{tab.label}</span>
                        {tab.badge && tab.badge > 0 && (
                          <Badge 
                            className="ml-auto bg-softphone-error text-white text-xs"
                            variant="destructive"
                          >
                            {tab.badge}
                          </Badge>
                        )}
                      </div>
                    )}
                  </Button>
                  {!isExpanded && tab.badge && tab.badge > 0 && (
                    <Badge 
                      className={cn(
                        "absolute -top-1 right-2 px-2 min-w-[20px] h-5 bg-softphone-error text-white text-xs flex items-center justify-center rounded-full"
                      )}
                      variant="destructive"
                    >
                      {tab.badge}
                    </Badge>
                  )}
                </div>
              </TooltipTrigger>
              {!isExpanded && (
                <TooltipContent side="right">
                  {tab.label}
                  {tab.badge && tab.badge > 0 && ` (${tab.badge} new)`}
                </TooltipContent>
              )}
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      <div className="p-4 border-t border-gray-700">
        <div className="flex flex-col items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="w-full rounded-xl text-gray-400 hover:text-white hover:bg-gray-700"
            onClick={handleExpandToggle}
          >
            {isExpanded ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </Button>
          <span className="text-xs text-gray-500">{version}</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
