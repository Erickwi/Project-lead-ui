import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

function Switch({ className, checked, onCheckedChange, ref, ...props }) {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        "relative inline-flex h-6 w-10 flex-shrink-0 box-border align-middle cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-0 sm:focus-visible:ring-2 sm:focus-visible:ring-ring/60 no-min-size",
        checked ? "bg-blue-400" : "bg-zinc-700",
        className,
      )}
      checked={checked}
      onCheckedChange={onCheckedChange}
      {...props}>
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform",
          checked ? "translate-x-4" : "translate-x-0",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
