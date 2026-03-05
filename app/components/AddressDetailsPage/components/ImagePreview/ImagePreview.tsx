"use client";

import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";
import { ImageVersion } from "@/app/types/revision.types";

interface Props {
  versions: ImageVersion[];
  activeKey: string;
  onClose: () => void;
  onNavigate: (key: string) => void;
}

export function ImagePreview({
  versions,
  activeKey,
  onClose,
  onNavigate,
}: Props) {
  const activeIndex = versions.findIndex((v) => v.key === activeKey);
  const active = versions[activeIndex];
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < versions.length - 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev)
        onNavigate(versions[activeIndex - 1].key);
      if (e.key === "ArrowRight" && hasNext)
        onNavigate(versions[activeIndex + 1].key);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, hasPrev, hasNext]);

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-999 bg-black/90 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
      >
        <X size={16} />
      </button>

      {/* Label */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white/60 text-[12px] tracking-wide">
        {active.label}
      </div>

      {/* Prev */}
      {hasPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(versions[activeIndex - 1].key);
          }}
          className="absolute left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
        >
          <ChevronLeft size={18} />
        </button>
      )}

      {/* Image */}
      <img
        src={active.url}
        alt={active.label}
        onClick={(e) => e.stopPropagation()}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
      />

      {/* Next */}
      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(versions[activeIndex + 1].key);
          }}
          className="absolute right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
        >
          <ChevronRight size={18} />
        </button>
      )}

      {/* Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        {versions.map((v) => (
          <button
            key={v.key}
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(v.key);
            }}
            className={`w-1.5 h-1.5 rounded-full transition-all ${v.key === activeKey ? "bg-white w-3" : "bg-white/30 hover:bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}
