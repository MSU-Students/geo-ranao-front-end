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
  /** How many fixed grid points this survey actually updated after snapping/averaging — always <= the grid's total size. */
  pointsUpdated: number;
  reviewStatus: ReviewStatus;
  reviewNote?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// The fixed bathymetry grid's current state — what the 2D and 3D map both
// render from (via buildDepthGridFromPoints), so they never disagree about
// what the lake floor looks like. gridSize is every fixed point regardless
// of coverage, for a "N of M points have data" indicator.
export interface CurrentBathymetryPoints {
  points: DepthPoint[];
  gridSize: number;
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

export async function fetchCurrentBathymetryPoints(): Promise<CurrentBathymetryPoints> {
  const { data } = await api.get<CurrentBathymetryPoints>('/bathymetry/points');
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

// Permanently retracts a bad upload — e.g. one approved without a proper QC
// pass. Every fixed point this survey touched reverts to whatever the next
// most recent survey left there (or back to "no data" if this was the only
// one) — see BathymetryService.remove on the backend.
export async function deleteBathymetrySurvey(id: number, reason?: string): Promise<void> {
  await api.delete(`/bathymetry/surveys/${id}`, { data: { reason } });
}
