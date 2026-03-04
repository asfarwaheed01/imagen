"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen } from "lucide-react";
import PaymentModal from "../PaymentModal/PaymentModal";
import api from "@/app/lib/apiClient";
import { useAuth } from "@/app/providers/AuthContext";
import type { FormState, ImageMeta, OrderProgress, PaymentState } from "@/app/types/upload.types";
import {
  ACCEPTED_EXTENSIONS, MAX_IMAGES, POLL_INTERVAL, PRICE_PER_IMAGE, PROPERTY_TYPES,
  AddressAutocomplete, Label, NumberInput, PricingSummary,
  ProgressStatus, Section, SelectField, UploadArea,
} from "./UploadFormFields/UploadFormFields";

const IMAGE_COUNT_OPTIONS = [
  { value: "", label: "Select number of images..." },
  ...Array.from({ length: MAX_IMAGES }, (_, i) => ({
    value: i + 1,
    label: `${i + 1} Image${i + 1 !== 1 ? "s" : ""} - $${(i + 1) * PRICE_PER_IMAGE}`,
  })),
];

const UploadForm = () => {
  const router   = useRouter();
  const { user } = useAuth();
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const [payment,    setPayment]    = useState<PaymentState | null>(null);
  const [progress,   setProgress]   = useState<OrderProgress | null>(null);
  const [nswValid,   setNswValid]   = useState(false);

  const [form, setForm] = useState<FormState>({
    address: "", placeId: "", imageCount: 0, propertyType: "House",
    bedrooms: 2, bathrooms: 2, carSpaces: 2, additionalInfo: "", images: [],
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const totalCost     = form.imageCount * PRICE_PER_IMAGE;
  const uploadEnabled = nswValid && form.address.trim().length > 0 && form.imageCount > 0;

  // ── Polling ───────────────────────────────────────────────────────────────

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const startPolling = (orderId: number) => {
    stopPolling();
    const poll = async () => {
      try {
        const { data } = await api.get<OrderProgress>(`/api/orders/${orderId}/status`);
        setProgress(data);
        if (data.allDone) { stopPolling(); setTimeout(() => router.push("/library"), 1500); }
      } catch {}
    };
    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL);
  };

  useEffect(() => () => stopPolling(), []);

  // ── File handling ─────────────────────────────────────────────────────────

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter((f) =>
      ACCEPTED_EXTENSIONS.split(",").some((ext) =>
        f.name.toLowerCase().endsWith(ext.replace(".", "")),
      ),
    );
    setForm((prev) => {
      const newMeta: ImageMeta[] = valid.map((file) => ({
        file,
        category: "Internal",
        notes: "",
      }));
      return {
        ...prev,
        images: [...prev.images, ...newMeta].slice(0, prev.imageCount || MAX_IMAGES),
      };
    });
  }, []);

  const updateImage = (index: number, patch: Partial<ImageMeta>) =>
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => (i === index ? { ...img, ...patch } : img)),
    }));

  const removeImage = (i: number) =>
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }));

  const clearImages = () => setForm((prev) => ({ ...prev, images: [] }));

  // ── Payment ───────────────────────────────────────────────────────────────

  const handlePay = async () => {
    if (!user) return router.push("/auth");
    if (!uploadEnabled || form.images.length === 0) return;
    setError("");
    setSubmitting(true);
    try {
      const { data } = await api.post<{ clientSecret: string; orderId: number }>(
        "/api/orders/create-payment-intent",
        {
          address:        form.address,
          placeId:        form.placeId,
          propertyType:   form.propertyType,
          bedrooms:       form.bedrooms,
          bathrooms:      form.bathrooms,
          carSpaces:      form.carSpaces,
          additionalInfo: form.additionalInfo,
          imageCount:     form.imageCount,
        },
      );
      setPayment({ clientSecret: data.clientSecret, orderId: data.orderId });
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to initialise payment");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="min-h-screen bg-white pt-20 pb-10">
        <div className="max-w-125 mx-auto px-4 space-y-4">

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>
          )}

          <Section>
            <Label>Property Address</Label>
            <AddressAutocomplete
              value={form.address}
              onChange={(v) => { set("address", v); setNswValid(false); }}
              onSelect={(address, placeId) => { set("address", address); set("placeId", placeId); setNswValid(true); }}
            />
          </Section>

          <Section>
            <Label>Number of Images:</Label>
            <SelectField
              value={form.imageCount || ""}
              onChange={(v) => {
                const n = Number(v);
                setForm((prev) => ({
                  ...prev,
                  imageCount: n,
                  images: prev.images.slice(0, n),
                }));
              }}
              options={IMAGE_COUNT_OPTIONS as { value: string | number; label: string }[]}
            />
          </Section>

          <UploadArea
            images={form.images}
            enabled={uploadEnabled}
            maxFiles={form.imageCount}
            onAdd={addFiles}
            onChange={updateImage}
            onRemove={removeImage}
            onClear={clearImages}
          />

          <Section>
            <h2 className="text-[17px] font-bold text-gray-900 mb-4">Property Details</h2>
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
                <NumberInput label="Bedrooms"   value={form.bedrooms}   onChange={(v) => set("bedrooms", v)} />
                <NumberInput label="Bathrooms"  value={form.bathrooms}  onChange={(v) => set("bathrooms", v)} />
                <NumberInput label="Car Spaces" value={form.carSpaces}  onChange={(v) => set("carSpaces", v)} />
              </div>
              <div>
                <Label>Additional Information</Label>
                <textarea value={form.additionalInfo} onChange={(e) => set("additionalInfo", e.target.value)} rows={4}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[15px] text-gray-800 resize-y focus:outline-none focus:ring-2 focus:ring-gray-300" />
              </div>
              <PricingSummary fileCount={form.imageCount} />
            </div>
          </Section>

          <div className="space-y-3 pt-1">
            <ProgressStatus progress={progress} />
            <button onClick={handlePay}
              disabled={!uploadEnabled || form.images.length === 0 || submitting || !!progress}
              className="w-full h-14 rounded-2xl bg-gray-900 hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-[15px] font-medium transition-colors">
              {submitting ? "Preparing payment…"
                : form.imageCount > 0 ? `Pay $${totalCost} & Send to Editor`
                : "Pay & Send to Editor"}
            </button>
            <button onClick={() => user ? router.push("/library") : router.push("/auth")}
              className="w-full h-14 rounded-2xl bg-[#f0f2f4] hover:bg-gray-200 text-gray-800 text-[15px] font-medium flex items-center justify-center gap-2 transition-colors">
              <FolderOpen className="w-4 h-4" /> Go to Library
            </button>
          </div>
        </div>
      </div>

      {payment && (
        <PaymentModal
          clientSecret={payment.clientSecret}
          orderId={payment.orderId}
          totalCost={totalCost}
          files={form.images.map((m) => m.file)}
          imageMeta={form.images.map((m) => ({ category: m.category, notes: m.notes }))}
          onSuccess={(orderId) => { setPayment(null); startPolling(orderId); }}
          onClose={() => setPayment(null)}
        />
      )}
    </>
  );
};

export default UploadForm;