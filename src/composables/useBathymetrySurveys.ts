import { api } from 'src/boot/axios';
import type { DepthPoint } from 'src/composables/useMapDataUpload';

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface BathymetrySurvey {
  id: number;
  researcherId: number;
  label: string;
  surveyDate: string;
  points: DepthPoint[];
  pointCount: number;
  cleanedCount: number;
  reviewStatus: ReviewStatus;
  reviewNote?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBathymetrySurveyInput {
  label: string;
  surveyDate: string;
  points: DepthPoint[];
  cleanedCount: number;
}

export async function submitBathymetrySurvey(input: CreateBathymetrySurveyInput): Promise<BathymetrySurvey> {
  const { data } = await api.post<BathymetrySurvey>('/bathymetry/surveys', input);
  return data;
}

export async function fetchBathymetrySurveys(
  params: { status?: ReviewStatus; mine?: boolean } = {},
): Promise<BathymetrySurvey[]> {
  const { data } = await api.get<BathymetrySurvey[]>('/bathymetry/surveys', {
    params: { status: params.status, mine: params.mine ? 'true' : undefined },
  });
  return data;
}

// The one survey the public map renders — null if nothing's been approved
// yet, in which case the map falls back to the synthetic placeholder.
export async function fetchActiveBathymetrySurvey(): Promise<BathymetrySurvey | null> {
  const { data } = await api.get<BathymetrySurvey | null>('/bathymetry/surveys/active');
  return data;
}

export async function approveBathymetrySurvey(id: number): Promise<BathymetrySurvey> {
  const { data } = await api.patch<BathymetrySurvey>(`/bathymetry/surveys/${id}/approve`);
  return data;
}

export async function rejectBathymetrySurvey(id: number, reason?: string): Promise<BathymetrySurvey> {
  const { data } = await api.patch<BathymetrySurvey>(`/bathymetry/surveys/${id}/reject`, { reason });
  return data;
}
