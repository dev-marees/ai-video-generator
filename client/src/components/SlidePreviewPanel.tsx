import { LayoutGrid } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { ErrorMessage } from "@/components/ErrorMessage";
import { SlideCard } from "@/components/SlideCard";
import type { Slide } from "@/types";

interface SlidePreviewPanelProps {
  slides: Slide[] | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  /** True before slides are expected to be available. */
  isIdle: boolean;
  jobId: string | null;
}

function SlidesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function SlidePreviewPanel({
  slides,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  isIdle,
  jobId,
}: SlidePreviewPanelProps) {
  const slideCount = slides?.length ?? 0;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="size-5 text-primary" />
            Slide Previews
          </CardTitle>
          {slideCount > 0 && (
            <Badge variant="secondary">{slideCount} slides</Badge>
          )}
        </div>
        <CardDescription>
          Generated from your markdown headings.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {isIdle ? (
          <EmptyState
            icon={LayoutGrid}
            title="No slides yet"
            description="Slides appear here once your document has been processed."
          />
        ) : isError ? (
          <ErrorMessage
            title="Couldn't load slides"
            message={errorMessage ?? "Failed to fetch slide previews."}
            onRetry={onRetry}
          />
        ) : isLoading ? (
          <SlidesSkeleton />
        ) : slideCount === 0 ? (
          <EmptyState
            icon={LayoutGrid}
            title="No slides found"
            description="We couldn't derive any slides from this document's headings."
          />
        ) : (
          <div className="max-h-[32rem] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {slides?.map((slide) => (
                <SlideCard key={slide.id} slide={slide} jobId={jobId} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
