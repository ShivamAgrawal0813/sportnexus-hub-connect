import { useTheme } from "next-themes"
import { Toaster as SonnerOriginal, toast, ToasterProps as SonnerToasterProps } from "sonner"
import { useEffect, useState, forwardRef } from "react"

// Create a forwardRef wrapper to prevent render phase updates
const SafeSonner = forwardRef<HTMLDivElement, SonnerToasterProps>((props, ref) => {
  return <SonnerOriginal ref={ref} {...props} />
})
SafeSonner.displayName = "SafeSonner"

type ToasterProps = React.ComponentProps<typeof SonnerOriginal>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system", resolvedTheme } = useTheme()
  const [isMounted, setIsMounted] = useState(false)

  // Use useEffect to defer rendering until after mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Early return null during SSR/first render to prevent hydration issues
  if (!isMounted) {
    return null
  }

  // Use resolved theme if available (prevents state updates during render)
  const currentTheme = resolvedTheme || theme

  return (
    <SafeSonner
      theme={currentTheme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
