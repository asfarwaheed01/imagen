export interface Revision {
  revisionId: number;
  imageId: number;
  revisionNumber: number;
  status: string;
  clientNotes: string | null;
  resultKey: string | null;
  createdAt: string;
}

export interface Job {
  id: string;
  type: string;
  status: string;
  resultKey: string | null;
  error: string | null;
}

export interface ImageItem {
  id: number;
  status: string;
  originalKey: string | null;
  editedKey: string | null;
  deliveredKey: string | null;
  originalFilename: string;
  sortOrder: number;
  createdAt: string;
  job: Job | null;
  revisions: Revision[];
}

export interface Order {
  id: number;
  address: string;
  propertyType: string;
  status: string;
  imageCount: number;
  totalCost: string;
  paidAt: string | null;
  createdAt: string;
}

export interface ImageVersion {
  key: string;
  label: string;
  url: string;
}
