import { useCallback, useMemo, useState } from "react";
import {
  DashboardHeader,
  FileUpload,
  GenerateVideoPanel,
  MarkdownPreview,
  PipelineRail,
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

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero: the thesis is the transformation pipeline itself. */}
        <section className="mb-10 animate-fade-up">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary/80">
            Markdown in · narrated video out
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
            Turn a document into a{" "}
            <span className="text-gradient">narrated video</span>.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">
            Drop in a Markdown file. We split it into slides, narrate each one,
            and render the whole thing to MP4 — watch it move through the
            pipeline below.
          </p>

          <div className="surface-glass mt-8 rounded-2xl px-5 py-6 sm:px-8">
            <PipelineRail status={status} />
          </div>
        </section>

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
