"use client";

import * as React from "react";
import { Dialog as DrawerPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

const Drawer = React.forwardRef(function Drawer(props, ref) {
  return <DrawerPrimitive.Root ref={ref} data-slot="drawer" {...props} />;
});

const DrawerTrigger = React.forwardRef(function DrawerTrigger(props, ref) {
  return <DrawerPrimitive.Trigger ref={ref} data-slot="drawer-trigger" {...props} />;
});

const DrawerClose = React.forwardRef(function DrawerClose(props, ref) {
  return <DrawerPrimitive.Close ref={ref} data-slot="drawer-close" {...props} />;
});

const DrawerPortal = React.forwardRef(function DrawerPortal(props, ref) {
  return <DrawerPrimitive.Portal ref={ref} data-slot="drawer-portal" {...props} />;
});

const DrawerOverlay = React.forwardRef(function DrawerOverlay({ className, ...props }, ref) {
  return (
    <DrawerPrimitive.Overlay
      ref={ref}
      data-slot="drawer-overlay"
      className={cn(
        // prevent intercepting pointer events when closed; allow when open
        "fixed inset-0 z-40 bg-black/20 pointer-events-none data-[state=open]:pointer-events-auto data-open:animate-in data-open:fade-in-0",
        className,
      )}
      {...props}
    />
  );
});

const DrawerContent = React.forwardRef(function DrawerContent(
  { className, children, side = "right", showCloseButton = true, ...props },
  ref,
) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        data-slot="drawer-content"
        data-side={side}
        className={cn(
          "fixed top-0 z-50 h-full right-0 bg-popover text-popover-foreground shadow-lg duration-200 ease-in-out w-full sm:max-w-[420px] overflow-hidden",
          className,
        )}
        {...props}>
        <div className="flex h-full flex-col">
          <style>{`[data-slot="drawer-content"] * { max-width: 100% !important; box-sizing: border-box; word-break: break-word; }
            [data-slot="drawer-content"] *[style] { display: block !important; min-width: 0 !important; }
          `}</style>
          <div className="overflow-y-auto px-4 py-3">
            <div className="w-full max-w-full box-border break-words whitespace-normal">{children}</div>
          </div>
          {showCloseButton && (
            <div className="p-4">
              <DrawerPrimitive.Close data-slot="drawer-close" asChild>
                <Button variant="ghost" className="w-full" size="sm">
                  Cerrar
                </Button>
              </DrawerPrimitive.Close>
            </div>
          )}
        </div>
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
});

function DrawerHeader({ className, ...props }) {
  return <div data-slot="drawer-header" className={cn("flex flex-col gap-0.5 p-4", className)} {...props} />;
}

function DrawerFooter({ className, ...props }) {
  return <div data-slot="drawer-footer" className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />;
}

const DrawerTitle = React.forwardRef(function DrawerTitle(props, ref) {
  const { className, ...rest } = props;
  return (
    <DrawerPrimitive.Title
      ref={ref}
      data-slot="drawer-title"
      className={cn("font-heading text-base font-medium text-foreground", className)}
      {...rest}
    />
  );
});

const DrawerDescription = React.forwardRef(function DrawerDescription(props, ref) {
  const { className, ...rest } = props;
  return (
    <DrawerPrimitive.Description
      ref={ref}
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...rest}
    />
  );
});

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerPortal,
  DrawerOverlay,
};
