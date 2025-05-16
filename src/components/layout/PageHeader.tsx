
import React from "react";

type UserPresence = "available" | "away" | "busy" | "offline";

interface PageHeaderProps {
  doNotDisturb: boolean;
  setDoNotDisturb: (value: boolean) => void;
  userPresence: UserPresence;
  connectionStatus: "connected" | "disconnected" | "connecting";
}

const PageHeader: React.FC<PageHeaderProps> = ({
  doNotDisturb,
  setDoNotDisturb,
  userPresence,
  connectionStatus
}) => {
  // Get page title based on the current hash
  const getPageTitle = () => {
    const hash = window.location.hash.replace("#", "") || "home";
    
    switch (hash) {
      case "home": return "Quick Dial";
      case "dialpad": return "Dialpad";
      case "history": return "Call History";
      case "contacts": return "Contacts";
      case "messages": return "Messages";
      case "voicemail": return "Voicemail";
      case "statistics": return "Statistics";
      case "settings": return "Settings";
      default: return "Quick Dial";
    }
  };

  const pageTitle = getPageTitle();
  
  return (
    <div className="flex-1 border-b p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold">{pageTitle}</h1>
      
      <div className="flex items-center space-x-4">
        {/* Status indicator */}
        <div className="hidden md:flex items-center space-x-2">
          <span className="text-sm text-gray-500">Status:</span>
          <div className="flex items-center">
            {connectionStatus === "connected" ? (
              <>
                <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                <span className="text-sm">Connected</span>
              </>
            ) : connectionStatus === "connecting" ? (
              <>
                <span className="h-2 w-2 rounded-full bg-yellow-500 mr-1"></span>
                <span className="text-sm">Connecting...</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-red-500 mr-1"></span>
                <span className="text-sm">Disconnected</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
