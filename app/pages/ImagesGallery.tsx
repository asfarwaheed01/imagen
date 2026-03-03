"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchGallery, GalleryResponse } from "@/app/lib/api";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { GalleryCard } from "../components/GalleryCard/GalleryCard";

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
