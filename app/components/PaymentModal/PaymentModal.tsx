"use client";

import React, { useEffect, useState } from "react";
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { X, Loader2 } from "lucide-react";
import api from "@/app/lib/apiClient";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

interface ImageMetaPayload {
  category: string;
  notes: string;
}

interface CheckoutFormProps {
  orderId: number;
  totalCost: number;
  files: File[];
  imageMeta: ImageMetaPayload[];
  onSuccess: (orderId: number) => void;
  onError: (msg: string) => void;
}

const CheckoutForm = ({
  orderId,
  totalCost,
  files,
  imageMeta,
  onSuccess,
  onError,
}: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) throw new Error(error.message ?? "Payment failed");
      if (paymentIntent?.status !== "succeeded")
        throw new Error("Payment not completed");

      const formData = new FormData();
      files.forEach((f) => formData.append("images", f));
      formData.append("imageMeta", JSON.stringify(imageMeta));

      await api.post(`/api/orders/${orderId}/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onSuccess(orderId);
    } catch (err: any) {
      onError(
        err.response?.data?.message ?? err.message ?? "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement options={{ layout: "tabs" }} />
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full h-12 rounded-xl bg-gray-800 hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-[14px] font-medium transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Processing…
          </>
        ) : (
          `Pay $${totalCost}`
        )}
      </button>
    </form>
  );
};

interface PaymentModalProps {
  clientSecret: string;
  orderId: number;
  totalCost: number;
  files: File[];
  imageMeta: ImageMetaPayload[];
  onSuccess: (orderId: number) => void;
  onClose: () => void;
}

const PaymentModal = ({
  clientSecret,
  orderId,
  totalCost,
  files,
  imageMeta,
  onSuccess,
  onClose,
}: PaymentModalProps) => {
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl z-10 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <div>
            <h2 className="text-[17px] font-bold text-gray-900">
              Complete Payment
            </h2>
            <p className="text-[13px] text-gray-500 mt-0.5">
              {files.length} image{files.length !== 1 ? "s" : ""} · ${totalCost}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-8">
          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 mb-4">
              {error}
            </p>
          )}
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#1f2937",
                  borderRadius: "12px",
                  fontFamily: "inherit",
                },
              },
            }}
          >
            <CheckoutForm
              orderId={orderId}
              totalCost={totalCost}
              files={files}
              imageMeta={imageMeta}
              onSuccess={onSuccess}
              onError={setError}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
