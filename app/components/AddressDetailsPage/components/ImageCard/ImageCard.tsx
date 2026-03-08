"use client";

import { useEffect, useState } from "react";
import { Loader2, Eye, Send, ChevronDown } from "lucide-react";
import { ImageItem, ImageVersion } from "@/app/types/revision.types";
import { SliderComparison } from "@/app/components/SliderComparison/SliderComparison";
import { StatusBadge } from "../StatusBadge/StatusBadge";
import { VersionThumb } from "../VersionThumb/VersionThumb";
import { ImagePreview } from "../ImagePreview/ImagePreview";

interface Props {
  image: ImageItem;
  index: number;
  onRevisionSubmit: (
    imageId: number,
    prompt: string,
    sourceUrl: string,
  ) => void;
  submittingId: number | null;
}

export function ImageCard({
  image,
  index,
  onRevisionSubmit,
  submittingId,
}: Props) {
  const originalUrl = image.originalKey ?? "";
  const editedUrl = image.editedKey ?? image.job?.resultKey ?? "";
  const hasResult = !!editedUrl;
  const jobStatus = image.job?.status ?? image.status;
  const completedRevisions = image.revisions.filter((r) => r.resultKey);
  const hasRevisions = completedRevisions.length > 0;

  const versions: ImageVersion[] = hasResult
    ? [
        { key: "edited", label: "Edited", url: editedUrl },
        ...completedRevisions.map((r) => ({
          key: `rev-${r.revisionId}`,
          label: `Revision ${r.revisionNumber}`,
          url: r.resultKey!,
        })),
      ]
    : [];

  const lastKey = versions.at(-1)?.key ?? "edited";
  const [selectedKey, setSelectedKey] = useState(lastKey);
  const [revisionsOpen, setRevisionsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  useEffect(() => {
    if (versions.length > 0) setSelectedKey(versions.at(-1)!.key);
  }, [image.revisions.length]);

  const selectedVersion =
    versions.find((v) => v.key === selectedKey) ?? versions.at(-1);
  const nextRevNumber = image.revisions.length + 1;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Slider or processing placeholder */}
      {hasResult ? (
        // <SliderComparison originalUrl={originalUrl} resultUrl={editedUrl} />
        <SliderComparison
          originalUrl={originalUrl}
          resultUrl={versions.at(-1)?.url ?? editedUrl}
        />
      ) : (
        <div className="relative w-full aspect-4/3 bg-gray-50 flex items-center justify-center overflow-hidden">
          {originalUrl && (
            <img
              src={originalUrl}
              alt="Original"
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />
          )}
          <div className="relative z-10 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            <span className="text-[11px] text-gray-400 tracking-wide capitalize">
              {jobStatus}
            </span>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[15px] font-bold text-gray-900 shrink-0">
            Photo {index + 1}
          </span>
          <span className="text-[12px] text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full truncate">
            {image.category && (
              <span className="ml-1 text-gray-500">{`${image.category}`}</span>
            )}
          </span>
        </div>
        <StatusBadge status={jobStatus} />
      </div>

      {/* Revisions accordion */}
      {hasRevisions && (
        <div className="px-4 pb-2">
          <button
            onClick={() => setRevisionsOpen((o) => !o)}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Eye size={14} />
            {revisionsOpen
              ? "Hide Revisions"
              : `All Revisions (${completedRevisions.length})`}
            <ChevronDown
              size={13}
              className={`transition-transform duration-200 ${revisionsOpen ? "rotate-180" : ""}`}
            />
          </button>
          {revisionsOpen && (
            <div className="mt-3 space-y-2">
              <p className="text-[11px] text-gray-400 font-medium">
                Select a version to revise from:
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {versions.map((v) => (
                  <VersionThumb
                    key={v.key}
                    url={v.url}
                    label={v.label}
                    selected={selectedKey === v.key}
                    onClick={() => setSelectedKey(v.key)}
                    onPreview={() => setPreviewKey(v.key)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Revision prompt */}
      {hasResult && (
        <div className="px-4 pb-4 space-y-2">
          {selectedVersion && (
            <p className="text-[11px] text-gray-400">
              Creating Revision {nextRevNumber} from{" "}
              <span className="font-medium text-gray-600">
                {selectedVersion.label}
              </span>
            </p>
          )}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Add revision for this image..."
            rows={3}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[16px] text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
          />
          <div className="flex justify-end">
            <button
              onClick={() => {
                if (prompt.trim() && selectedVersion) {
                  onRevisionSubmit(image.id, prompt, selectedVersion.url);
                  setPrompt("");
                }
              }}
              disabled={!prompt.trim() || submittingId === image.id}
              className="flex items-center gap-2 h-11 px-5 bg-gray-900 hover:bg-gray-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white text-[13px] font-medium rounded-xl transition-colors"
            >
              {submittingId === image.id ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Sending…
                </>
              ) : (
                <>
                  <Send size={14} /> Submit Revision
                </>
              )}
            </button>
          </div>
        </div>
      )}
      {previewKey && (
        <ImagePreview
          versions={versions}
          activeKey={previewKey}
          onClose={() => setPreviewKey(null)}
          onNavigate={setPreviewKey}
        />
      )}
    </div>
  );
}
