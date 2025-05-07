
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const staticBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface StaticBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof staticBadgeVariants> {
  count: number;
}

// React.memo prevents unnecessary re-renders
const StaticBadge = React.memo(function StaticBadge({ 
  className, 
  variant, 
  count,
  ...props 
}: StaticBadgeProps) {
  return (
    <div className={cn(staticBadgeVariants({ variant }), className)} {...props}>
      {count}
    </div>
  )
})

StaticBadge.displayName = "StaticBadge"

export { StaticBadge, staticBadgeVariants }
