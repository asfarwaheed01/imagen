const STATUS_STYLES: Record<string, string> = {
  completed: "bg-green-50 text-green-600 border-green-100",
  edited: "bg-green-50 text-green-600 border-green-100",
  delivered: "bg-green-50 text-green-600 border-green-100",
  processing: "bg-blue-50 text-blue-600 border-blue-100",
  enhancing: "bg-blue-50 text-blue-600 border-blue-100",
  straightening: "bg-blue-50 text-blue-600 border-blue-100",
  pending: "bg-amber-50 text-amber-600 border-amber-100",
  uploaded: "bg-amber-50 text-amber-600 border-amber-100",
  failed: "bg-red-50 text-red-500 border-red-100",
};

export function StatusBadge({ status }: { status: string }) {
  const cls =
    STATUS_STYLES[status] ?? "bg-gray-50 text-gray-500 border-gray-100";
  return (
    <span
      className={`text-[12px] font-medium px-3 py-1 rounded-full border capitalize ${cls}`}
    >
      {status === "edited" ? "Completed" : status}
    </span>
  );
}
