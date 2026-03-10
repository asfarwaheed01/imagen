export interface ImageMeta {
  file: File;
  category: string;
  notes: string;
  gcpUrl?: string;
  uploading?: boolean;
  uploadError?: string;
}

export interface FormState {
  address: string;
  placeId: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  carSpaces: number;
  imageCount: number;
  additionalInfo: string;
  images: ImageMeta[];
}

export interface OrderProgress {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  allDone: boolean;
}

export interface PaymentState {
  clientSecret: string;
  orderId: number;
}

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}
