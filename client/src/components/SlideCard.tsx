import { Presentation, Volume2, Play, Pause } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { converterApi } from "@/api/converter";
import type { Slide } from "@/types";

interface SlideCardProps {
  slide: Slide;
  jobId: string | null;
}

/** A single slide thumbnail card with title, index, and audio preview. */
export function SlideCard({ slide, jobId }: SlideCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const audioUrl = jobId ? converterApi.getAudioUrl(jobId, slide.index) : null;

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

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
        
        {/* Slide Number */}
        <span className="absolute left-2 top-2 rounded-md bg-background/70 px-1.5 py-0.5 font-mono text-[11px] font-medium tabular-nums text-foreground/90 backdrop-blur">
          {String(slide.index).padStart(2, "0")}
        </span>

        {/* Audio Preview Overlay */}
        {audioUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              size="icon"
              variant="secondary"
              className="size-10 rounded-full shadow-lg"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="size-5 fill-current" />
              ) : (
                <Play className="size-5 fill-current ml-0.5" />
              )}
            </Button>
            <audio ref={audioRef} src={audioUrl} />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between p-3">
        <p className="line-clamp-2 text-sm font-medium leading-snug flex-1">
          {slide.title}
        </p>
        {audioUrl && (
          <Volume2 className={`size-3.5 ml-2 transition-colors ${isPlaying ? 'text-primary animate-pulse' : 'text-muted-foreground/40'}`} />
        )}
      </div>
    </Card>
  );
}
