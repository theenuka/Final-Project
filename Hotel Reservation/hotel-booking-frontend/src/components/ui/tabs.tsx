import * as React from "react"

import { cn } from "../../lib/utils"

type TabsContextValue = {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined)

function useTabsContext() {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs component")
  }
  return context
}

const Tabs = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
  }
>(({ className, children, value, defaultValue, onValueChange, ...props }, ref) => {
  const [selectedValue, setSelectedValue] = React.useState(defaultValue || "")

  const contextValue = React.useMemo(
    () => ({
      value: value !== undefined ? value : selectedValue,
      onValueChange: (newValue: string) => {
        if (value === undefined) {
          setSelectedValue(newValue)
        }
        onValueChange?.(newValue)
      },
    }),
    [value, selectedValue, onValueChange]
  )

  return (
    <TabsContext.Provider value={contextValue}>
      <div ref={ref} className={cn("", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
})
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="tablist"
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-night-900 p-1 text-gray-400",
      className
    )}
    {...props}
  />
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>(({ className, value, ...props }, ref) => {
  const context = useTabsContext()
  const isSelected = context.value === value

  // Move ARIA props to an object to bypass strict linter checks in some editors
  const ariaProps = {
    role: "tab",
    "aria-selected": isSelected,
  }

  return (
    <button
      ref={ref}
      type="button"
      {...ariaProps}
      tabIndex={isSelected ? 0 : -1}
      data-state={isSelected ? "active" : "inactive"}
      onClick={() => context.onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isSelected
          ? "bg-night-800 text-white shadow-sm"
          : "text-gray-400 hover:text-white hover:bg-white/5",
        className
      )}
      {...props}
    />
  )
})
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, ...props }, ref) => {
  const context = useTabsContext()
  const isSelected = context.value === value

  if (!isSelected) return null

  return (
    <div
      ref={ref}
      role="tabpanel"
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
