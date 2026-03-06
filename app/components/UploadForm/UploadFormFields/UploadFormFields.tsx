"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  CloudUpload,
  X,
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import api from "@/app/lib/apiClient";
import {
  ImageMeta,
  OrderProgress,
  PlaceSuggestion,
} from "@/app/types/upload.types";

// ── Constants ─────────────────────────────────────────────────────────────────

export const PRICE_PER_IMAGE = 16;
export const MAX_IMAGES = 50;
export const POLL_INTERVAL = 5000;
export const SUPPORTED_FORMATS =
  "JPG, PNG, HEIC, CR3, CR2, DNG, NEF, ARW, RAF, RW2, ORF, PEF";
export const ACCEPTED_EXTENSIONS =
  ".jpg,.jpeg,.png,.heic,.cr3,.cr2,.dng,.nef,.arw,.raf,.rw2,.orf,.pef";

export const PROPERTY_TYPES = [
  "House",
  "Duplex",
  "Apartment/Unit/Flat",
  "Terrace",
  "Townhouse",
  "Vacant Land",
  "Commercial",
  "Villa",
  "Acreage",
];

export const IMAGE_CATEGORIES = [
  "Internal",
  "External Day",
  "Dusk",
  "Drone",
  "Day to Dusk",
  "Golden Hour",
];

// ── Primitives ────────────────────────────────────────────────────────────────

export const Section = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`bg-[#f0f2f4] rounded-2xl p-5 ${className}`}>{children}</div>
);

export const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[16px] font-semibold text-gray-900 mb-3">
    {children}
  </label>
);

export const SelectField = ({
  value,
  onChange,
  options,
}: {
  value: string | number;
  onChange: (v: string) => void;
  options: { value: string | number; label: string }[];
}) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl appearance-none text-[16px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 cursor-pointer"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
      ▾
    </span>
  </div>
);

export const NumberInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) => (
  <div className="flex-1">
    <Label>{label}</Label>
    <input
      type="number"
      min={0}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-[16px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
    />
  </div>
);

// ── Address autocomplete ──────────────────────────────────────────────────────

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (address: string, placeId: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nsw, setNsw] = useState<boolean | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchSuggestions = useCallback(async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get("/api/places/autocomplete", {
        params: { input },
      });
      setSuggestions(data.suggestions ?? []);
      setOpen(true);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (v: string) => {
    onChange(v);
    setNsw(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 350);
  };

  const handleSelect = async (s: PlaceSuggestion) => {
    onChange(s.description);
    setOpen(false);
    setSuggestions([]);
    try {
      const { data } = await api.get("/api/places/details", {
        params: { placeId: s.placeId },
      });
      const isNSW = data.state === "NSW";
      setNsw(isNSW);
      if (isNSW) onSelect(s.description, s.placeId);
    } catch {
      setNsw(null);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPin
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Enter NSW property address"
          className={`w-full h-12 pl-10 pr-10 bg-white border rounded-xl text-[16px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-colors ${
            nsw === false
              ? "border-red-300 focus:ring-red-200"
              : nsw === true
                ? "border-green-300 focus:ring-green-200"
                : "border-gray-200 focus:ring-gray-300"
          }`}
        />
        {loading && (
          <Loader2
            size={14}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 animate-spin"
          />
        )}
      </div>
      {nsw === false && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <AlertCircle size={12} className="text-red-400 shrink-0" />
          <p className="text-[11px] text-red-500">
            Only NSW properties are accepted
          </p>
        </div>
      )}
      {nsw === true && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <CheckCircle2 size={12} className="text-green-500 shrink-0" />
          <p className="text-[11px] text-green-600">NSW property confirmed</p>
        </div>
      )}
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s.placeId}
              onClick={() => handleSelect(s)}
              className="w-full flex items-start gap-2.5 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0"
            >
              <MapPin size={13} className="text-gray-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-gray-800 truncate">
                  {s.mainText}
                </p>
                <p className="text-[11px] text-gray-400 truncate">
                  {s.secondaryText}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Per-image card with category + notes ──────────────────────────────────────

function ImageCard({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: ImageMeta;
  index: number;
  onChange: (patch: Partial<ImageMeta>) => void;
  onRemove: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const u = URL.createObjectURL(item.file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [item.file]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setCatOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl">
      {/* Image + remove */}
      <div className="relative aspect-4/3 bg-gray-100">
        {url && (
          <img
            src={url}
            alt={item.file.name}
            className="w-full h-full object-cover"
          />
        )}
        <button
          onClick={onRemove}
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
        >
          <X size={13} className="text-white" />
        </button>

        {/* Category badge + dropdown */}
        <div ref={dropdownRef} className="absolute bottom-2.5 left-2.5">
          <button
            onClick={() => setCatOpen((o) => !o)}
            className="flex items-center gap-1.5 bg-black/70 hover:bg-black/85 backdrop-blur-sm text-white text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            {item.category}
            <ChevronDown
              size={11}
              className={`transition-transform ${catOpen ? "rotate-180" : ""}`}
            />
          </button>
          {catOpen && (
            <div className="absolute bottom-full mb-1.5 left-0 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-35 z-10">
              {IMAGE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    onChange({ category: cat });
                    setCatOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors ${
                    item.category === cat
                      ? "bg-gray-100 font-semibold text-gray-900"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="px-3 py-2.5">
        <textarea
          value={item.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Add notes for this image..."
          rows={2}
          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-[12px] text-gray-700 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
        />
      </div>
    </div>
  );
}

// ── Upload area ───────────────────────────────────────────────────────────────

export function UploadArea({
  images,
  enabled,
  maxFiles,
  onAdd,
  onChange,
  onRemove,
  onClear,
}: {
  images: ImageMeta[];
  enabled: boolean;
  maxFiles: number;
  onAdd: (f: FileList | null) => void;
  onChange: (index: number, patch: Partial<ImageMeta>) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (enabled) onAdd(e.dataTransfer.files);
    },
    [enabled, onAdd],
  );

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (enabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => enabled && fileInputRef.current?.click()}
        className={`rounded-2xl border-2 border-dashed py-10 px-6 flex flex-col items-center gap-3 transition-colors
          ${enabled ? "cursor-pointer hover:bg-gray-50" : "cursor-not-allowed opacity-60"}
          ${dragging ? "border-gray-500 bg-gray-50" : "border-gray-300 bg-[#f5f6f7]"}`}
      >
        <CloudUpload className="w-12 h-12 text-gray-400" strokeWidth={1.4} />
        <p className="text-[15px] text-gray-500 text-center">
          {!enabled
            ? "Enter a valid NSW address above to enable upload"
            : images.length > 0
              ? `${images.length}/${maxFiles} photos — click to add more`
              : "Click or drag & drop images here"}
        </p>
        <p className="text-[12px] text-gray-400 text-center">
          Up to {maxFiles || MAX_IMAGES} images · {SUPPORTED_FORMATS}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS}
          className="hidden"
          onChange={(e) => onAdd(e.target.files)}
        />
      </div>

      {/* Image cards grid */}
      {images.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-gray-700">
              {images.length} photo{images.length !== 1 ? "s" : ""} selected
              {maxFiles > 0 && (
                <span className="text-gray-400 font-normal">
                  {" "}
                  (Expected: {maxFiles})
                </span>
              )}
            </p>
            <button
              onClick={onClear}
              className="text-[12px] text-gray-400 hover:text-red-500 transition-colors"
            >
              Remove all
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {images.map((item, i) => (
              <ImageCard
                key={`${item.file.name}-${i}`}
                item={item}
                index={i}
                onChange={(patch) => onChange(i, patch)}
                onRemove={() => onRemove(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Pricing summary ───────────────────────────────────────────────────────────

export function PricingSummary({ fileCount }: { fileCount: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <span className="text-[13px] text-gray-500">Price per image</span>
        <span className="text-[13px] font-medium text-gray-800">
          ${PRICE_PER_IMAGE}.00
        </span>
      </div>
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <span className="text-[13px] text-gray-500">Images selected</span>
        <span className="text-[13px] font-medium text-gray-800">
          {fileCount}
        </span>
      </div>
      <div className="px-4 py-3 flex items-center justify-between bg-gray-50">
        <span className="text-[15px] font-bold text-gray-900">Total</span>
        <span className="text-[15px] font-bold text-gray-900">
          ${fileCount * PRICE_PER_IMAGE}.00
        </span>
      </div>
    </div>
  );
}

// ── Progress status ───────────────────────────────────────────────────────────

export function ProgressStatus({
  progress,
}: {
  progress: OrderProgress | null;
}) {
  if (!progress) return null;

  if (progress.allDone && progress.failed === 0)
    return (
      <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
        <p className="text-[13px] text-green-700 font-medium">
          All {progress.total} images enhanced — redirecting…
        </p>
      </div>
    );

  if (progress.allDone && progress.failed > 0)
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
        <X className="w-4 h-4 text-red-400 shrink-0" />
        <p className="text-[13px] text-red-600">
          {progress.completed} enhanced, {progress.failed} failed — redirecting…
        </p>
      </div>
    );

  const pct =
    progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;
  return (
    <div className="bg-[#f0f2f4] rounded-xl px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 text-gray-500 animate-spin" />
          <p className="text-[13px] text-gray-600 font-medium">
            Enhancing images… {progress.completed}/{progress.total}
          </p>
        </div>
        <span className="text-[12px] text-gray-400">{pct}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1">
        <div
          className="bg-gray-700 h-1 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-gray-400">
        Checking for updates every 5 seconds
      </p>
    </div>
  );
}
