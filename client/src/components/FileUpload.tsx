import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { FileText, Loader2, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FileUploadProps {
  /** Called when the user confirms a file and triggers the upload. */
  onUpload: (file: File) => void;
  /** Whether an upload is currently in flight. */
  isUploading: boolean;
  /** Upload progress 0-100, shown while uploading. */
  progress: number;
  /** Whether a job has already been created from this file. */
  isUploaded: boolean;
}

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({
  onUpload,
  isUploading,
  progress,
  isUploaded,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      setLocalError(null);
      if (rejections.length > 0) {
        const reason = rejections[0]?.errors[0]?.code;
        setLocalError(
          reason === "file-too-large"
            ? "File is too large. Maximum size is 10 MB."
            : "Only Markdown (.md) files are accepted.",
        );
        return;
      }
      const file = accepted[0];
      if (file) {
        setSelectedFile(file);
      }
    },
    [],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "text/markdown": [".md", ".markdown"],
    },
    maxSize: MAX_SIZE_BYTES,
    maxFiles: 1,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    disabled: isUploading,
  });

  const handleClear = () => {
    setSelectedFile(null);
    setLocalError(null);
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UploadCloud className="size-5 text-primary" />
          Upload Markdown
        </CardTitle>
        <CardDescription>
          Drag &amp; drop a <code className="text-foreground">.md</code> file,
          or browse to select one.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50",
            isUploading && "pointer-events-none opacity-60",
          )}
        >
          <input {...getInputProps()} aria-label="Markdown file input" />
          <UploadCloud
            className={cn(
              "mb-3 size-10",
              isDragActive ? "text-primary" : "text-muted-foreground",
            )}
          />
          <p className="text-sm font-medium">
            {isDragActive
              ? "Drop your markdown file here"
              : "Drag & drop your markdown file"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            .md or .markdown · up to 10 MB
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={open}
            disabled={isUploading}
          >
            Browse files
          </Button>
        </div>

        {localError && (
          <p className="text-sm font-medium text-destructive">{localError}</p>
        )}

        {selectedFile && (
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <FileText className="size-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(selectedFile.size)}
              </p>
            </div>
            {!isUploading && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClear}
                aria-label="Remove selected file"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        )}

        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Loader2 className="size-3.5 animate-spin" />
                Uploading…
              </span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {selectedFile && !isUploading && (
          <Button
            type="button"
            className="w-full"
            onClick={handleUpload}
            disabled={isUploaded}
          >
            {isUploaded ? "Uploaded" : "Upload file"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
