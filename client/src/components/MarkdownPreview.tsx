import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";

interface MarkdownPreviewProps {
  /** Raw markdown content read from the uploaded file. */
  content: string | null;
  /** Name of the uploaded file, shown in the header. */
  fileName: string | null;
}

export function MarkdownPreview({ content, fileName }: MarkdownPreviewProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-5 text-primary" />
          Markdown Preview
        </CardTitle>
        <CardDescription>
          {fileName ? fileName : "Rendered preview of your document."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {content ? (
          <div className="markdown-body h-full max-h-[32rem] overflow-y-auto pr-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No document yet"
            description="Upload a markdown file to see its rendered preview here."
          />
        )}
      </CardContent>
    </Card>
  );
}
