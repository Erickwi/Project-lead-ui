import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, autosize = false, ...props }) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!autosize) return;
    const el = ref.current;
    if (!el) return;
    const getMax = () => Math.round(window.innerHeight * 0.5); // 50vh limit for textarea

    const adjust = () => {
      el.style.height = "auto";
      const scrollH = el.scrollHeight;
      const maxH = getMax();
      const finalH = Math.min(scrollH, maxH);
      el.style.height = `${finalH}px`;
      el.style.overflowY = scrollH > maxH ? "auto" : "hidden";
    };

    // Ajustar inicialmente y al cambiar el valor controlado
    adjust();

    // Escuchar input y resize para ajuste
    el.addEventListener("input", adjust);
    window.addEventListener("resize", adjust);
    return () => {
      el.removeEventListener("input", adjust);
      window.removeEventListener("resize", adjust);
    };
  }, [props.value, autosize]);

  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
