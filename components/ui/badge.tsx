import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium capitalize whitespace-nowrap",
  {
    variants: {
      variant: {
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border border-border text-muted-foreground",
        positive: "bg-positive/10 text-positive",
        warning: "bg-warning/10 text-warning",
        destructive: "bg-destructive/10 text-destructive",
        primary: "bg-primary/10 text-primary",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  )
}

const ACTION_BADGE_VARIANT: Record<string, VariantProps<typeof badgeVariants>["variant"]> = {
  buy: "positive",
  hold: "warning",
  avoid: "destructive",
}

function actionBadgeVariant(action: string) {
  return ACTION_BADGE_VARIANT[action] ?? "secondary"
}

export { Badge, badgeVariants, actionBadgeVariant }
