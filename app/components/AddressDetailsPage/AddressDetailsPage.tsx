"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ArrowLeft,
  Loader2,
  ChevronDown,
  Eye,
  Send,
  Images,
  LayoutGrid,
  List,
  Check,
} from "lucide-react";
import api from "@/app/lib/apiClient";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Revision {
  revisionId: number;
  imageId: number;
  revisionNumber: number;
  status: string;
  clientNotes: string | null;
  resultKey: string | null;
  createdAt: string;
}

interface Job {
  id: string;
  type: string;
  status: string;
  resultKey: string | null;
  error: string | null;
}

interface ImageItem {
  id: number;
  status: string;
  originalKey: string | null;
  editedKey: string | null;
  deliveredKey: string | null;
  originalFilename: string;
  sortOrder: number;
  createdAt: string;
  job: Job | null;
  revisions: Revision[];
}

interface Order {
  id: number;
  address: string;
  propertyType: string;
  status: string;
  imageCount: number;
  totalCost: string;
  paidAt: string | null;
  createdAt: string;
}

// ── Slider ────────────────────────────────────────────────────────────────────

function SliderComparison({
  originalUrl,
  resultUrl,
  originalLabel = "Original",
  resultLabel = "Edited",
}: {
  originalUrl: string;
  resultUrl: string;
  originalLabel?: string;
  resultLabel?: string;
}) {
  const [sliderPos, setSliderPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateSlider = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setSliderPos(
      Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)),
    );
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const mm = (e: MouseEvent) => updateSlider(e.clientX);
    const mu = () => setDragging(false);
    const tm = (e: TouchEvent) => updateSlider(e.touches[0].clientX);
    const tu = () => setDragging(false);
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
    window.addEventListener("touchmove", tm);
    window.addEventListener("touchend", tu);
    return () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", mu);
      window.removeEventListener("touchmove", tm);
      window.removeEventListener("touchend", tu);
    };
  }, [dragging, updateSlider]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-4/3 overflow-hidden select-none"
      style={{ cursor: dragging ? "ew-resize" : "col-resize" }}
      onMouseDown={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onTouchStart={() => setDragging(true)}
    >
      <img
        src={resultUrl}
        alt={resultLabel}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      <img
        src={originalUrl}
        alt={originalLabel}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      />
      <div
        className="absolute top-0 bottom-0 w-px bg-white/70 pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      >
        <ChevronLeft size={12} className="text-gray-700" />
        <ChevronRight size={12} className="text-gray-700" />
      </div>
      <span className="absolute bottom-3 left-3 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gray-900/70 backdrop-blur-sm text-white pointer-events-none">
        {originalLabel}
      </span>
      <span className="absolute bottom-3 right-3 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gray-900/70 backdrop-blur-sm text-white pointer-events-none">
        {resultLabel}
      </span>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    completed: "bg-green-50 text-green-600 border-green-100",
    edited: "bg-green-50 text-green-600 border-green-100",
    delivered: "bg-green-50 text-green-600 border-green-100",
    processing: "bg-blue-50 text-blue-600 border-blue-100",
    enhancing: "bg-blue-50 text-blue-600 border-blue-100",
    straightening: "bg-blue-50 text-blue-600 border-blue-100",
    pending: "bg-amber-50 text-amber-600 border-amber-100",
    uploaded: "bg-amber-50 text-amber-600 border-amber-100",
    failed: "bg-red-50 text-red-500 border-red-100",
  };
  const cls = map[status] ?? "bg-gray-50 text-gray-500 border-gray-100";
  return (
    <span
      className={`text-[12px] font-medium px-3 py-1 rounded-full border capitalize ${cls}`}
    >
      {status === "edited" ? "Completed" : status}
    </span>
  );
};

// ── Selectable version thumbnail ──────────────────────────────────────────────

function VersionThumb({
  url,
  label,
  selected,
  onClick,
}: {
  url: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative shrink-0 w-36 rounded-xl overflow-hidden border-2 transition-all ${
        selected
          ? "border-gray-900 shadow-md"
          : "border-gray-200 hover:border-gray-400"
      }`}
    >
      <img src={url} alt={label} className="w-full aspect-4/3 object-cover" />
      <div className="px-2 py-1.5 bg-white flex items-center justify-between gap-1">
        <span className="text-[11px] font-medium text-gray-700 truncate">
          {label}
        </span>
        {selected && (
          <span className="w-4 h-4 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
            <Check size={9} className="text-white" />
          </span>
        )}
      </div>
    </button>
  );
}

// ── Image Card ────────────────────────────────────────────────────────────────

function ImageCard({
  image,
  index,
  onRevisionSubmit,
  submittingId,
}: {
  image: ImageItem;
  index: number;
  onRevisionSubmit: (
    imageId: number,
    prompt: string,
    sourceUrl: string,
  ) => void;
  submittingId: number | null;
}) {
  const originalUrl = image.originalKey ?? "";
  const editedUrl = image.editedKey ?? image.job?.resultKey ?? "";
  const hasResult = !!editedUrl;
  const jobStatus = image.job?.status ?? image.status;

  const completedRevisions = image.revisions.filter((r) => r.resultKey);
  const hasRevisions = completedRevisions.length > 0;

  // Build version list for revision selector: edited + all completed revisions
  const versions = hasResult
    ? [
        { key: "edited", label: "Edited", url: editedUrl },
        ...completedRevisions.map((r) => ({
          key: `rev-${r.revisionId}`,
          label: `Revision ${r.revisionNumber}`,
          url: r.resultKey!,
        })),
      ]
    : [];

  // Default selected = last version
  const [selectedVersionKey, setSelectedVersionKey] = useState<string>(
    versions.length > 0 ? versions[versions.length - 1].key : "edited",
  );
  const [revisionsOpen, setRevisionsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");

  // Keep selected version pointing to the latest when new revisions arrive
  useEffect(() => {
    if (versions.length > 0) {
      setSelectedVersionKey(versions[versions.length - 1].key);
    }
  }, [image.revisions.length]);

  const selectedVersion =
    versions.find((v) => v.key === selectedVersionKey) ??
    versions[versions.length - 1];
  const nextRevNumber = image.revisions.length + 1;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* ── Main slider ──────────────────────────────────────────────── */}
      {hasResult ? (
        <SliderComparison originalUrl={originalUrl} resultUrl={editedUrl} />
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

      {/* ── Info row ─────────────────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[15px] font-bold text-gray-900 shrink-0">
            Photo {index + 1}
          </span>
          <span className="text-[12px] text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full truncate">
            {image.originalFilename.replace(/\.[^/.]+$/, "")}
          </span>
        </div>
        <StatusBadge status={jobStatus} />
      </div>

      {/* ── Download row ─────────────────────────────────────────────── */}
      {hasResult && (
        <div className="px-4 pb-2 grid grid-cols-2 gap-2">
          <button
            onClick={() => window.open(originalUrl, "_blank")}
            className="h-10 rounded-xl border border-gray-200 text-[13px] text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <Download size={13} /> Original
          </button>
          <button
            onClick={() => window.open(editedUrl, "_blank")}
            className="h-10 rounded-xl border border-gray-200 text-[13px] text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <Download size={13} /> Edited
          </button>
        </div>
      )}

      {/* ── All Revisions section — only shows if revisions exist ─────── */}
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

          {/* Horizontal scrollable revision thumbnails */}
          {revisionsOpen && (
            <div className="mt-3 space-y-3">
              <p className="text-[11px] text-gray-400 font-medium">
                Select a version to revise from:
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                {versions.map((v) => (
                  <VersionThumb
                    key={v.key}
                    url={v.url}
                    label={v.label}
                    selected={selectedVersionKey === v.key}
                    onClick={() => setSelectedVersionKey(v.key)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Revision prompt — only if image has a result ─────────────── */}
      {hasResult && (
        <div className="px-4 pb-4 space-y-2">
          {/* Show which version will be used as base */}
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
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
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
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const OrderDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.id);

  const [order, setOrder] = useState<Order | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [view, setView] = useState<"grid" | "list">("list");

  useEffect(() => {
    api
      .get(`/api/library/${orderId}`)
      .then(({ data }) => {
        setOrder(data.order);
        setImages(data.images);
      })
      .catch(() => setError("Failed to load order"))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleRevisionSubmit = async (
    imageId: number,
    prompt: string,
    sourceUrl: string,
  ) => {
    setSubmittingId(imageId);
    try {
      await api.post(`/api/orders/${orderId}/revisions`, {
        imageIds: [imageId],
        prompt,
        sourceUrl,
      });
      const { data } = await api.get(`/api/library/${orderId}`);
      setImages(data.images);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to submit revision");
    } finally {
      setSubmittingId(null);
    }
  };

  const Header = () => (
    <div className="sticky top-16 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-4">
      <div className="max-w-2xl mx-auto flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-colors"
        >
          <ArrowLeft size={15} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-gray-900 truncate">
            {order?.address ?? "Property"}
          </p>
          <p className="text-[11px] text-gray-400">
            {order?.propertyType} · {images.length} image
            {images.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl p-1">
          <button
            onClick={() => setView("list")}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${view === "list" ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-600"}`}
          >
            <List size={13} />
          </button>
          <button
            onClick={() => setView("grid")}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${view === "grid" ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-600"}`}
          >
            <LayoutGrid size={13} />
          </button>
        </div>
      </div>
    </div>
  );

  if (loading)
    return (
      <div className="min-h-screen bg-white pt-16">
        <div className="sticky top-16 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-4">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500"
            >
              <ArrowLeft size={15} />
            </button>
            <div className="h-4 w-48 bg-gray-100 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-white pt-16">
        <div className="sticky top-16 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-4">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={15} />
            </button>
            <p className="text-[14px] font-semibold text-gray-900">Error</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <p className="text-[14px] text-gray-400">{error}</p>
          <button
            onClick={() => router.back()}
            className="text-[13px] text-gray-500 underline underline-offset-2"
          >
            Go back
          </button>
        </div>
      </div>
    );

  if (images.length === 0)
    return (
      <div className="min-h-screen bg-[#f8f9fb] pt-16">
        <Header />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center">
            <Images className="w-6 h-6 text-gray-300" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-[15px] font-semibold text-gray-700">
              No images yet
            </p>
            <p className="text-[13px] text-gray-400">
              Images will appear here once processing begins
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="mt-2 flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={13} /> Back to Library
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f8f9fb] pt-16 pb-10">
      <Header />
      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div
          className={view === "grid" ? "grid grid-cols-2 gap-4" : "space-y-4"}
        >
          {images.map((img, i) => (
            <ImageCard
              key={img.id}
              image={img}
              index={i}
              onRevisionSubmit={handleRevisionSubmit}
              submittingId={submittingId}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
