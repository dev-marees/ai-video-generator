import { Sparkles } from "lucide-react";

/** Top navigation bar for the dashboard. */
export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-accent flex size-9 items-center justify-center rounded-xl text-white shadow-glow">
            <Sparkles className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold tracking-tight">
              Universal File Converter
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              md → video studio
            </p>
          </div>
        </div>
        <span className="rounded-full border border-border/70 bg-card/40 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          POC
        </span>
      </div>
    </header>
  );
}
