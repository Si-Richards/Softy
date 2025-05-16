
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Home, Phone, Clock, Users, Settings, ChartBar, Voicemail, MessageSquare, ChevronLeft, ChevronRight, UserRound, BellOff } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface SidebarProps {
  // Make these props optional with default values
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  connectionStatus: "connected" | "disconnected" | "connecting";
  doNotDisturb: boolean;
  setDoNotDisturb: (state: boolean) => void;
  userPresence: "available" | "away" | "busy" | "offline";
}

const Sidebar = ({
  activeTab: propsActiveTab,
  setActiveTab: propsSetActiveTab,
  connectionStatus,
  doNotDisturb,
  setDoNotDisturb,
  userPresence
}: SidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeTab, setActiveTab] = useState(() => propsActiveTab || "home");
  
  const user = {
    name: "John Doe",
    avatar: null // Set to null to use the fallback icon
  };
  const version = "v1.0.0";

  // Static badge counts - these won't update dynamically
  const BADGE_COUNTS = {
    history: 3,
    messages: 5,
    voicemail: 3
  };
  
  // Update local activeTab state when URL hash changes
  useEffect(() => {
    const updateFromHash = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        setActiveTab(hash);
      } else {
        setActiveTab("home");
      }
    };
    
    // Set initial state from URL
    updateFromHash();
    
    // Listen for hash changes
    window.addEventListener('hashchange', updateFromHash);
    return () => window.removeEventListener('hashchange', updateFromHash);
  }, []);
  
  const tabs = [{
    id: "home",
    label: "Home",
    icon: <Home className="w-[27.5px] h-[27.5px]" />
  }, {
    id: "dialpad",
    label: "Dialpad",
    icon: <Phone className="w-[27.5px] h-[27.5px]" />
  }, {
    id: "history",
    label: "Call History",
    icon: <Clock className="w-[27.5px] h-[27.5px]" />,
    badge: BADGE_COUNTS.history
  }, {
    id: "contacts",
    label: "Contacts",
    icon: <Users className="w-[27.5px] h-[27.5px]" />
  }, {
    id: "messages",
    label: "Messages",
    icon: <MessageSquare className="w-[27.5px] h-[27.5px]" />,
    badge: BADGE_COUNTS.messages
  }, {
    id: "voicemail",
    label: "Voicemail",
    icon: <Voicemail className="w-[27.5px] h-[27.5px]" />,
    badge: BADGE_COUNTS.voicemail
  }, {
    id: "statistics",
    label: "Statistics",
    icon: <ChartBar className="w-[27.5px] h-[27.5px]" />
  }, {
    id: "settings",
    label: "Settings",
    icon: <Settings className="w-[27.5px] h-[27.5px]" />
  }];
  
  const handleTabClick = (tabId: string) => {
    // Update local state
    setActiveTab(tabId);
    
    // Update parent state if function is provided
    if (propsSetActiveTab) {
      propsSetActiveTab(tabId);
    }
    
    // Update the URL hash
    window.location.hash = tabId;
  };
  
  const handleExpandToggle = () => {
    setIsTransitioning(true);
    setIsExpanded(!isExpanded);
    setTimeout(() => setIsTransitioning(false), 300);
  };
  
  const getPresenceColor = () => {
    if (doNotDisturb) return "bg-softphone-error";
    switch (userPresence) {
      case "available":
        return "bg-softphone-success";
      case "busy":
        return "bg-softphone-error";
      case "away":
        return "bg-yellow-500";
      case "offline":
        return "bg-gray-400";
    }
  };
  
  const getPresenceText = () => {
    if (doNotDisturb) return "Do Not Disturb";
    return userPresence.charAt(0).toUpperCase() + userPresence.slice(1);
  };
  
  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "bg-softphone-success";
      case "connecting":
        return "bg-yellow-500";
      case "disconnected":
        return "bg-red-500";
    }
  };
  
  const getStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "disconnected":
        return "Disconnected";
    }
  };
  
  return <div className={cn("h-full bg-softphone-dark flex flex-col border-r border-gray-700 transition-all duration-300", isExpanded ? "w-52" : "w-20")}>
      <div className="p-4 border-b border-gray-700">
        <div className={cn("flex items-center gap-3", !isExpanded && "justify-center")}>
          <Avatar>
            {user.avatar ? (
              <AvatarImage src={user.avatar} alt={user.name} />
            ) : (
              <AvatarFallback>
                <UserRound className="w-6 h-6 text-gray-400" />
              </AvatarFallback>
            )}
          </Avatar>
          {isExpanded && <div className={cn("flex flex-col transition-opacity duration-200", isTransitioning ? "opacity-0" : "opacity-100")}>
              <span className="text-sm font-medium text-white">{user.name}</span>
              <div className="flex items-center space-x-2">
                <div className={cn("h-2 w-2 rounded-full", getPresenceColor())}></div>
                <span className="text-xs text-gray-400">{getPresenceText()}</span>
              </div>
            </div>}
        </div>
        
        {isExpanded && <div className="mt-3 flex items-center gap-2">
            <Switch id="dnd-mode" checked={doNotDisturb} onCheckedChange={setDoNotDisturb} className="scale-75 data-[state=checked]:bg-softphone-error" />
            <Label htmlFor="dnd-mode" className="flex items-center gap-1 text-xs text-gray-300 cursor-pointer">
              <BellOff className={cn("h-3 w-3", doNotDisturb ? "text-softphone-error" : "text-gray-400")} />
              DND
            </Label>
          </div>}
      </div>

      <TooltipProvider>
        <div className="flex-1 py-6 flex flex-col items-center">
          {tabs.map(tab => <Tooltip key={tab.id} delayDuration={300}>
              <TooltipTrigger asChild>
                <div className="relative w-full px-3 mb-4">
                  <Button variant="ghost" size={isExpanded ? "default" : "icon"} className={cn("w-full rounded-xl flex items-center gap-3", !isExpanded ? "justify-center" : "justify-start", activeTab === tab.id ? "bg-softphone-primary text-white" : "text-gray-400 hover:text-white hover:bg-gray-700")} onClick={() => handleTabClick(tab.id)}>
                    {tab.icon}
                    {isExpanded && <div className={cn("flex items-center justify-between flex-1 transition-opacity duration-200", isTransitioning ? "opacity-0" : "opacity-100")}>
                        <span>{tab.label}</span>
                        {tab.badge && tab.badge > 0 && <Badge className="ml-auto bg-softphone-error text-white text-xs" variant="destructive">
                            {tab.badge}
                          </Badge>}
                      </div>}
                  </Button>
                  {!isExpanded && tab.badge && tab.badge > 0 && <Badge className={cn("absolute -top-1 right-2 px-2 min-w-[20px] h-5 bg-softphone-error text-white text-xs flex items-center justify-center rounded-full")} variant="destructive">
                      {tab.badge}
                    </Badge>}
                </div>
              </TooltipTrigger>
              {!isExpanded && <TooltipContent side="right">
                  {tab.label}
                  {tab.badge && tab.badge > 0 && ` (${tab.badge} new)`}
                </TooltipContent>}
            </Tooltip>)}
        </div>
      </TooltipProvider>

      <div className="p-4 border-t border-gray-700 flex flex-col gap-3">
        {isExpanded && <div className="flex items-center space-x-2 px-[5px]">
            <div className={cn("h-2 w-2 rounded-full", getStatusColor())}></div>
            <span className="text-xs text-gray-300">{getStatusText()}</span>
          </div>}
        
        <div className="flex flex-col items-center gap-3">
          <Button variant="ghost" size="icon" className="w-full rounded-xl text-gray-400 hover:text-white hover:bg-gray-700" onClick={handleExpandToggle}>
            {isExpanded ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </Button>
          <span className="text-xs text-gray-500">{version}</span>
        </div>
      </div>
    </div>;
};

export default Sidebar;
