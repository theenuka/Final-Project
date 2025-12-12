import * as React from "react"

import { cn } from "../../lib/utils"

interface SwitchProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  id?: string
  name?: string
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, disabled, id, name }, ref) => {
    // Move ARIA props to an object to bypass strict linter checks in some editors
    const ariaProps = {
      role: "switch",
      "aria-checked": checked,
    }

    return (
      <button
        ref={ref}
        type="button"
        {...ariaProps}
        id={id}
        data-state={checked ? "checked" : "unchecked"}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-brand-500" : "bg-gray-600",
          className
        )}
      >
        <span
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
        {name && (
          <input
            type="hidden"
            name={name}
            value={checked ? "true" : "false"}
          />
        )}
      </button>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
