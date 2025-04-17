
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, Phone, Clock, Users, Settings, Volume2, Video, MessageSquare, ChartBar, Voicemail } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar = ({ activeTab, setActiveTab }: SidebarProps) => {
  const tabs = [
    { id: "home", label: "Home", icon: <Home className="w-5 h-5" /> },
    { id: "dialpad", label: "Dialpad", icon: <Phone className="w-5 h-5" /> },
    { id: "history", label: "Call History", icon: <Clock className="w-5 h-5" /> },
    { id: "contacts", label: "Contacts", icon: <Users className="w-5 h-5" /> },
    { id: "messages", label: "Messages", icon: <MessageSquare className="w-5 h-5" /> },
    { id: "voicemail", label: "Voicemail", icon: <Voicemail className="w-5 h-5" /> },
    { id: "statistics", label: "Statistics", icon: <ChartBar className="w-5 h-5" /> },
    { id: "audio", label: "Audio", icon: <Volume2 className="w-5 h-5" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="h-full w-20 bg-softphone-dark flex flex-col items-center py-6 border-r border-gray-700">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
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
      ))}
    </div>
  );
};

export default Sidebar;
