import * as React from "react"

import { cn } from "@/lib/utils"

interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  content: string
  children: React.ReactNode
}

function Tooltip({ content, children, className, ...props }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      {...props}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            "absolute z-50 px-3 py-1.5 text-sm text-popover-foreground bg-popover border rounded-md shadow-md whitespace-nowrap",
            "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
            className
          )}
        >
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="w-2 h-2 bg-popover border-r border-b transform rotate-45"></div>
          </div>
        </div>
      )}
    </div>
  )
}

export { Tooltip }

