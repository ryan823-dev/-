import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fresh-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-fresh-600 text-white shadow-[0_20px_40px_-10px_rgba(22,163,74,0.35)] hover:bg-fresh-700 hover:shadow-[0_25px_50px_-12px_rgba(22,163,74,0.4)] hover:-translate-y-0.5 active:scale-[0.98]",
        destructive:
          "bg-red-600 text-white shadow-md hover:bg-red-700 hover:-translate-y-0.5 active:scale-[0.98]",
        outline:
          "border-2 border-fresh-600 bg-transparent text-fresh-600 hover:bg-fresh-50 hover:-translate-y-0.5 active:scale-[0.98]",
        secondary:
          "bg-eco-600 text-white shadow-md hover:bg-eco-700 hover:-translate-y-0.5 active:scale-[0.98]",
        ghost:
          "text-fresh-600 hover:bg-fresh-50 hover:text-fresh-700",
        link:
          "text-fresh-600 underline-offset-4 hover:underline",
        warm:
          "bg-warm-500 text-white shadow-md hover:bg-warm-600 hover:-translate-y-0.5 active:scale-[0.98]",
        gradient:
          "bg-gradient-to-r from-fresh-600 via-eco-500 to-cyan-500 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] bg-[length:200%_100%] hover:bg-[position:100%_0]",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2 text-xs",
        lg: "h-14 px-8 py-4 text-base",
        xl: "h-16 px-10 py-5 text-lg",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
