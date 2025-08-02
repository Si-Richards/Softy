
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import PageHeader from "./PageHeader";
import MainContent from "./MainContent";
import MobileDialpadDrawer from "./MobileDialpadDrawer";
import IncomingCallHandler from "./IncomingCallHandler";
import { useJanusSetup } from "@/components/dialpad/useJanusSetup";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

// Define user presence type
type UserPresence = "available" | "away" | "busy" | "offline";

const MainLayout = () => {
  // Auth context
  const { logout } = useAuth();
  const navigate = useNavigate();

  // State management
  const [activeTab, setActiveTab] = useState("home");
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("disconnected");
  const [doNotDisturb, setDoNotDisturb] = useState(false);
  const [userPresence, setUserPresence] = useState<UserPresence>("available");
  
  // Get Janus connection status
  const { isJanusConnected, isRegistered, janusService } = useJanusSetup();
  const { toast } = useToast();
  
  // Check for stored credentials on mount and try to connect automatically
  useEffect(() => {
    try {
      const storedCredentials = localStorage.getItem('sipCredentials');
      if (storedCredentials && !isRegistered && !isJanusConnected) {
        const { username, password, sipHost } = JSON.parse(storedCredentials);
        if (username && password) {
          console.log("Found stored credentials, attempting automatic registration");
          
          // Extended delay for auto-registration to ensure full initialization
          const timer = setTimeout(() => {
            console.log('🚀 Starting auto-registration with extended delay...');
            
            janusService.initialize({
              server: 'wss://devrtc.voicehost.io:443/janus',
              apiSecret: 'overlord',
              success: async () => {
                try {
                  // Additional delay before SIP registration to ensure Sofia stack is ready
                  console.log('⏳ Waiting for Sofia stack before auto-registration...');
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  
                  await janusService.register(username, password, sipHost || "hpbx.sipconvergence.co.uk:5060");
                  toast({
                    title: "Auto-connected",
                    description: "Successfully registered with saved credentials",
                  });
                } catch (error) {
                  console.error("Auto-registration failed:", error);
                  // Don't show toast for auto-registration failures to avoid spam
                }
              },
              error: (error) => {
                console.error("Auto-connection failed:", error);
              }
            });
          }, 2000); // Increased from 1000ms to 2000ms
          
          return () => clearTimeout(timer);
        }
      }
    } catch (error) {
      console.error("Error loading stored credentials:", error);
    }
  // We only want this to run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Update connection status when Janus connection changes
  useEffect(() => {
    console.log("MainLayout: isJanusConnected =", isJanusConnected, "isRegistered =", isRegistered);
    
    if (isJanusConnected) {
      if (isRegistered) {
        setConnectionStatus("connected");
      } else {
        // Connected to WebRTC server but not registered with SIP
        setConnectionStatus("connecting");
      }
    } else {
      setConnectionStatus("disconnected");
    }
  }, [isJanusConnected, isRegistered]);

  // Handle logout
  const handleLogout = () => {
    // Disconnect from Janus if connected
    if (isJanusConnected) {
      janusService.disconnect();
    }
    
    // Log out from auth system
    logout();
    
    // Navigate to login page
    navigate("/login");
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className="w-full max-w-5xl mx-auto my-8 bg-white rounded-xl shadow-lg overflow-hidden flex">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          connectionStatus={connectionStatus}
          doNotDisturb={doNotDisturb}
          setDoNotDisturb={setDoNotDisturb}
          userPresence={userPresence}
        />
        
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center">
            <PageHeader 
              doNotDisturb={doNotDisturb}
              setDoNotDisturb={setDoNotDisturb}
              userPresence={userPresence}
              connectionStatus={connectionStatus}
            />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="mr-4 text-gray-500 hover:text-gray-700"
            >
              Logout
              <LogOut className="ml-1 w-4 h-4" />
            </Button>
          </div>
          
          <MainContent activeTab={activeTab} />
        </div>
      </div>

      {/* Mobile and call handling elements */}
      <MobileDialpadDrawer />
      <IncomingCallHandler />
    </div>
  );
};

export default MainLayout;
