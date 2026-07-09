import { defineStore } from 'pinia';
import { ref } from 'vue';

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
  id: number;
  researcher: string;
  category: UploadCategory;
  title: string;
  location: string;
  submittedDate: string;
  status: UploadReviewStatus;
  reviewNote?: string | undefined;
}

let nextAccountId = 1000;
let nextLogId = 1000;
let nextUploadId = 1000;

export const useAdminStore = defineStore('admin', () => {
  const researcherAccounts = ref<ResearcherAccount[]>([
    {
      id: 1,
      fullName: 'Jollymar A. Mark',
      email: 'jollymar.mark@msumain.edu.ph',
      affiliation: 'Academic Researcher',
      departmentRole: 'Research Assistant',
      purposeOfRequest: 'Tracking endemic fish population decline across Lake Lanao sampling sites.',
      status: 'verified',
      submittedDate: '2025-02-10',
      reviewedDate: '2025-02-12',
    },
    {
      id: 2,
      fullName: 'Dr. Juan Dela Cruz',
      email: 'juan.delacruz@msumain.edu.ph',
      affiliation: 'Academic Researcher',
      departmentRole: 'Associate Professor',
      purposeOfRequest: 'Long-term water quality monitoring and trend analysis for the lake.',
      status: 'verified',
      submittedDate: '2025-01-05',
      reviewedDate: '2025-01-08',
    },
    {
      id: 3,
      fullName: 'Maria S. Santos',
      email: 'maria.santos@lgu-lanao.gov.ph',
      affiliation: 'LGU Researcher',
      departmentRole: 'Environmental Officer',
      purposeOfRequest: 'Monitoring invasive species spread for local fisheries management.',
      status: 'verified',
      submittedDate: '2025-03-01',
      reviewedDate: '2025-03-03',
    },
    {
      id: 4,
      fullName: 'Angelo R. Bautista',
      email: 'angelo.bautista@gmail.com',
      affiliation: 'Student Researcher',
      departmentRole: '',
      purposeOfRequest:
        'Assessing correlation between water turbidity and fish biodiversity for undergraduate thesis research.',
      status: 'pending',
      submittedDate: '2026-07-05',
    },
    {
      id: 5,
      fullName: 'Dr. Amina T. Macarambon',
      email: 'amina.macarambon@msumain.edu.ph',
      affiliation: 'Academic Researcher',
      departmentRole: 'Senior Lecturer',
      purposeOfRequest: 'Studying climate change impact on Lake Lanao thermal stratification.',
      status: 'pending',
      submittedDate: '2026-07-07',
    },
    {
      id: 6,
      fullName: 'Ricardo D. Villanueva',
      email: 'ricardo.villanueva@privateresearch.ph',
      affiliation: 'Private Researcher',
      departmentRole: 'Independent Consultant',
      purposeOfRequest: 'Commercial fisheries feasibility study.',
      status: 'suspended',
      submittedDate: '2025-04-01',
      reviewedDate: '2025-04-05',
      reviewNote: 'Repeated submission of unverifiable data sources.',
    },
  ]);

  const uploadReviews = ref<UploadReviewItem[]>([
    {
      id: 1,
      researcher: 'Jollymar A. Mark',
      category: 'Fish Observation',
      title: 'Pait (Puntius sirang)',
      location: '7.9900, 124.0500',
      submittedDate: '2025-05-12',
      status: 'approved',
    },
    {
      id: 2,
      researcher: 'Jollymar A. Mark',
      category: 'Fish Observation',
      title: 'Banak (Puntius lanaoensis)',
      location: '7.9500, 124.0200',
      submittedDate: '2025-06-01',
      status: 'pending',
    },
    {
      id: 3,
      researcher: 'Dr. Juan Dela Cruz',
      category: 'Fish Observation',
      title: 'Igat (Anguilla marmorata)',
      location: '8.0200, 124.0800',
      submittedDate: '2025-04-28',
      status: 'approved',
    },
    {
      id: 4,
      researcher: 'Dr. Juan Dela Cruz',
      category: 'Water Quality',
      title: 'Station WQ-07 — Dissolved Oxygen Reading',
      location: '8.0000, 124.0450',
      submittedDate: '2025-06-20',
      status: 'pending',
    },
    {
      id: 5,
      researcher: 'Maria S. Santos',
      category: 'Fish Observation',
      title: 'Nile Tilapia (Oreochromis niloticus)',
      location: '8.0000, 124.0400',
      submittedDate: '2025-06-10',
      status: 'rejected',
      reviewNote: 'Missing photo evidence for invasive species claim.',
    },
    {
      id: 6,
      researcher: 'Maria S. Santos',
      category: 'Water Quality',
      title: 'Station WQ-12 — Turbidity Reading',
      location: '8.0100, 124.0900',
      submittedDate: '2025-06-22',
      status: 'pending',
    },
  ]);

  const activityLogs = ref<ActivityLogEntry[]>([
    {
      id: 1,
      timestamp: '2026-07-07T09:14:00',
      actor: 'Dr. Amina T. Macarambon',
      action: 'Submitted Application',
      detail: 'Applied as Academic Researcher',
      severity: 'neutral',
    },
    {
      id: 2,
      timestamp: '2026-07-05T14:02:00',
      actor: 'Angelo R. Bautista',
      action: 'Submitted Application',
      detail: 'Applied as Student Researcher',
      severity: 'neutral',
    },
    {
      id: 3,
      timestamp: '2025-06-22T11:40:00',
      actor: 'Maria S. Santos',
      action: 'Uploaded Water Quality Data',
      detail: 'Station WQ-12 — Turbidity Reading',
      severity: 'neutral',
    },
    {
      id: 4,
      timestamp: '2025-06-20T08:15:00',
      actor: 'Dr. Juan Dela Cruz',
      action: 'Uploaded Water Quality Data',
      detail: 'Station WQ-07 — Dissolved Oxygen Reading',
      severity: 'neutral',
    },
    {
      id: 5,
      timestamp: '2025-04-05T10:30:00',
      actor: 'Admin',
      action: 'Account Revoked',
      detail: 'Revoked Ricardo D. Villanueva — Repeated submission of unverifiable data sources.',
      severity: 'warning',
    },
  ]);

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

  function submitApplication(data: {
    fullName: string;
    email: string;
    affiliation: string;
    departmentRole: string;
    purposeOfRequest: string;
  }) {
    const account: ResearcherAccount = {
      id: nextAccountId++,
      ...data,
      status: 'pending',
      submittedDate: new Date().toISOString().slice(0, 10),
    };
    researcherAccounts.value.unshift(account);
    logActivity(data.fullName, 'Submitted Application', `Applied as ${data.affiliation}`);
    return account.id;
  }

  function approveAccount(id: number) {
    const acc = researcherAccounts.value.find((a) => a.id === id);
    if (!acc) return;
    acc.status = 'verified';
    acc.reviewedDate = new Date().toISOString().slice(0, 10);
    acc.reviewNote = undefined;
    logActivity('Admin', 'Account Approved', `Approved ${acc.fullName} (${acc.email})`, 'positive');
  }

  function rejectAccount(id: number, reason?: string) {
    const acc = researcherAccounts.value.find((a) => a.id === id);
    if (!acc) return;
    acc.status = 'rejected';
    acc.reviewedDate = new Date().toISOString().slice(0, 10);
    acc.reviewNote = reason || undefined;
    logActivity(
      'Admin',
      'Account Rejected',
      `Rejected ${acc.fullName}${reason ? ` — ${reason}` : ''}`,
      'negative',
    );
  }

  function revokeAccount(id: number, reason?: string) {
    const acc = researcherAccounts.value.find((a) => a.id === id);
    if (!acc) return;
    acc.status = 'suspended';
    acc.reviewedDate = new Date().toISOString().slice(0, 10);
    acc.reviewNote = reason || undefined;
    logActivity(
      'Admin',
      'Account Revoked',
      `Revoked ${acc.fullName}${reason ? ` — ${reason}` : ''}`,
      'warning',
    );
  }

  function deleteAccount(id: number) {
    const acc = researcherAccounts.value.find((a) => a.id === id);
    if (!acc) return;
    researcherAccounts.value = researcherAccounts.value.filter((a) => a.id !== id);
    logActivity('Admin', 'Account Deleted', `Deleted account for ${acc.fullName} (${acc.email})`, 'negative');
  }

  function recordUpload(researcher: string, category: UploadCategory, title: string, location: string) {
    const item: UploadReviewItem = {
      id: nextUploadId++,
      researcher,
      category,
      title,
      location,
      submittedDate: new Date().toISOString().slice(0, 10),
      status: 'pending',
    };
    uploadReviews.value.unshift(item);
    logActivity(
      researcher,
      category === 'Fish Observation' ? 'Uploaded Fish Observation' : 'Uploaded Water Quality Data',
      title,
    );
    return item.id;
  }

  function reviewUpload(id: number, status: 'approved' | 'rejected', note?: string) {
    const item = uploadReviews.value.find((u) => u.id === id);
    if (!item) return;
    item.status = status;
    item.reviewNote = note || undefined;
    logActivity(
      'Admin',
      status === 'approved' ? 'Upload Approved' : 'Upload Rejected',
      `${item.title}${note ? ` — ${note}` : ''}`,
      status === 'approved' ? 'positive' : 'negative',
    );
  }

  function recordReportGenerated(actor: string, reportLabel: string) {
    logActivity(actor, 'Generated Report', reportLabel);
  }

  function recordMapDownload(actor: string, mapLabel: string) {
    logActivity(actor, 'Downloaded Map', mapLabel);
  }

  return {
    researcherAccounts,
    uploadReviews,
    activityLogs,
    logActivity,
    submitApplication,
    approveAccount,
    rejectAccount,
    revokeAccount,
    deleteAccount,
    recordUpload,
    reviewUpload,
    recordReportGenerated,
    recordMapDownload,
  };
});
