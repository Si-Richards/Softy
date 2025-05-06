
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        // Determine border color based on toast type
        let borderColor = "border-l-blue-500";
        
        if (variant === "destructive") {
          borderColor = "border-l-red-500";
        } else if (title && title.includes("Incoming Call")) {
          borderColor = "border-l-green-500";
        } else if (title && title.includes("Registered")) {
          borderColor = "border-l-green-500";
        }
        
        return (
          <Toast key={id} {...props} className={`border-l-4 ${borderColor}`}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
