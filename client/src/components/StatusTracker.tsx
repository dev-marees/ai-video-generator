import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getStatusMeta, isProcessingStatus } from "@/lib/status";
import type { JobStatus } from "@/types";

interface StatusTrackerProps {
  status: JobStatus;
  /** Optional progress override (0-100) from the backend. */
  progress?: number;
  /** Optional message, especially for failures. */
  message?: string;
}

/**
 * Compact status readout for the active job. The full stage sequence lives in
 * the hero PipelineRail, so this focuses on the current state and progress.
 */
export function StatusTracker({ status, progress, message }: StatusTrackerProps) {
  const meta = getStatusMeta(status);
  const isFailed = status === "failed";
  const active = isProcessingStatus(status);
  const progressValue = progress ?? meta.progress;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {active && <Loader2 className="size-4 animate-spin text-primary" />}
          <span className="text-sm font-medium">{meta.label}</span>
        </div>
        <Badge className={cn("border-transparent", meta.badgeClassName)}>
          {status === "completed" ? "Ready" : active ? "Working" : "Queued"}
        </Badge>
      </div>

      {isFailed ? (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{message ?? "Processing failed. Please try again."}</span>
        </div>
      ) : (
        <>
          <Progress value={progressValue} active={active} />
          <p className="text-sm text-muted-foreground">
            {message ?? meta.description}
          </p>
        </>
      )}
    </div>
  );
}
