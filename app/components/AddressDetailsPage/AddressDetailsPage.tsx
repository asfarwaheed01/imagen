"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Images, Download } from "lucide-react";
import api from "@/app/lib/apiClient";
import { ImageItem, Order } from "@/app/types/revision.types";
import { OrderDetailHeader } from "./components/OrderDetailHeader/OrderDetailHeader";
import { ImageCard } from "./components/ImageCard/ImageCard";

const OrderDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.id);

  const [order, setOrder] = useState<Order | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [view, setView] = useState<"grid" | "list">("list");

  useEffect(() => {
    api
      .get(`/api/library/${orderId}`)
      .then(({ data }) => {
        setOrder(data.order);
        setImages(data.images);
      })
      .catch(() => setError("Failed to load order"))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleRevisionSubmit = async (
    imageId: number,
    prompt: string,
    sourceUrl: string,
  ) => {
    setSubmittingId(imageId);
    try {
      await api.post(`/api/orders/${orderId}/revisions`, {
        imageIds: [imageId],
        prompt,
        sourceUrl,
      });
      const { data } = await api.get(`/api/library/${orderId}`);
      setImages(data.images);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Failed to submit revision");
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-white pt-16">
        <div className="sticky top-16 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-4">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500"
            >
              <ArrowLeft size={15} />
            </button>
            <div className="h-4 w-48 bg-gray-100 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-white pt-16">
        <div className="sticky top-16 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-4">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={15} />
            </button>
            <p className="text-[14px] font-semibold text-gray-900">Error</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <p className="text-[14px] text-gray-400">{error}</p>
          <button
            onClick={() => router.back()}
            className="text-[13px] text-gray-500 underline underline-offset-2"
          >
            Go back
          </button>
        </div>
      </div>
    );

  if (images.length === 0)
    return (
      <div className="min-h-screen bg-[#f8f9fb] pt-16">
        <OrderDetailHeader
          order={order}
          images={images}
          view={view}
          onBack={() => router.back()}
          onViewChange={setView}
        />
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center">
            <Images className="w-6 h-6 text-gray-300" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-[15px] font-semibold text-gray-700">
              No images yet
            </p>
            <p className="text-[13px] text-gray-400">
              Images will appear here once processing begins
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="mt-2 flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={13} /> Back to Library
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f8f9fb] pt-16 pb-10">
      <OrderDetailHeader
        order={order}
        images={images}
        view={view}
        onBack={() => router.back()}
        onViewChange={setView}
      />
      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div
          className={view === "grid" ? "grid grid-cols-2 gap-4" : "space-y-4"}
        >
          {images.map((img, i) => (
            <ImageCard
              key={img.id}
              image={img}
              index={i}
              onRevisionSubmit={handleRevisionSubmit}
              submittingId={submittingId}
            />
          ))}
        </div>
      </div>
      {images.some((img) => img.editedKey ?? img.job?.resultKey) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={async () => {
              const toDownload = images.flatMap((img) => {
                const ext = (url: string) =>
                  url.split(".").pop()?.split("?")[0] ?? "jpg";
                const base =
                  img.originalFilename?.replace(/\.[^/.]+$/, "") ??
                  `image-${img.id}`;
                const results: { url: string; filename: string }[] = [];

                const editedUrl = img.editedKey ?? img.job?.resultKey;
                if (editedUrl)
                  results.push({
                    url: editedUrl,
                    filename: `${base}_edited.${ext(editedUrl)}`,
                  });

                img.revisions
                  .filter((r) => r.resultKey && r.status === "completed")
                  .sort((a, b) => a.revisionNumber - b.revisionNumber)
                  .forEach((r) =>
                    results.push({
                      url: r.resultKey!,
                      filename: `${base}_rev${r.revisionNumber}.${ext(r.resultKey!)}`,
                    }),
                  );

                return results;
              });

              for (const { url, filename } of toDownload) {
                try {
                  const blob = await fetch(url).then((r) => r.blob());
                  const objectUrl = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = objectUrl;
                  a.download = filename;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(objectUrl);
                  await new Promise((r) => setTimeout(r, 500));
                } catch {
                  console.error(`Failed to download: ${filename}`);
                }
              }
            }}
            className="cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gray-900 border border-gray-700 text-white/80 hover:bg-gray-700 hover:text-white text-sm transition-all shadow-xl"
          >
            <Download size={14} />
            Download All (
            {
              images
                .flatMap((img) => [
                  img.editedKey ?? img.job?.resultKey,
                  ...img.revisions
                    .filter((r) => r.resultKey && r.status === "completed")
                    .map((r) => r.resultKey),
                ])
                .filter(Boolean).length
            }
            )
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderDetailPage;
