
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import ContactEdit from "./pages/ContactEdit";
import NotFound from "./pages/NotFound";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const queryClient = new QueryClient();

// Wrapper component to handle the contact edit as a modal dialog
const ContactEditWrapper = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Convert the id param to a number and provide the onClose function
  const contactId = id ? parseInt(id, 10) : 0;
  const handleClose = () => navigate("/");
  
  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-y-auto max-h-[90vh]">
        <ContactEdit contactId={contactId} onClose={handleClose} />
      </DialogContent>
    </Dialog>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
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
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
