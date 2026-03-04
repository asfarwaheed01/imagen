"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  originalUrl: string;
  resultUrl: string;
  originalLabel?: string;
  resultLabel?: string;
}

export function SliderComparison({
  originalUrl,
  resultUrl,
  originalLabel = "Original",
  resultLabel = "Edited",
}: Props) {
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
