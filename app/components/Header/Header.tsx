import { LayoutGrid } from "lucide-react";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-8 h-14 border-b border-white/10 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-[#c9a84c]/10 border border-[#c9a84c]/25 flex items-center justify-center">
          <LayoutGrid size={13} className="text-[#c9a84c]" />
        </div>
        <span className="text-sm font-medium text-white/80 tracking-tight">PropEnhance</span>
      </div>
      <span className="text-[10px] tracking-[0.25em] uppercase text-[#c9a84c]/60 font-light">
        AI Photo Studio
      </span>
    </header>
  );
}