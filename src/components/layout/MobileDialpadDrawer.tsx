
import React from "react";
import { Phone } from "lucide-react";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import Dialpad from "@/components/Dialpad";

const MobileDialpadDrawer = () => {
  return (
    <Drawer>
      <DrawerTrigger className="fixed bottom-6 right-6 md:hidden z-50 bg-softphone-primary text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg">
        <Phone className="h-6 w-6" />
      </DrawerTrigger>
      <DrawerContent className="p-4">
        <Dialpad />
      </DrawerContent>
    </Drawer>
  );
};

export default MobileDialpadDrawer;
