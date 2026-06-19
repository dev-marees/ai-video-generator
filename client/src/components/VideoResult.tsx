import { Download, Loader2, Video } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorMessage } from "@/components/ErrorMessage";
import type { ResultResponse } from "@/types";

interface VideoResultProps {
  result: ResultResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}

function formatDuration(seconds?: number): string | null {
  if (seconds === undefined) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function VideoResult({
  result,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: VideoResultProps) {
  const duration = formatDuration(result?.duration_seconds);
  const downloadUrl = result?.download_url ?? result?.video_url;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Video className="size-5 text-primary" />
              Your Video
            </CardTitle>
            <CardDescription className="mt-1.5">
              {duration
                ? `Rendered video · ${duration}`
                : "Your narrated video is ready."}
            </CardDescription>
          </div>
          {downloadUrl && (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a href={downloadUrl} download>
                <Download className="size-4" />
                Download
              </a>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorMessage
            title="Couldn't load the video"
            message={errorMessage ?? "Failed to fetch the rendered video."}
            onRetry={onRetry}
          />
        ) : isLoading ? (
          <div className="space-y-3">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading your video…
            </div>
          </div>
        ) : result ? (
          <div className="overflow-hidden rounded-lg border bg-black">
            <video
              src={result.video_url}
              controls
              className="aspect-video w-full"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
