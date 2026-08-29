import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import { api } from 'src/boot/axios';
import type { WaterQualityUploadRow } from 'src/composables/useWaterQualityUpload';
import { allWaterQualityParams, getReadingWarnings } from 'src/composables/useWaterQualityModel';
import {
  fetchFishObservations,
  approveFishObservation,
  rejectFishObservation,
  type FishObservation,
} from 'src/composables/useFishObservations';
import {
  fetchWaterQualityReadings,
  approveWaterQualityReading,
  rejectWaterQualityReading,
  approveWaterQualityBatch,
  rejectWaterQualityBatch,
  type WaterQualityReading,
} from 'src/composables/useWaterQualityReadings';

export type AccountStatus = 'pending' | 'verified' | 'suspended' | 'rejected';

export interface ResearcherAccount {
  id: number;
  fullName: string;
  email: string;
  affiliation: string;
  departmentRole: string;
  purposeOfRequest: string;
  status: AccountStatus;
  submittedDate: string;
  reviewedDate?: string;
  reviewNote?: string | undefined;
}

export type ActivitySeverity = 'neutral' | 'positive' | 'warning' | 'negative';

export interface ActivityLogEntry {
  id: number;
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
  severity: ActivitySeverity;
}

export type UploadReviewStatus = 'pending' | 'approved' | 'rejected';
export type UploadCategory = 'Fish Observation' | 'Water Quality';

export interface UploadReviewItem {
  id: string;
  type: 'fish' | 'water';
  /** Fish observation id, or single (non-batch) water quality reading id. */
  refId?: number;
  /** Present for bulk water-quality uploads — groups many readings reviewed as one unit. */
  batchId?: string;
  researcher: string;
  category: UploadCategory;
  title: string;
  location: string;
  submittedDate: string;
  status: UploadReviewStatus;
  reviewNote?: string | undefined;
  /** Present only for bulk Water Quality batch uploads — one entry per submitted reading. */
  rows?: WaterQualityUploadRow[] | undefined;
  /**
   * Water Quality only — parameter values outside their expected range,
   * e.g. a pH reading of 25. Flags likely data-entry or sensor errors for
   * the admin to look at before approving; never blocks the submission
   * automatically. Absent (not empty) for Fish Observation items, where the
   * concept doesn't apply.
   */
  warnings?: string[] | undefined;
}

// ── Backend shapes (from geo-ranao-api) ──
interface BackendUser {
  id: number;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'RESEARCHER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  affiliation: string;
  departmentRole?: string;
  purposeOfRequest: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  reviewNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapAccountStatus(status: BackendUser['status']): AccountStatus {
  switch (status) {
    case 'APPROVED':
      return 'verified';
    case 'SUSPENDED':
      return 'suspended';
    case 'REJECTED':
      return 'rejected';
    default:
      return 'pending';
  }
}

function mapAccount(u: BackendUser): ResearcherAccount {
  const account: ResearcherAccount = {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    affiliation: u.affiliation,
    departmentRole: u.departmentRole ?? '',
    purposeOfRequest: u.purposeOfRequest,
    status: mapAccountStatus(u.status),
    submittedDate: u.createdAt.slice(0, 10),
  };
  if (u.reviewedAt) account.reviewedDate = u.reviewedAt.slice(0, 10);
  if (u.reviewNote) account.reviewNote = u.reviewNote;
  return account;
}

function mapReviewStatus(status: 'PENDING' | 'APPROVED' | 'REJECTED'): UploadReviewStatus {
  if (status === 'APPROVED') return 'approved';
  if (status === 'REJECTED') return 'rejected';
  return 'pending';
}

function extractParamValues(r: WaterQualityReading): Partial<Record<string, number>> {
  const values: Partial<Record<string, number>> = {};
  for (const param of allWaterQualityParams) {
    const value = r[param.key as keyof WaterQualityReading];
    if (typeof value === 'number') values[param.key] = value;
  }
  return values;
}

function readingToRow(r: WaterQualityReading): WaterQualityUploadRow {
  const values = extractParamValues(r);
  return {
    siteId: r.siteId,
    date: r.dateObserved,
    depthM: r.depthM,
    values,
    notes: r.notes ?? undefined,
    warnings: getReadingWarnings(values),
  };
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string | string[] } | undefined;
    const msg = data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

let nextLogId = 1000;

export const useAdminStore = defineStore('admin', () => {

  const researcherAccounts = ref<ResearcherAccount[]>([]);
  const accountsLoading = ref(false);

  const activityLogs = ref<ActivityLogEntry[]>([]);
  const activityLogsLoading = ref(false);

  const uploadReviews = ref<UploadReviewItem[]>([]);
  const uploadReviewsLoading = ref(false);

  async function fetchAccounts() {
    accountsLoading.value = true;
    try {
      const { data } = await api.get<BackendUser[]>('/users');
      researcherAccounts.value = data.map(mapAccount);
    } finally {
      accountsLoading.value = false;
    }
  }

  async function fetchActivityLogs() {
    activityLogsLoading.value = true;
    try {
      const { data } = await api.get<ActivityLogEntry[]>('/activity-logs');
      activityLogs.value = data;
    } finally {
      activityLogsLoading.value = false;
    }
  }

  // researcherAccounts only lists RESEARCHER-role users — falls back to a
  // placeholder for the rare case an ADMIN account submitted its own data.
  function researcherName(researcherId: number): string {
    return researcherAccounts.value.find((a) => a.id === researcherId)?.fullName ?? `Researcher #${researcherId}`;
  }

  function fishToItem(f: FishObservation): UploadReviewItem {
    const location =
      f.latitude != null && f.longitude != null
        ? `${f.latitude}, ${f.longitude}`
        : f.municipal || 'Lake Lanao';
    const item: UploadReviewItem = {
      id: `fish-${f.id}`,
      type: 'fish',
      refId: f.id,
      researcher: researcherName(f.researcherId),
      category: 'Fish Observation',
      title: f.speciesCommon || f.speciesScientific || `${f.category} observation`,
      location,
      submittedDate: f.createdAt.slice(0, 10),
      status: mapReviewStatus(f.reviewStatus),
    };
    if (f.reviewNote) item.reviewNote = f.reviewNote;
    return item;
  }

  function waterSingleToItem(r: WaterQualityReading): UploadReviewItem {
    const warnings = getReadingWarnings(extractParamValues(r));
    const item: UploadReviewItem = {
      id: `water-${r.id}`,
      type: 'water',
      refId: r.id,
      researcher: researcherName(r.researcherId),
      category: 'Water Quality',
      title: `Station ${r.siteId} — Water Quality Reading`,
      location: r.siteId,
      submittedDate: r.createdAt.slice(0, 10),
      status: mapReviewStatus(r.reviewStatus),
    };
    if (r.reviewNote) item.reviewNote = r.reviewNote;
    if (warnings.length) item.warnings = warnings;
    return item;
  }

  function waterBatchToItem(batchId: string, rows: WaterQualityReading[]): UploadReviewItem {
    const uniqueSites = [...new Set(rows.map((r) => r.siteId))];
    const first = rows[0]!;
    const rowsWithWarnings = rows.map(readingToRow);
    const warnings = rowsWithWarnings.flatMap((row, i) =>
      row.warnings.map((w) => `Row ${i + 1} (${row.siteId}): ${w}`),
    );
    const item: UploadReviewItem = {
      id: `water-batch-${batchId}`,
      type: 'water',
      batchId,
      researcher: researcherName(first.researcherId),
      category: 'Water Quality',
      title: `Bulk Water Quality Upload — ${rows.length} reading${rows.length === 1 ? '' : 's'} (${uniqueSites.length} site${uniqueSites.length === 1 ? '' : 's'})`,
      location:
        uniqueSites.slice(0, 3).join(', ') + (uniqueSites.length > 3 ? ` +${uniqueSites.length - 3} more` : ''),
      submittedDate: first.createdAt.slice(0, 10),
      status: mapReviewStatus(first.reviewStatus),
      rows: rowsWithWarnings,
    };
    if (first.reviewNote) item.reviewNote = first.reviewNote;
    if (warnings.length) item.warnings = warnings;
    return item;
  }

  // Fish/water submissions are keyed to a researcher's *name*, so account
  // names must be loaded first — fetchAccounts() is safe to call repeatedly
  // (cheap) and keeps this self-sufficient regardless of call order.
  async function fetchUploadReviews() {
    uploadReviewsLoading.value = true;
    try {
      if (researcherAccounts.value.length === 0) await fetchAccounts();

      const [fishRows, waterRows] = await Promise.all([fetchFishObservations(), fetchWaterQualityReadings()]);

      const fishItems = fishRows.map(fishToItem);

      const batches = new Map<string, WaterQualityReading[]>();
      const singleItems: UploadReviewItem[] = [];
      for (const r of waterRows) {
        if (r.batchId) {
          const bucket = batches.get(r.batchId);
          if (bucket) bucket.push(r);
          else batches.set(r.batchId, [r]);
        } else {
          singleItems.push(waterSingleToItem(r));
        }
      }
      const batchItems = [...batches.entries()].map(([batchId, rows]) => waterBatchToItem(batchId, rows));

      uploadReviews.value = [...fishItems, ...singleItems, ...batchItems].sort((a, b) =>
        b.submittedDate.localeCompare(a.submittedDate),
      );
    } finally {
      uploadReviewsLoading.value = false;
    }
  }

  // Local-only log entry — used for actions that don't have a backend
  // endpoint yet (report generation, map downloads). Persisted actions
  // (approve/reject/revoke/...) get their log entry from the server via
  // fetchActivityLogs() instead, so it survives a page refresh.
  function logActivity(actor: string, action: string, detail: string, severity: ActivitySeverity = 'neutral') {
    activityLogs.value.unshift({
      id: nextLogId++,
      timestamp: new Date().toISOString(),
      actor,
      action,
      detail,
      severity,
    });
  }

  async function approveAccount(id: number) {
    try {
      await api.patch(`/users/${id}/approve`);
      await Promise.all([fetchAccounts(), fetchActivityLogs()]);
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to approve account.'));
    }
  }

  async function rejectAccount(id: number, reason?: string) {
    try {
      await api.patch(`/users/${id}/reject`, { reason });
      await Promise.all([fetchAccounts(), fetchActivityLogs()]);
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to reject account.'));
    }
  }

  async function revokeAccount(id: number, reason?: string) {
    try {
      await api.patch(`/users/${id}/revoke`, { reason });
      await Promise.all([fetchAccounts(), fetchActivityLogs()]);
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to revoke account.'));
    }
  }

  // Brings a suspended account back to verified — the counterpart to
  // revokeAccount, so a revoke isn't a permanent dead end short of deletion.
  async function reinstateAccount(id: number) {
    try {
      await api.patch(`/users/${id}/reinstate`);
      await Promise.all([fetchAccounts(), fetchActivityLogs()]);
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to reinstate account.'));
    }
  }

  async function deleteAccount(id: number, reason?: string) {
    try {
      await api.delete(`/users/${id}`, { data: { reason } });
      await Promise.all([fetchAccounts(), fetchActivityLogs()]);
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Failed to delete account.'));
    }
  }

  async function reviewUpload(item: UploadReviewItem, status: 'approved' | 'rejected', note?: string) {
    try {
      if (item.type === 'fish') {
        if (status === 'approved') await approveFishObservation(item.refId!);
        else await rejectFishObservation(item.refId!, note);
      } else if (item.batchId) {
        if (status === 'approved') await approveWaterQualityBatch(item.batchId);
        else await rejectWaterQualityBatch(item.batchId, note);
      } else {
        if (status === 'approved') await approveWaterQualityReading(item.refId!);
        else await rejectWaterQualityReading(item.refId!, note);
      }
      await Promise.all([fetchUploadReviews(), fetchActivityLogs()]);
    } catch (err) {
      throw new Error(extractErrorMessage(err, `Failed to ${status} upload.`));
    }
  }

  function recordReportGenerated(actor: string, reportLabel: string) {
    logActivity(actor, 'Generated Report', reportLabel);
  }

  function recordMapDownload(actor: string, mapLabel: string) {
    logActivity(actor, 'Downloaded Map', mapLabel);
  }

  return {
    researcherAccounts,
    accountsLoading,
    uploadReviews,
    uploadReviewsLoading,
    activityLogs,
    activityLogsLoading,
    fetchAccounts,
    fetchActivityLogs,
    fetchUploadReviews,
    logActivity,
    approveAccount,
    rejectAccount,
    revokeAccount,
    reinstateAccount,
    deleteAccount,
    reviewUpload,
    recordReportGenerated,
    recordMapDownload,
  };
});
