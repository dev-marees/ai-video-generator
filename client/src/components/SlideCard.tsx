import { Presentation } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Slide } from "@/types";

interface SlideCardProps {
  slide: Slide;
}

/** A single slide thumbnail card with title and index. */
export function SlideCard({ slide }: SlideCardProps) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {slide.thumbnail_url ? (
          <img
            src={slide.thumbnail_url}
            alt={`Slide ${slide.index}: ${slide.title}`}
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-muted to-muted/40">
            <Presentation className="size-8 text-muted-foreground/60" />
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-md bg-background/80 px-1.5 py-0.5 text-xs font-medium tabular-nums backdrop-blur">
          {slide.index}
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
