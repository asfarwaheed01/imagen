import { ImageItem, Order } from "@/app/types/revision.types";
import { ArrowLeft, List, LayoutGrid } from "lucide-react";

interface Props {
  order: Order | null;
  images: ImageItem[];
  view: "grid" | "list";
  onBack: () => void;
  onViewChange: (v: "grid" | "list") => void;
}

export function OrderDetailHeader({
  order,
  images,
  view,
  onBack,
  onViewChange,
}: Props) {
  return (
    <div className="sticky top-16 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-4">
      <div className="max-w-2xl mx-auto flex items-center gap-3">
        <button
          onClick={onBack}
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
          {(["list", "grid"] as const).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${view === v ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-600"}`}
            >
              {v === "list" ? <List size={13} /> : <LayoutGrid size={13} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
