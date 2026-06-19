import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  getStatusMeta,
  STATUS_ORDER,
  isProcessingStatus,
} from "@/lib/status";
import type { JobStatus } from "@/types";

interface StatusTrackerProps {
  status: JobStatus;
  /** Optional progress override (0-100) from the backend. */
  progress?: number;
  /** Optional message, especially for failures. */
  message?: string;
}

/** Visualizes the conversion pipeline and the current job state. */
export function StatusTracker({ status, progress, message }: StatusTrackerProps) {
  const meta = getStatusMeta(status);
  const isFailed = status === "failed";
  const currentIndex = STATUS_ORDER.indexOf(status);
  const progressValue = progress ?? meta.progress;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isProcessingStatus(status) && (
            <Loader2 className="size-4 animate-spin text-primary" />
          )}
          <span className="text-sm font-medium">{meta.label}</span>
        </div>
        <Badge className={cn("border-transparent", meta.badgeClassName)}>
          {meta.label}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        {message ?? meta.description}
      </p>

      {isFailed ? (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{message ?? "Processing failed. Please try again."}</span>
        </div>
      ) : (
        <>
          <Progress value={progressValue} />
          <ol className="space-y-2">
            {STATUS_ORDER.map((step, index) => {
              const stepMeta = getStatusMeta(step);
              const isDone = index < currentIndex;
              const isCurrent = index === currentIndex;
              return (
                <li
                  key={step}
                  className={cn(
                    "flex items-center gap-2.5 text-sm",
                    isDone && "text-muted-foreground",
                    isCurrent && "font-medium text-foreground",
                    !isDone && !isCurrent && "text-muted-foreground/60",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                      isDone &&
                        "border-emerald-500/50 bg-emerald-500/15 text-emerald-500",
                      isCurrent && "border-primary bg-primary/15 text-primary",
                      !isDone &&
                        !isCurrent &&
                        "border-border text-muted-foreground/60",
                    )}
                  >
                    {isDone ? (
                      <Check className="size-3" />
                    ) : isCurrent && isProcessingStatus(step) ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  {stepMeta.label}
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}
