import { Fragment } from "react";
import {
  AudioLines,
  Check,
  Clapperboard,
  LayoutGrid,
  Loader2,
  TriangleAlert,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { JobStatus } from "@/types";

interface Stage {
  label: string;
  caption: string;
  icon: LucideIcon;
}

const STAGES: Stage[] = [
  { label: "Upload", caption: "Markdown in", icon: UploadCloud },
  { label: "Slides", caption: "Sections rendered", icon: LayoutGrid },
  { label: "Narrate", caption: "Voice synthesized", icon: AudioLines },
  { label: "Render", caption: "Video out", icon: Clapperboard },
];

type StageState = "done" | "active" | "pending" | "failed";

/** Map a job status to how far the pipeline has progressed. */
function resolveProgress(status: JobStatus | undefined): {
  completedThrough: number; // index of last completed stage (-1 = none)
  activeIndex: number; // index of in-progress stage (-1 = none)
  failed: boolean;
} {
  switch (status) {
    case "uploaded":
      return { completedThrough: 0, activeIndex: -1, failed: false };
    case "generating_slides":
      return { completedThrough: 0, activeIndex: 1, failed: false };
    case "generating_audio":
      return { completedThrough: 1, activeIndex: 2, failed: false };
    case "rendering_video":
      return { completedThrough: 2, activeIndex: 3, failed: false };
    case "completed":
      return { completedThrough: 3, activeIndex: -1, failed: false };
    case "failed":
      return { completedThrough: 0, activeIndex: -1, failed: true };
    default:
      return { completedThrough: -1, activeIndex: -1, failed: false };
  }
}

function stageStateFor(
  index: number,
  completedThrough: number,
  activeIndex: number,
  failed: boolean,
): StageState {
  if (failed && index > completedThrough) return "failed";
  if (index <= completedThrough) return "done";
  if (index === activeIndex) return "active";
  return "pending";
}

interface PipelineRailProps {
  status: JobStatus | undefined;
}

/** Horizontal, glanceable view of the whole conversion pipeline. */
export function PipelineRail({ status }: PipelineRailProps) {
  const { completedThrough, activeIndex, failed } = resolveProgress(status);

  return (
    <ol className="flex items-start">
      {STAGES.map((stage, index) => {
        const state = stageStateFor(
          index,
          completedThrough,
          activeIndex,
          failed,
        );
        const Icon = stage.icon;
        const connectorLit = index <= completedThrough;

        return (
          <Fragment key={stage.label}>
            <li className="flex w-20 shrink-0 flex-col items-center text-center sm:w-28">
              <span
                className={cn(
                  "relative flex size-11 items-center justify-center rounded-2xl border transition-colors",
                  state === "done" &&
                    "border-transparent bg-gradient-accent text-white",
                  state === "active" &&
                    "border-primary/60 bg-primary/10 text-primary shadow-glow",
                  state === "pending" &&
                    "border-border bg-card/40 text-muted-foreground/60",
                  state === "failed" &&
                    "border-destructive/50 bg-destructive/10 text-destructive",
                )}
              >
                {state === "active" && (
                  <span className="absolute inset-0 animate-pulse-glow rounded-2xl ring-1 ring-primary/40" />
                )}
                {state === "done" ? (
                  <Check className="size-5" strokeWidth={2.5} />
                ) : state === "active" ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : state === "failed" ? (
                  <TriangleAlert className="size-5" />
                ) : (
                  <Icon className="size-5" />
                )}
              </span>
              <span
                className={cn(
                  "mt-2.5 font-display text-sm font-semibold tracking-tight",
                  state === "pending"
                    ? "text-muted-foreground/70"
                    : "text-foreground",
                )}
              >
                {stage.label}
              </span>
              <span className="mt-0.5 hidden text-[11px] text-muted-foreground sm:block">
                {stage.caption}
              </span>
            </li>

            {index < STAGES.length - 1 && (
              <li
                aria-hidden
                className="mt-[22px] h-0.5 flex-1 overflow-hidden rounded-full bg-border"
              >
                <span
                  className={cn(
                    "block h-full origin-left transition-transform duration-500",
                    connectorLit
                      ? "bg-gradient-accent scale-x-100"
                      : "scale-x-0",
                  )}
                />
              </li>
            )}
          </Fragment>
        );
      })}
    </ol>
  );
}
