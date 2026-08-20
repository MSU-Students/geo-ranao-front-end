import { api } from 'src/boot/axios';

export type FishCategory = 'ENDEMIC' | 'INVASIVE' | 'GENERAL';
export type ConservationStatus =
  | 'CRITICALLY_ENDANGERED'
  | 'ENDANGERED'
  | 'VULNERABLE'
  | 'LEAST_CONCERN'
  | 'NOT_EVALUATED';
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface FishObservationPhoto {
  id: string;
  observationId: number;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  expiresAt: string;
  createdAt: string;
}

export interface FishObservation {
  id: number;
  researcherId: number;
  category: FishCategory;
  speciesScientific?: string | null;
  speciesCommon?: string | null;
  conservationStatus: ConservationStatus;
  trueLengthCm?: number | null;
  bodyDepthCm?: number | null;
  weightG?: number | null;
  depthM?: number | null;
  count?: number | null;
  sizeCategory?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  municipal?: string | null;
  barangay?: string | null;
  dateObserved: string;
  notes?: string | null;
  reviewStatus: ReviewStatus;
  reviewNote?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  photos: FishObservationPhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface FishObservationSummary {
  total: number;
  byCategory: Record<FishCategory, number>;
  byConservationStatus: Record<ConservationStatus, number>;
}

// Photo streaming is deliberately unauthenticated (see the API's
// fish-observations.controller.ts) so a plain <img> tag can use this URL
// directly without attaching a Bearer header.
export function fishPhotoUrl(photo: Pick<FishObservationPhoto, 'id' | 'observationId'>): string {
  return `${import.meta.env.VITE_API_URL}/fish-observations/${photo.observationId}/photos/${photo.id}`;
}

export async function submitFishObservation(form: FormData): Promise<FishObservation> {
  const { data } = await api.post<FishObservation>('/fish-observations', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function fetchFishObservations(
  params: { status?: ReviewStatus; category?: FishCategory; mine?: boolean } = {},
): Promise<FishObservation[]> {
  const { data } = await api.get<FishObservation[]>('/fish-observations', {
    params: { status: params.status, category: params.category, mine: params.mine ? 'true' : undefined },
  });
  return data;
}

export async function fetchFishObservationSummary(status: ReviewStatus = 'APPROVED'): Promise<FishObservationSummary> {
  const { data } = await api.get<FishObservationSummary>('/fish-observations/summary', { params: { status } });
  return data;
}

export async function approveFishObservation(id: number): Promise<FishObservation> {
  const { data } = await api.patch<FishObservation>(`/fish-observations/${id}/approve`);
  return data;
}

export async function rejectFishObservation(id: number, reason?: string): Promise<FishObservation> {
  const { data } = await api.patch<FishObservation>(`/fish-observations/${id}/reject`, { reason });
  return data;
}

export const CONSERVATION_STATUS_LABELS: Record<ConservationStatus, string> = {
  CRITICALLY_ENDANGERED: 'Critically Endangered',
  ENDANGERED: 'Endangered',
  VULNERABLE: 'Vulnerable',
  LEAST_CONCERN: 'Least Concern',
  NOT_EVALUATED: 'Not Evaluated',
};

export const CONSERVATION_STATUS_SHORT: Record<ConservationStatus, string> = {
  CRITICALLY_ENDANGERED: 'CR',
  ENDANGERED: 'EN',
  VULNERABLE: 'VU',
  LEAST_CONCERN: 'LC',
  NOT_EVALUATED: 'NE',
};
