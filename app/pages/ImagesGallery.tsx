"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchGallery, GalleryItem, GalleryResponse } from "@/app/lib/api";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ImagesGallery() {
  const [gallery, setGallery] = useState<GalleryResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGallery(p, 9);
      setGallery(data);
      setPage(p);
    } catch {
      setError("Failed to load gallery");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  return (
    <div className="min-h-screen bg-[#080808] text-white font-sans">
      {/* ── Top bar ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <button
          onClick={() => router.push("/")}
          className="cursor-pointer flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors group"
        >
          <ArrowLeft
            size={15}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
          Back
        </button>

        <h1 className="font-playfair text-lg font-medium text-white/80 tracking-wide">
          Gallery
        </h1>

        <div className="text-xs text-white/20">
          {gallery ? `${gallery.pagination.total} results` : ""}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      <div className="px-8 py-10">
        {loading && (
          <div className="flex items-center justify-center py-40">
            <Loader2 size={24} className="text-white/20 animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center justify-center py-40">
            <p className="text-red-400/50 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && gallery?.data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40 gap-3">
            <p className="font-playfair text-2xl text-white/20">
              No results yet
            </p>
            <p className="text-xs text-white/15">
              Enhanced images will appear here
            </p>
          </div>
        )}

        {!loading && !error && gallery && gallery.data.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {gallery.data.map((item, i) => (
                <GalleryCard key={item.id} item={item} index={i} />
              ))}
            </div>

            {/* ── Pagination ───────────────────────────────── */}
            {gallery.pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-14">
                <button
                  onClick={() => load(page - 1)}
                  disabled={!gallery.pagination.hasPrev}
                  className="cursor-pointer flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border border-white/8 text-white/35 hover:border-white/20 hover:text-white/60 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={14} /> Prev
                </button>

                <div className="flex items-center gap-1.5">
                  {Array.from(
                    { length: gallery.pagination.totalPages },
                    (_, i) => i + 1,
                  )
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === gallery.pagination.totalPages ||
                        Math.abs(p - page) <= 1,
                    )
                    .reduce((acc: (number | string)[], p, idx, arr) => {
                      if (
                        idx > 0 &&
                        (p as number) - (arr[idx - 1] as number) > 1
                      )
                        acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "..." ? (
                        <span key={i} className="text-white/15 text-xs px-1">
                          …
                        </span>
                      ) : (
                        <button
                          key={i}
                          onClick={() => load(p as number)}
                          className={[
                            "cursor-pointer w-8 h-8 rounded-lg text-xs transition-all duration-150 border",
                            page === p
                              ? "bg-white/8 border-white/15 text-white/80"
                              : "border-transparent text-white/25 hover:text-white/50 hover:border-white/10",
                          ].join(" ")}
                        >
                          {p}
                        </button>
                      ),
                    )}
                </div>

                <button
                  onClick={() => load(page + 1)}
                  disabled={!gallery.pagination.hasNext}
                  className="cursor-pointer flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border border-white/8 text-white/35 hover:border-white/20 hover:text-white/60 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function GalleryCard({ item, index }: { item: GalleryItem; index: number }) {
  const [sliderPos, setSliderPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const date = new Date(item.createdAt).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const updateSlider = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = Math.min(
      100,
      Math.max(0, ((clientX - rect.left) / rect.width) * 100),
    );
    setSliderPos(pos);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMouseMove = (e: MouseEvent) => updateSlider(e.clientX);
    const onMouseUp = () => setDragging(false);
    const onTouchMove = (e: TouchEvent) => updateSlider(e.touches[0].clientX);
    const onTouchEnd = () => setDragging(false);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [dragging, updateSlider]);

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden border border-white/6 bg-[#0e0e0e]"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* ── Drag slider comparison ────────────────────────── */}
      <div
        ref={containerRef}
        className="relative aspect-4/3 overflow-hidden select-none"
        style={{ cursor: dragging ? "ew-resize" : "col-resize" }}
        onMouseDown={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onTouchStart={() => setDragging(true)}
      >
        {/* Enhanced — full width base */}
        <img
          src={item.resultUrl}
          alt="Enhanced"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Original — clipped to left of slider */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPos}%` }}
        >
          <img
            src={item.originalUrl}
            alt="Original"
            className="absolute inset-0 h-full object-cover"
            style={{ width: containerRef.current?.offsetWidth ?? 400 }}
            draggable={false}
          />
        </div>

        {/* Divider */}
        <div
          className="absolute top-0 bottom-0 w-px bg-white/50 pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        />

        {/* Handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          <ChevronLeft size={11} className="text-black" />
          <ChevronRight size={11} className="text-black" />
        </div>

        {/* Labels */}
        <span className="absolute top-3 left-3 text-[9px] tracking-[0.2em] uppercase px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white/45 border border-white/10 pointer-events-none">
          Before
        </span>
        <span className="absolute top-3 right-3 text-[9px] tracking-[0.2em] uppercase px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white/45 border border-white/10 pointer-events-none">
          After
        </span>
      </div>

      {/* ── Footer ───────────────────────────────────────── */}
      <div className="px-4 py-3 border-t border-white/4">
        <p
          className={`text-[11px] text-white/28 mb-2 leading-relaxed cursor-pointer hover:text-white/40 transition-colors ${expanded ? "" : "line-clamp-1"}`}
          onClick={() => setExpanded(!expanded)}
        >
          {item.prompt}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/18">{date}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(item.originalUrl, "_blank")}
              className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/8 text-white/28 hover:border-white/18 hover:text-white/50 text-[10px] transition-all"
            >
              <Download size={9} />
              Original
            </button>
            <button
              onClick={() => window.open(item.resultUrl, "_blank")}
              className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/15 text-white/50 hover:border-white/30 hover:text-white/75 text-[10px] transition-all"
            >
              <Download size={9} />
              Enhanced
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
