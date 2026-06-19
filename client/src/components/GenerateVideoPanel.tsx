import { Clapperboard, Loader2, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorMessage } from "@/components/ErrorMessage";
import { StatusTracker } from "@/components/StatusTracker";
import type { JobStatus } from "@/types";

interface GenerateVideoPanelProps {
  /** Whether a job exists (file uploaded). */
  hasJob: boolean;
  /** Current job status, if known. */
  status?: JobStatus;
  /** Backend-reported progress (0-100). */
  progress?: number;
  /** Status / failure message. */
  statusMessage?: string;
  /** Trigger video generation. */
  onGenerate: () => void;
  /** True while the generate request is in flight or the job is processing. */
  isGenerating: boolean;
  /** Error from the generate mutation, if any. */
  generateError?: string;
}

export function GenerateVideoPanel({
  hasJob,
  status,
  progress,
  statusMessage,
  onGenerate,
  isGenerating,
  generateError,
}: GenerateVideoPanelProps) {
  const isProcessing =
    status === "generating_slides" ||
    status === "generating_audio" ||
    status === "rendering_video";
  const isCompleted = status === "completed";
  const buttonDisabled = !hasJob || isGenerating || isProcessing;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clapperboard className="size-5 text-primary" />
          Generate Video
        </CardTitle>
        <CardDescription>
          Turn your document into a narrated video.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasJob ? (
          <EmptyState
            icon={Clapperboard}
            title="Upload a file to begin"
            description="Once your markdown is uploaded you can generate a video."
          />
        ) : (
          <>
            <Button
              type="button"
              className="w-full"
              size="lg"
              onClick={onGenerate}
              disabled={buttonDisabled}
            >
              {isGenerating || isProcessing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Processing…
                </>
              ) : isCompleted ? (
                <>
                  <Sparkles className="size-4" />
                  Regenerate video
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Generate video
                </>
              )}
            </Button>

            {generateError && (
              <ErrorMessage
                title="Couldn't start generation"
                message={generateError}
              />
            )}

            {status && (
              <div className="rounded-lg border bg-muted/20 p-4">
                <StatusTracker
                  status={status}
                  progress={progress}
                  message={statusMessage}
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
