
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import userInteractionService from "@/services/UserInteractionService";
import audioVolumeManager from "@/services/AudioVolumeManager";
import Index from "./pages/Index";
import ContactEdit from "./pages/ContactEdit";
import NotFound from "./pages/NotFound";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import AudioDebugPanel from "@/components/audio/AudioDebugPanel";

const queryClient = new QueryClient();

// Wrapper component to handle the contact edit as a modal dialog
const ContactEditWrapper = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Convert the id param to a number and provide the onClose function
  const contactId = id ? parseInt(id, 10) : 0;
  const handleClose = () => navigate(-1); // Navigate back to previous page
  
  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
        <ContactEdit contactId={contactId} onClose={handleClose} />
      </DialogContent>
    </Dialog>
  );
};

// Initialize essential services at the app root level
const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  useEffect(() => {
    // Initialize user interaction detection as early as possible
    console.log("Initializing user interaction service");
    userInteractionService.initialize();
    
    // Initialize audio volume manager
    console.log("Initializing audio volume manager");
    audioVolumeManager.initialize();
    
    // Check for debug mode in URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('audioDebug')) {
      setShowDebugPanel(true);
    }
    
    // Listen for debug keyboard shortcut (Ctrl+Shift+D)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDebugPanel(prev => !prev);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  return (
    <>
      {children}
      <AudioDebugPanel visible={showDebugPanel} />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppInitializer>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/contacts/edit/:id" element={<ContactEditWrapper />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppInitializer>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
