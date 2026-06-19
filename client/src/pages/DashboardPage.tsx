import { useCallback, useMemo, useState } from "react";
import {
  DashboardHeader,
  FileUpload,
  GenerateVideoPanel,
  MarkdownPreview,
  SlidePreviewPanel,
  VideoResult,
} from "@/components";
import {
  useGenerateVideo,
  useResult,
  useSlides,
  useStatus,
  useUpload,
} from "@/hooks";
import type { JobId } from "@/types";

export function DashboardPage() {
  const [jobId, setJobId] = useState<JobId | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const upload = useUpload();
  const statusQuery = useStatus(jobId);
  const generate = useGenerateVideo(jobId);

  const status = statusQuery.data?.status;
  const isCompleted = status === "completed";

  // The backend generates slides on demand at GET /slides, so we can fetch
  // them as soon as a job exists — no need to wait for video generation.
  const slidesQuery = useSlides(jobId, Boolean(jobId));
  const resultQuery = useResult(jobId, isCompleted);

  // Read the markdown locally and upload it to the backend.
  const handleUpload = useCallback(
    async (file: File) => {
      setFileName(file.name);
      try {
        const text = await file.text();
        setMarkdown(text);
      } catch {
        setMarkdown(null);
      }
      upload.mutate(file, {
        onSuccess: (data) => {
          setJobId(data.job_id);
        },
      });
    },
    [upload],
  );

  const handleGenerate = useCallback(() => {
    generate.mutate();
  }, [generate]);

  // Slides are "loading" while the on-demand generation request is in flight.
  const slidesLoading = Boolean(jobId) && slidesQuery.isLoading;

  const slidesIdle = !jobId;

  const isGenerating = generate.isPending;

  const uploadErrorMessage = upload.isError ? upload.error.message : undefined;

  const statusErrorMessage = useMemo(() => {
    if (statusQuery.isError) {
      return statusQuery.error.message;
    }
    return statusQuery.data?.message;
  }, [statusQuery.isError, statusQuery.error, statusQuery.data]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Convert Markdown to Video
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a markdown document, preview the generated slides, and
            render a narrated video.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left column: upload + generation controls */}
          <div className="space-y-6 lg:col-span-4">
            <FileUpload
              onUpload={handleUpload}
              isUploading={upload.isPending}
              progress={upload.progress}
              isUploaded={Boolean(jobId)}
            />

            {uploadErrorMessage && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {uploadErrorMessage}
              </div>
            )}

            <GenerateVideoPanel
              hasJob={Boolean(jobId)}
              status={status}
              progress={statusQuery.data?.progress}
              statusMessage={statusErrorMessage}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              generateError={
                generate.isError ? generate.error.message : undefined
              }
            />
          </div>

          {/* Right column: previews and result */}
          <div className="space-y-6 lg:col-span-8">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <MarkdownPreview content={markdown} fileName={fileName} />
              <SlidePreviewPanel
                slides={slidesQuery.data?.slides}
                isLoading={slidesLoading}
                isError={slidesQuery.isError}
                errorMessage={slidesQuery.error?.message}
                onRetry={() => void slidesQuery.refetch()}
                isIdle={slidesIdle}
              />
            </div>

            {isCompleted && (
              <VideoResult
                result={resultQuery.data}
                isLoading={resultQuery.isLoading}
                isError={resultQuery.isError}
                errorMessage={resultQuery.error?.message}
                onRetry={() => void resultQuery.refetch()}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
