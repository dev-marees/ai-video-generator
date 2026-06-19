import { FileVideo } from "lucide-react";

/** Top navigation bar for the dashboard. */
export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileVideo className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">
              Universal File Converter
            </p>
            <p className="text-xs text-muted-foreground">
              Markdown → Narrated Video
            </p>
          </div>
        </div>
        <span className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          POC
        </span>
      </div>
    </header>
  );
}
