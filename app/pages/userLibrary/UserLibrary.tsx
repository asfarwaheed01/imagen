"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  List,
  Search,
  Plus,
  MapPin,
  Images,
  ChevronRight,
  Loader2,
} from "lucide-react";
import api from "@/app/lib/apiClient";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Order {
  id: number;
  status: string;
  imageCount: number;
  totalCost: string;
  paidAt: string | null;
  createdAt: string;
}

interface Property {
  id: number;
  address: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  createdAt: string;
  orders: Order[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const totalImages = (p: Property) =>
  p.orders.reduce((sum, o) => sum + (o.imageCount ?? 0), 0);

const latestOrder = (p: Property): Order | null =>
  p.orders.length > 0
    ? p.orders.reduce((a, b) =>
        new Date(a.createdAt) > new Date(b.createdAt) ? a : b,
      )
    : null;

const statusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-600";
    case "paid":
    case "processing":
      return "bg-blue-50 text-blue-600";
    case "pending":
      return "bg-amber-50 text-amber-600";
    default:
      return "bg-gray-100 text-gray-500";
  }
};

// ── Grid Card ─────────────────────────────────────────────────────────────────

const GridCard = ({
  property,
  onClick,
}: {
  property: Property;
  onClick: () => void;
}) => {
  const order = latestOrder(property);
  const photos = totalImages(property);

  return (
    <button
      onClick={onClick}
      className="group text-left bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-300 hover:shadow-md transition-all duration-200 active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
          <MapPin className="w-4 h-4 text-gray-400" />
        </div>
        {order && (
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${statusColor(order.status)}`}
          >
            {order.status}
          </span>
        )}
      </div>

      <p className="text-[14px] font-semibold text-gray-900 leading-snug mb-1 line-clamp-2">
        {property.address}
      </p>
      <p className="text-[12px] text-gray-400">{property.propertyType}</p>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
          <Images className="w-3.5 h-3.5" />
          {photos} photo{photos !== 1 ? "s" : ""}
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
      </div>
    </button>
  );
};

// ── List Row ──────────────────────────────────────────────────────────────────

const ListRow = ({
  property,
  onClick,
}: {
  property: Property;
  onClick: () => void;
}) => {
  const order = latestOrder(property);
  const photos = totalImages(property);

  return (
    <button
      onClick={onClick}
      className="group w-full text-left flex items-center gap-4 bg-white border border-gray-100 rounded-2xl px-5 py-4 hover:border-gray-300 hover:shadow-sm transition-all duration-200 active:scale-[0.99]"
    >
      <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
        <MapPin className="w-4 h-4 text-gray-400" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-gray-900 truncate">
          {property.address}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[12px] text-gray-400">
            {property.propertyType}
          </span>
          <span className="text-gray-200">·</span>
          <span className="text-[12px] text-gray-400">
            {photos} photo{photos !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {order && (
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${statusColor(order.status)}`}
          >
            {order.status}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
      </div>
    </button>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const UserLibrary = () => {
  const router = useRouter();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    api
      .get("/api/library")
      .then(({ data }) => setProperties(data.properties))
      .catch(() => setError("Failed to load library"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = properties.filter((p) =>
    p.address.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#f8f9fb] pt-16">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">
              Property Library
            </h1>
            {!loading && (
              <p className="text-[13px] text-gray-400 mt-0.5">
                {filtered.length} propert{filtered.length !== 1 ? "ies" : "y"}
              </p>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
            <button
              onClick={() => setView("grid")}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                view === "grid"
                  ? "bg-gray-900 text-white"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                view === "list"
                  ? "bg-gray-900 text-white"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search properties..."
            className="w-full h-12 pl-11 pr-4 bg-white border border-gray-200 rounded-2xl text-[14px] text-gray-800 placeholder:text-gray-400 placeholder:uppercase placeholder:text-[12px] placeholder:tracking-widest focus:outline-none focus:ring-2 focus:ring-gray-200 transition"
          />
        </div>

        {/* States */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-[14px] text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20 space-y-2">
            <MapPin className="w-8 h-8 text-gray-200 mx-auto" />
            <p className="text-[14px] text-gray-400">
              {search ? "No properties match your search" : "No properties yet"}
            </p>
          </div>
        )}

        {/* Grid view */}
        {!loading && !error && filtered.length > 0 && view === "grid" && (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((p) => (
              <GridCard
                key={p.id}
                property={p}
                onClick={() => {
                  const order = latestOrder(p);
                  if (order) router.push(`/library/${order.id}`);
                }}
              />
            ))}
          </div>
        )}

        {/* List view */}
        {!loading && !error && filtered.length > 0 && view === "list" && (
          <div className="space-y-2">
            {filtered.map((p) => (
              <ListRow
                key={p.id}
                property={p}
                onClick={() => {
                  const order = latestOrder(p);
                  if (order) router.push(`/library/${order.id}`);
                }}
              />
            ))}
          </div>
        )}

        {/* Spacer for FAB */}
        <div className="h-20" />
      </div>

      {/* Add New Property FAB */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-linear-to-t from-[#f8f9fb] to-transparent pointer-events-none">
        <button
          onClick={() => router.push("/")}
          className="pointer-events-auto w-full max-w-2xl mx-auto flex h-14 items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 active:scale-[0.98] text-white text-[15px] font-medium rounded-2xl transition-all duration-200 shadow-lg shadow-gray-900/20"
        >
          <Plus className="w-4 h-4" />
          Add New Property
        </button>
      </div>
    </div>
  );
};

export default UserLibrary;
