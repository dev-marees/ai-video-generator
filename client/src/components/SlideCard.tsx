import { Presentation } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Slide } from "@/types";

interface SlideCardProps {
  slide: Slide;
}

/** A single slide thumbnail card with title and index. */
export function SlideCard({ slide }: SlideCardProps) {
  return (
    <Card className="group overflow-hidden rounded-xl border-border/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-glow">
      <div className="relative aspect-video w-full overflow-hidden bg-muted/60">
        {slide.thumbnail_url ? (
          <img
            src={slide.thumbnail_url}
            alt={`Slide ${slide.index}: ${slide.title}`}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent-2/5">
            <Presentation className="size-8 text-muted-foreground/60" />
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-md bg-background/70 px-1.5 py-0.5 font-mono text-[11px] font-medium tabular-nums text-foreground/90 backdrop-blur">
          {String(slide.index).padStart(2, "0")}
        </span>
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-medium leading-snug">
          {slide.title}
        </p>
      </div>
    </Card>
  );
}
