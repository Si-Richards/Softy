
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Move, Minimize } from "lucide-react";

interface DraggableDialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  children: React.ReactNode;
  minimizable?: boolean;
}

const DraggableDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DraggableDialogContentProps
>(({ className, children, minimizable, ...props }, ref) => {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).classList.contains('drag-handle')) {
      setIsDragging(true);
    }
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition(prev => ({
          x: prev.x + e.movementX,
          y: prev.y + e.movementY
        }));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Create a context to provide isMinimized state to children
  const MinimizedContext = React.createContext(false);

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content
        ref={ref}
        style={{
          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`
        }}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
          isMinimized ? "max-w-[300px]" : "max-w-lg p-6",
          className
        )}
        {...props}
      >
        <div 
          className="absolute top-0 left-0 right-0 h-8 cursor-move bg-muted/40 rounded-t-lg flex items-center justify-between px-2 drag-handle" 
          onMouseDown={handleMouseDown}
        >
          <Move className="h-4 w-4 text-muted-foreground" />
          {minimizable && (
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-muted/60 rounded"
            >
              <Minimize className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className={cn("mt-4", isMinimized ? "p-4" : "")}>
          <MinimizedContext.Provider value={isMinimized}>
            {children}
          </MinimizedContext.Provider>
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
DraggableDialogContent.displayName = "DraggableDialogContent";

// Create a custom hook to access the minimized state
export const useMinimizedState = (): boolean => {
  return React.useContext(React.createContext(false));
};

export { DraggableDialogContent };
