"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CloudUpload,
  FolderOpen,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import PaymentModal from "../PaymentModal/PaymentModal";
import api from "@/app/lib/apiClient";
import { useAuth } from "@/app/providers/AuthContext";

const IMAGE_PRICING: Record<number, number> = {
  2: 32,
  5: 75,
  10: 140,
  20: 260,
  50: 600,
};

const IMAGE_OPTIONS = Object.entries(IMAGE_PRICING).map(([count, price]) => ({
  value: Number(count),
  label: `${count} Images - $${price}`,
}));

const PROPERTY_TYPES = [
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

const SUPPORTED_FORMATS =
  "JPG, PNG, HEIC, CR3, CR2, DNG, NEF, ARW, RAF, RW2, ORF, PEF";
const ACCEPTED_EXTENSIONS =
  ".jpg,.jpeg,.png,.heic,.cr3,.cr2,.dng,.nef,.arw,.raf,.rw2,.orf,.pef";
const POLL_INTERVAL = 5000;

// ── Sub-components ────────────────────────────────────────────────────────────

const Section = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`bg-[#f0f2f4] rounded-2xl p-5 ${className}`}>{children}</div>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[15px] font-semibold text-gray-900 mb-3">
    {children}
  </label>
);

const SelectField = ({
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
      className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl appearance-none text-[15px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 cursor-pointer"
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

const NumberInput = ({
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
      className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-[15px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
    />
  </div>
);

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormState {
  address: string;
  imageCount: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  carSpaces: number;
  additionalInfo: string;
  files: File[];
}

interface OrderProgress {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  allDone: boolean;
}

interface PaymentState {
  clientSecret: string;
  orderId: number;
}

// ── Main Component ────────────────────────────────────────────────────────────

const UploadForm = () => {
  const router = useRouter();
  const user = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [payment, setPayment] = useState<PaymentState | null>(null);
  const [progress, setProgress] = useState<OrderProgress | null>(null);

  const [form, setForm] = useState<FormState>({
    address: "",
    imageCount: 2,
    propertyType: "House",
    bedrooms: 2,
    bathrooms: 2,
    carSpaces: 2,
    additionalInfo: "",
    files: [],
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const totalCost = IMAGE_PRICING[form.imageCount] ?? 0;
  const uploadEnabled = form.address.trim().length > 0;

  // ── Polling ───────────────────────────────────────────────────────────────

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = (orderId: number) => {
    stopPolling();

    const poll = async () => {
      try {
        const { data } = await api.get<OrderProgress>(
          `/api/orders/${orderId}/status`,
        );
        setProgress(data);
        if (data.allDone) {
          stopPolling();
          setTimeout(() => router.push("/library"), 1500);
        }
      } catch {
        // silently retry next interval
      }
    };

    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL);
  };

  useEffect(() => () => stopPolling(), []);

  // ── File handling ─────────────────────────────────────────────────────────

  const addFiles = useCallback(
    (incoming: FileList | null) => {
      if (!incoming) return;
      const valid = Array.from(incoming).filter((f) =>
        ACCEPTED_EXTENSIONS.split(",").some((ext) =>
          f.name.toLowerCase().endsWith(ext.replace(".", "")),
        ),
      );
      set("files", [...form.files, ...valid].slice(0, form.imageCount));
    },
    [form.files, form.imageCount],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (uploadEnabled) addFiles(e.dataTransfer.files);
    },
    [uploadEnabled, addFiles],
  );

  // ── Create payment intent ─────────────────────────────────────────────────

  const handlePay = async () => {
    if (!user) return router.push("/auth");
    if (!uploadEnabled || form.files.length === 0) return;
    setError("");
    setSubmitting(true);
    try {
      const { data } = await api.post<{
        clientSecret: string;
        orderId: number;
      }>("/api/orders/create-payment-intent", {
        address: form.address,
        propertyType: form.propertyType,
        bedrooms: form.bedrooms,
        bathrooms: form.bathrooms,
        carSpaces: form.carSpaces,
        additionalInfo: form.additionalInfo,
        imageCount: form.imageCount,
      });
      setPayment({ clientSecret: data.clientSecret, orderId: data.orderId });
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to initialise payment");
    } finally {
      setSubmitting(false);
    }
  };

  // ── After Stripe confirms + images uploaded ───────────────────────────────

  const handlePaymentSuccess = (orderId: number) => {
    setPayment(null);
    startPolling(orderId);
  };

  // ── Progress status label ─────────────────────────────────────────────────

  const renderProgress = () => {
    if (!progress) return null;

    if (progress.allDone && progress.failed === 0) {
      return (
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
          <p className="text-[13px] text-green-700 font-medium">
            All {progress.total} images enhanced — redirecting to library…
          </p>
        </div>
      );
    }

    if (progress.allDone && progress.failed > 0) {
      return (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-[13px] text-red-600">
            {progress.completed} enhanced, {progress.failed} failed —
            redirecting…
          </p>
        </div>
      );
    }

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
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="min-h-screen bg-white pt-20 pb-10">
        <div className="max-w-125 mx-auto px-4 space-y-4">
          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <Section>
            <Label>Property Address</Label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Enter property address"
              className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 tracking-wide"
            />
          </Section>

          <Section>
            <Label>Number of Images:</Label>
            <SelectField
              value={form.imageCount}
              onChange={(v) => set("imageCount", Number(v))}
              options={IMAGE_OPTIONS}
            />
          </Section>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (uploadEnabled) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => uploadEnabled && fileInputRef.current?.click()}
            className={`rounded-2xl border-2 border-dashed py-14 px-6 flex flex-col items-center gap-3 transition-colors
              ${uploadEnabled ? "cursor-pointer hover:bg-gray-50" : "cursor-not-allowed opacity-70"}
              ${dragging ? "border-gray-500 bg-gray-50" : "border-gray-300 bg-[#f5f6f7]"}`}
          >
            <CloudUpload
              className="w-14 h-14 text-gray-400"
              strokeWidth={1.4}
            />
            <p className="text-[15px] text-gray-500 text-center">
              {uploadEnabled
                ? form.files.length > 0
                  ? `${form.files.length} file(s) selected`
                  : "Click or drag & drop images here"
                : "Enter address above to enable upload"}
            </p>
            <p className="text-[13px] text-gray-400 text-center">
              Supported formats: {SUPPORTED_FORMATS}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_EXTENSIONS}
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          <Section>
            <h2 className="text-[17px] font-bold text-gray-900 mb-4">
              Property Details
            </h2>
            <div className="space-y-4">
              <div>
                <Label>Property Type</Label>
                <SelectField
                  value={form.propertyType}
                  onChange={(v) => set("propertyType", v)}
                  options={PROPERTY_TYPES.map((t) => ({ value: t, label: t }))}
                />
              </div>
              <div className="flex gap-3">
                <NumberInput
                  label="Bedrooms"
                  value={form.bedrooms}
                  onChange={(v) => set("bedrooms", v)}
                />
                <NumberInput
                  label="Bathrooms"
                  value={form.bathrooms}
                  onChange={(v) => set("bathrooms", v)}
                />
                <NumberInput
                  label="Car Spaces"
                  value={form.carSpaces}
                  onChange={(v) => set("carSpaces", v)}
                />
              </div>
              <div>
                <Label>Additional Information</Label>
                <textarea
                  value={form.additionalInfo}
                  onChange={(e) => set("additionalInfo", e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[15px] text-gray-800 resize-y focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[15px] font-bold text-gray-900">
                  Total Cost:
                </span>
                <span className="text-[15px] font-bold text-gray-900">
                  ${totalCost}
                </span>
              </div>
            </div>
          </Section>

          <div className="space-y-3 pt-1">
            {renderProgress()}

            <button
              onClick={handlePay}
              disabled={
                !uploadEnabled ||
                form.files.length === 0 ||
                submitting ||
                !!progress
              }
              className="w-full h-14 rounded-2xl bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-[15px] font-medium transition-colors"
            >
              {submitting ? "Preparing payment…" : "Pay & Send to Editor"}
            </button>

            <button
              onClick={() =>
                user ? router.push("/library") : router.push("/auth")
              }
              className="w-full h-14 rounded-2xl bg-[#f0f2f4] hover:bg-gray-200 text-gray-800 text-[15px] font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <FolderOpen className="w-4 h-4" />
              Go to Library
            </button>
          </div>
        </div>
      </div>

      {payment && (
        <PaymentModal
          clientSecret={payment.clientSecret}
          orderId={payment.orderId}
          totalCost={totalCost}
          files={form.files}
          onSuccess={handlePaymentSuccess}
          onClose={() => setPayment(null)}
        />
      )}
    </>
  );
};

export default UploadForm;
