
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Home, Phone, Clock, Users, Settings, Volume2, Video, MessageSquare, ChartBar, Voicemail } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar = ({ activeTab, setActiveTab }: SidebarProps) => {
  // Mock unread counts - in a real app these would come from your state management
  const unreadVoicemails = 3;
  const unreadMessages = 5;

  const tabs = [
    { id: "home", label: "Home", icon: <Home className="w-5 h-5" /> },
    { id: "dialpad", label: "Dialpad", icon: <Phone className="w-5 h-5" /> },
    { id: "history", label: "Call History", icon: <Clock className="w-5 h-5" /> },
    { id: "contacts", label: "Contacts", icon: <Users className="w-5 h-5" /> },
    { 
      id: "messages", 
      label: "Messages", 
      icon: <MessageSquare className="w-5 h-5" />,
      badge: unreadMessages
    },
    { 
      id: "voicemail", 
      label: "Voicemail", 
      icon: <Voicemail className="w-5 h-5" />,
      badge: unreadVoicemails 
    },
    { id: "statistics", label: "Statistics", icon: <ChartBar className="w-5 h-5" /> },
    { id: "audio", label: "Audio", icon: <Volume2 className="w-5 h-5" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="h-full w-20 bg-softphone-dark flex flex-col items-center py-6 border-r border-gray-700">
      <TooltipProvider>
        {tabs.map((tab) => (
          <Tooltip key={tab.id}>
            <TooltipTrigger asChild>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "w-12 h-12 mb-4 rounded-xl flex flex-col justify-center items-center",
                    activeTab === tab.id
                      ? "bg-softphone-primary text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-700"
                  )}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                </Button>
                {tab.badge && tab.badge > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 px-2 min-w-[20px] h-5 bg-softphone-error text-white text-xs flex items-center justify-center rounded-full"
                    variant="destructive"
                  >
                    {tab.badge}
                  </Badge>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              {tab.label}
              {tab.badge && tab.badge > 0 && ` (${tab.badge} new)`}
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
};

export default Sidebar;
