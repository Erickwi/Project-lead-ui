"use client";

import * as React from "react";
import { Dialog as DrawerPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function Drawer(props) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />;
}

function DrawerTrigger(props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerClose(props) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerPortal(props) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerOverlay({ className, ...props }) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-40 bg-black/20 pointer-events-none data-[state=open]:pointer-events-auto data-open:animate-in data-open:fade-in-0",
        className,
      )}
      {...props}
    />
  );
}

function DrawerContent({ className, children, side = "right", showCloseButton = true, ...props }) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
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
}

function DrawerHeader({ className, ...props }) {
  return <div data-slot="drawer-header" className={cn("flex flex-col gap-0.5 p-4", className)} {...props} />;
}

function DrawerFooter({ className, ...props }) {
  return <div data-slot="drawer-footer" className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />;
}

function DrawerTitle({ className, ...props }) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("font-heading text-base font-medium text-foreground", className)}
      {...props}
    />
  );
}

function DrawerDescription({ className, ...props }) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

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