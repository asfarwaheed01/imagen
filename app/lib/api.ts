const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5174";

export type JobStatus =
  | "pending"
  | "processing"
  | "straightening"
  | "enhancing"
  | "completed"
  | "failed";

export interface JobResponse {
  jobId: string;
  status: JobStatus;
  resultUrl: string | null;
  error: string | null;
}

export interface GalleryItem {
  id: string;
  status: string;
  originalUrl: string;
  resultUrl: string;
  prompt: string;
  createdAt: string;
}

export interface GalleryResponse {
  data: GalleryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const startEnhancement = async (
  file: File,
  prompt: string,
  isCustomPrompt: boolean = false,
): Promise<{ jobId: string }> => {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("prompt", prompt);
  formData.append("isCustomPrompt", String(isCustomPrompt));

  const res = await fetch(`${API_BASE}/api/images/process`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to start enhancement");
  }

  return res.json();
};

export const getJobStatus = async (jobId: string): Promise<JobResponse> => {
  const res = await fetch(`${API_BASE}/api/images/job/${jobId}`);
  if (!res.ok) throw new Error("Failed to get job status");
  return res.json();
};

export const fetchGallery = async (
  page = 1,
  limit = 10,
): Promise<GalleryResponse> => {
  const res = await fetch(
    `${API_BASE}/api/images/gallery?page=${page}&limit=${limit}`,
  );
  if (!res.ok) throw new Error("Failed to fetch gallery");
  return res.json();
};
