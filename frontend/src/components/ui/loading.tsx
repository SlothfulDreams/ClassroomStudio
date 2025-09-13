import * as React from "react"
import { cn } from "@/lib/utils"

interface LoadingProps {
  message?: string
  size?: "sm" | "md" | "lg"
  showCard?: boolean
  className?: string
}

function LoadingDots({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dotSize = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4"
  }[size]

  return (
    <div className="flex items-center gap-1">
      <div
        className={cn(
          "rounded-full bg-main animate-bounce",
          dotSize
        )}
        style={{ animationDelay: "0ms" }}
      />
      <div
        className={cn(
          "rounded-full bg-main animate-bounce",
          dotSize
        )}
        style={{ animationDelay: "150ms" }}
      />
      <div
        className={cn(
          "rounded-full bg-main animate-bounce",
          dotSize
        )}
        style={{ animationDelay: "300ms" }}
      />
    </div>
  )
}

function Loading({
  message = "Loading...",
  size = "md",
  showCard = false,
  className
}: LoadingProps) {
  const textSize = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  }[size]

  const content = (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <LoadingDots size={size} />
      <p className={cn("font-base text-foreground", textSize)}>
        {message}
      </p>
    </div>
  )

  if (showCard) {
    return (
      <div className="rounded-base border-2 border-border shadow-shadow bg-background p-8">
        {content}
      </div>
    )
  }

  return content
}

function LoadingPage({
  title = "Classroom Studio",
  message = "Loading...",
  className
}: {
  title?: string
  message?: string
  className?: string
}) {
  return (
    <main className={cn(
      "flex min-h-screen flex-col items-center justify-center p-24 bg-background",
      className
    )}>
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-heading text-foreground mb-6">
          {title}
        </h1>
        <Loading message={message} size="lg" showCard />
      </div>
    </main>
  )
}

export { Loading, LoadingDots, LoadingPage }