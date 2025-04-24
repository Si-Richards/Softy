
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Home, Phone, Clock, Users, Settings, Volume2, ChartBar, Voicemail, MessageSquare, ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar = ({ activeTab, setActiveTab }: SidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  // Mock unread counts - in a real app these would come from your state management
  const unreadVoicemails = 3;
  const unreadMessages = 5;
  const missedCalls = 3;

  // Mock user data - in a real app this would come from your auth state
  const user = {
    name: "John Doe",
    avatar: "/placeholder.svg"
  };

  // Mock version info - in a real app this would come from your env vars
  const version = "v1.0.0";

  const tabs = [
    { id: "home", label: "Home", icon: <Home className="w-[27.5px] h-[27.5px]" /> },
    { id: "dialpad", label: "Dialpad", icon: <Phone className="w-[27.5px] h-[27.5px]" /> },
    { 
      id: "history", 
      label: "Call History", 
      icon: <Clock className="w-[27.5px] h-[27.5px]" />,
      badge: missedCalls
    },
    { id: "contacts", label: "Contacts", icon: <Users className="w-[27.5px] h-[27.5px]" /> },
    { 
      id: "messages", 
      label: "Messages", 
      icon: <MessageSquare className="w-[27.5px] h-[27.5px]" />,
      badge: unreadMessages
    },
    { 
      id: "voicemail", 
      label: "Voicemail", 
      icon: <Voicemail className="w-[27.5px] h-[27.5px]" />,
      badge: unreadVoicemails 
    },
    { id: "statistics", label: "Statistics", icon: <ChartBar className="w-[27.5px] h-[27.5px]" /> },
    { id: "audio", label: "Audio", icon: <Volume2 className="w-[27.5px] h-[27.5px]" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-[27.5px] h-[27.5px]" /> },
  ];

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
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">{user.name}</span>
              <span className="text-xs text-gray-400">Online</span>
            </div>
          )}
        </div>
      </div>

      <TooltipProvider>
        <div className="flex-1 py-6 flex flex-col items-center">
          {tabs.map((tab) => (
            <Tooltip key={tab.id}>
              <TooltipTrigger asChild>
                <div className="relative w-full px-3 mb-4">
                  <Button
                    variant="ghost"
                    size={isExpanded ? "default" : "icon"}
                    className={cn(
                      "w-full rounded-xl flex items-center gap-3 justify-start",
                      activeTab === tab.id
                        ? "bg-softphone-primary text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-700"
                    )}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.icon}
                    {isExpanded && <span>{tab.label}</span>}
                  </Button>
                  {tab.badge && tab.badge > 0 && (
                    <Badge 
                      className={cn(
                        "absolute -top-1 px-2 min-w-[20px] h-5 bg-softphone-error text-white text-xs flex items-center justify-center rounded-full",
                        isExpanded ? "right-6" : "right-2"
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
            onClick={() => setIsExpanded(!isExpanded)}
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
