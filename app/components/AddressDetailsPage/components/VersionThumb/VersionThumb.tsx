import { Check } from "lucide-react";

interface Props {
  url: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function VersionThumb({ url, label, selected, onClick }: Props) {
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
