import { GalleryItem } from "@/app/lib/api";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export function GalleryCard({
  item,
  index,
}: {
  item: GalleryItem;
  index: number;
}) {
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

        {/* Original — same size, clipped by clipPath */}
        <img
          src={item.originalUrl}
          alt="Original"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
          draggable={false}
        />

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
