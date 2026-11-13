'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Candidate, 
  CandidateFilters, 
  PipelineStage, 
  getPipelineStageMeta 
} from '@/types/candidate';
import { 
  getCandidatesList, 
  updateCandidateStageAndNotesRecord 
} from '@/lib/candidate-store';
import * as XLSX from 'xlsx';
import { 
  getCurrentHrUser, 
  useCurrentHrUser,
  signOutHrRecruiter, 
  isEmailAuthorizedForHr, 
  RecruiterRole,
  canAccessCandidatePipeline,
  canAccessHireRequests,
  canManageRolesAndTech,
  canManageAdminUsers,
  canManageSeo,
  canExportCandidateData,
  getRoleBadgeInfo,
  updateHrUserSession
} from '@/lib/auth/recruiter-auth';
import { Navbar } from '@/components/Navbar';
import { CandidateCard } from '@/components/CandidateCard';
import { CandidateTable } from '@/components/CandidateTable';
import { CandidateDetailDrawer } from '@/components/CandidateDetailDrawer';
import { 
  Users, 
  Search, 
  LayoutGrid, 
  Table as TableIcon, 
  Video, 
  Clock, 
  Cpu, 
  Download, 
  Plus, 
  FileText, 
  Shield, 
  Smartphone, 
  LogOut, 
  Lock,
  KeyRound,
  Briefcase,
  FileSpreadsheet,
  AlertTriangle,
  X,
  ShieldCheck,
  ChevronDown,
  Globe,
  Cloud,
  UploadCloud,
  CheckCircle2,
  RefreshCw,
  Settings
} from 'lucide-react';

function AdminDashboardContent() {
  const router = useRouter();
  const hrUser = useCurrentHrUser();
  const isAuthorized = Boolean(hrUser && hrUser.email && canAccessCandidatePipeline(hrUser.role));
  const [rawCandidates, setRawCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveSupabase, setIsLiveSupabase] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'kanban'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // DigitalOcean Spaces Resume Storage & Migration State
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [isMigratingResumes, setIsMigratingResumes] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [migrationError, setMigrationError] = useState<string | null>(null);

  const [storageConfig, setStorageConfig] = useState({
    endpoint: 'https://nyc3.digitaloceanspaces.com',
    region: 'nyc3',
    bucket: 'talent-pulse-storage',
    accessKey: '',
    secretKey: '',
  });
  const [isConfiguredSpaces, setIsConfiguredSpaces] = useState(false);
  const [storedStorageMeta, setStoredStorageMeta] = useState<{
    accessKeyMasked?: string;
    hasAccessKey?: boolean;
    hasSecretKey?: boolean;
  }>({});
  const [isLoadingStorageConfig, setIsLoadingStorageConfig] = useState(false);
  const [isSavingStorageConfig, setIsSavingStorageConfig] = useState(false);
  const [configFeedback, setConfigFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters State
  const [filters, setFilters] = useState<CandidateFilters>({
    searchQuery: '',
    primaryRole: 'all',
    targetRegion: 'all',
    availabilityStatus: 'all',
    pipelineStage: 'all',
    hasVideoPitch: 'all',
    hasResume: 'all',
    englishProficiency: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const searchParams = useSearchParams();
  const [isNoticeDismissed, setIsNoticeDismissed] = useState(false);
  const unauth = searchParams.get('unauthorized');
  const unauthorizedNotice = isNoticeDismissed ? null : (
    unauth === 'hire-requests'
      ? 'Access Restricted: HR Executives are authorized to manage candidate pipelines, export candidate records as Excel (.xlsx), and administer Roles & Technologies, but are not permitted to access Customer Hire Requests.'
      : unauth === 'roles'
      ? 'Access Restricted: Sales Executives are authorized to view and update candidate pipelines and customer hire requests, but are not permitted to configure Roles & Technologies.'
      : unauth === 'users'
      ? 'Access Restricted: Team clearance and administrator provisioning is restricted strictly to Administrators.'
      : null
  );

  const handleSwitchSimulatedRole = (newRole: RecruiterRole) => {
    if (!hrUser) return;
    updateHrUserSession({ role: newRole });
  };

  // 1. Strict Auth Verification Gate: Redirect if unauthenticated or must change password
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!hrUser) {
      router.replace('/admin/login?redirect=/admin/dashboard');
    } else if (!canAccessCandidatePipeline(hrUser.role)) {
      router.replace('/admin/login?unauthorized=true');
    } else if (hrUser?.must_change_password) {
      router.replace(`/admin/change-password?email=${encodeURIComponent(hrUser.email)}&first_login=true`);
    }
  }, [hrUser, router]);

  // 2. Fetch all candidates once upon authentication or manual refresh
  const reloadCandidates = async () => {
    if (!isAuthorized) return;
    setIsLoading(true);
    try {
      const { candidates: data, isLiveSupabase: live } = await getCandidatesList();
      setRawCandidates(data);
      setIsLiveSupabase(live);
      setSelectedCandidate((prev) => (prev ? data.find((c) => c.id === prev.id) || prev : null));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunMigration = async () => {
    setIsMigratingResumes(true);
    setMigrationError(null);
    setMigrationResult(null);
    try {
      const { getAdminAuthHeaders } = await import('@/lib/auth/recruiter-auth');
      const res = await fetch('/api/admin/migrate-resumes', {
        method: 'POST',
        headers: { ...getAdminAuthHeaders() },
      });
      const data = await res.json();
      if (res.ok) {
        setMigrationResult(data);
        await reloadCandidates();
      } else {
        setMigrationError(data.error || 'Failed to execute migration');
      }
    } catch (err: any) {
      setMigrationError(err.message || 'Migration network error');
    } finally {
      setIsMigratingResumes(false);
    }
  };

  const fetchStorageConfig = async () => {
    setIsLoadingStorageConfig(true);
    try {
      const { getAdminAuthHeaders } = await import('@/lib/auth/recruiter-auth');
      const res = await fetch('/api/admin/storage-config', {
        headers: { ...getAdminAuthHeaders() },
      });
      if (res.ok) {
        const data = await res.json();
        setIsConfiguredSpaces(data.isConfigured);
        if (data.config) {
          setStorageConfig(prev => ({
            ...prev,
            endpoint: data.config.endpoint || prev.endpoint,
            region: data.config.region || prev.region,
            bucket: data.config.bucket || prev.bucket,
            accessKey: '', // Kept empty so user can leave blank to retain active key
            secretKey: '', // Kept empty so user can leave blank to retain active secret
          }));
          setStoredStorageMeta({
            accessKeyMasked: data.config.accessKeyMasked || '',
            hasAccessKey: Boolean(data.config.hasAccessKey),
            hasSecretKey: Boolean(data.config.hasSecretKey),
          });
        }
      }
    } catch (err) {
      console.warn('Failed loading storage config:', err);
    } finally {
      setIsLoadingStorageConfig(false);
    }
  };

  const handleSaveStorageConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingStorageConfig(true);
    setConfigFeedback(null);
    try {
      const { getAdminAuthHeaders } = await import('@/lib/auth/recruiter-auth');
      const res = await fetch('/api/admin/storage-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify(storageConfig),
      });
      const data = await res.json();
      if (data.success && data.testResult?.success) {
        setConfigFeedback({
          type: 'success',
          message: data.testResult.message || 'Connected & configuration saved successfully!',
        });
        setIsConfiguredSpaces(true);
        // Refresh masked state and reset input buffers
        await fetchStorageConfig();
      } else if (data.success) {
        setConfigFeedback({
          type: 'error',
          message: `Connection test failed — credentials were not saved: ${data.testResult?.message || 'Bucket unreachable'}`,
        });
        setIsConfiguredSpaces(data.isConfigured || false);
      } else {
        setConfigFeedback({
          type: 'error',
          message: data.error || 'Failed saving configuration',
        });
      }
    } catch (err: any) {
      setConfigFeedback({
        type: 'error',
        message: err.message || 'Network error while contacting storage config API',
      });
    } finally {
      setIsSavingStorageConfig(false);
    }
  };


  useEffect(() => {
    const handleResizeError = (e: ErrorEvent) => {
      if (e.message?.includes('ResizeObserver')) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    };
    window.addEventListener('error', handleResizeError);
    return () => window.removeEventListener('error', handleResizeError);
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    let isCancelled = false;

    getCandidatesList()
      .then(({ candidates: data, isLiveSupabase: live }) => {
        if (!isCancelled) {
          setRawCandidates(data);
          setIsLiveSupabase(live);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error(err);
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isAuthorized]);

  // 3. Instantaneous in-memory filtering (0ms latency, no server thrashing on keystrokes)
  const candidates = useMemo(() => {
    let list = [...rawCandidates];

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase().trim();
      list = list.filter((c) =>
        c.full_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone_number?.toLowerCase().includes(q) ||
        c.written_pitch?.toLowerCase().includes(q) ||
        c.tech_stack?.some((t) => t.toLowerCase().includes(q)) ||
        c.internal_notes?.toLowerCase().includes(q)
      );
    }

    if (filters.primaryRole && filters.primaryRole !== 'all') {
      list = list.filter((c) => c.primary_role === filters.primaryRole);
    }

    if (filters.targetRegion && filters.targetRegion !== 'all') {
      list = list.filter((c) => c.target_timezones?.includes(filters.targetRegion as any));
    }

    if (filters.availabilityStatus && filters.availabilityStatus !== 'all') {
      list = list.filter((c) => c.availability_status === filters.availabilityStatus);
    }

    if (filters.pipelineStage && filters.pipelineStage !== 'all') {
      list = list.filter((c) => c.pipeline_stage === filters.pipelineStage);
    }

    if (filters.englishProficiency && filters.englishProficiency !== 'all') {
      list = list.filter((c) => c.english_proficiency === filters.englishProficiency);
    }

    if (filters.hasVideoPitch === 'yes') {
      list = list.filter((c) => Boolean(c.video_pitch_url && c.video_pitch_url.trim().length > 0));
    } else if (filters.hasVideoPitch === 'no') {
      list = list.filter((c) => !c.video_pitch_url || c.video_pitch_url.trim().length === 0);
    }

    if (filters.hasResume === 'yes') {
      list = list.filter((c) => Boolean(c.resume_url && c.resume_url.trim().length > 0));
    } else if (filters.hasResume === 'no') {
      list = list.filter((c) => !c.resume_url || c.resume_url.trim().length === 0);
    }

    // Sort
    const sortBy = filters.sortBy || 'created_at';
    const isAsc = filters.sortOrder === 'asc';
    list.sort((a, b) => {
      let valA = (a as any)[sortBy];
      let valB = (b as any)[sortBy];

      if (sortBy === 'created_at') {
        valA = new Date(valA || 0).getTime();
        valB = new Date(valB || 0).getTime();
      }

      if (valA < valB) return isAsc ? -1 : 1;
      if (valA > valB) return isAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [rawCandidates, filters]);

  // Pagination parameters: 20 records per page for both Table and Card views
  const PAGE_SIZE = 20;
  const totalCandidates = candidates.length;
  const totalPages = Math.max(1, Math.ceil(totalCandidates / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;

  // Reset pagination to page 1 whenever any filter changes (render-time adjustment)
  const [prevFilters, setPrevFilters] = useState(filters);
  if (prevFilters !== filters) {
    setPrevFilters(filters);
    setCurrentPage(1);
  }

  const paginatedCandidates = useMemo(() => {
    return candidates.slice(startIndex, startIndex + PAGE_SIZE);
  }, [candidates, startIndex]);

  const renderPagination = () => {
    if (totalCandidates === 0) return null;

    const startRecord = startIndex + 1;
    const endRecord = Math.min(startIndex + PAGE_SIZE, totalCandidates);

    // Build page numbers array with intelligent ellipsis
    const pageItems: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pageItems.push(i);
    } else {
      pageItems.push(1);
      if (safeCurrentPage > 3) {
        pageItems.push('ellipsis-start');
      }
      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalPages - 1, safeCurrentPage + 1);
      for (let i = start; i <= end; i++) {
        pageItems.push(i);
      }
      if (safeCurrentPage < totalPages - 2) {
        pageItems.push('ellipsis-end');
      }
      pageItems.push(totalPages);
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border-2 border-[#111113] shadow-[4px_4px_0px_0px_#111113] font-mono text-xs">
        <div className="text-[#111113]/80 font-medium">
          Showing <span className="font-bold text-[#FF4D00]">[{startRecord}–{endRecord}]</span> of{' '}
          <span className="font-bold text-[#111113]">{totalCandidates}</span> dossiers{' '}
          <span className="text-[#111113]/50 text-[11px]">(20 per page)</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safeCurrentPage === 1}
            className="px-3 py-1.5 border-2 border-[#111113] uppercase font-bold text-xs bg-white text-[#111113] hover:bg-[#111113] hover:text-[#F8F7F4] transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#111113]"
            title="Previous page"
          >
            ← Prev
          </button>

          {pageItems.map((item, idx) => {
            if (typeof item === 'string') {
              return (
                <span key={`item-${idx}`} className="px-2 py-1 text-[#111113]/50 select-none">
                  …
                </span>
              );
            }
            const isCurrent = item === safeCurrentPage;
            return (
              <button
                key={`page-${item}`}
                type="button"
                onClick={() => setCurrentPage(item)}
                className={`min-w-[32px] py-1.5 px-2.5 border-2 border-[#111113] font-bold text-xs transition ${
                  isCurrent
                    ? 'bg-[#111113] text-[#F8F7F4] shadow-[2px_2px_0px_0px_#FF4D00]'
                    : 'bg-white text-[#111113] hover:bg-[#F8F7F4]'
                }`}
                title={`Go to page ${item}`}
              >
                {item}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage === totalPages}
            className="px-3 py-1.5 border-2 border-[#111113] uppercase font-bold text-xs bg-white text-[#111113] hover:bg-[#111113] hover:text-[#F8F7F4] transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#111113]"
            title="Next page"
          >
            Next →
          </button>
        </div>
      </div>
    );
  };

  // KPI Analytics Header Calculations (from raw pool)
  const kpis = useMemo(() => {
    const total = rawCandidates.length;
    const availableNow = rawCandidates.filter((c) => c.availability_status === 'available_now').length;
    const withVideo = rawCandidates.filter((c) => Boolean(c.video_pitch_url && c.video_pitch_url.trim().length > 0)).length;
    const withResume = rawCandidates.filter((c) => Boolean(c.resume_url && c.resume_url.trim().length > 0)).length;
    const aiEngineers = rawCandidates.filter((c) => c.primary_role === 'ai_engineer').length;
    const mobileAndArchs = rawCandidates.filter((c) => c.primary_role === 'mobile_app_developer' || c.primary_role === 'solutions_architect').length;

    return { total, availableNow, withVideo, withResume, aiEngineers, mobileAndArchs };
  }, [rawCandidates]);

  // Stage change handler
  const handleStageChange = async (id: string, stage: PipelineStage, notes: string) => {
    await updateCandidateStageAndNotesRecord(id, stage, notes);
    setRawCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pipeline_stage: stage, internal_notes: notes, updated_at: new Date().toISOString() } : c))
    );
    if (selectedCandidate && selectedCandidate.id === id) {
      setSelectedCandidate((prev) => prev ? { ...prev, pipeline_stage: stage, internal_notes: notes } : null);
    }
  };

  // Sort change handler
  const handleSortChange = (column: any) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
  };


  const handleSignOut = async () => {
    await signOutHrRecruiter();
    router.push('/admin/login');
  };

  // Bulk Candidate Export: Native XLSX Excel Spreadsheet
  const handleExportXLSX = () => {
    if (!canExportCandidateData(hrUser?.role)) {
      alert('Permission Restricted: Sales Executives are not authorized to download or export candidate data.');
      return;
    }

    const dataToExport = candidates.map((c) => ({
      'Candidate ID': c.id,
      'Full Name': c.full_name,
      'Email Address': c.email,
      'Phone Number': c.phone_number || 'N/A',
      'Primary Track / Role': c.primary_role,
      'Pipeline Stage': c.pipeline_stage,
      'Availability Status': c.availability_status,
      'English Proficiency': c.english_proficiency,
      'US Overlap Hours': c.overlap_hours_per_day,
      'Available From': c.available_from || 'Immediate',
      'Home Timezone': c.home_timezone || 'N/A',
      'Target Timezones': Array.isArray(c.target_timezones) ? c.target_timezones.join(', ') : '',
      'Technical Stack': Array.isArray(c.tech_stack) ? c.tech_stack.join(', ') : '',
      'Written Pitch': c.written_pitch || '',
      'Resume Filename': c.resume_filename || '',
      'Video Pitch URL': c.video_pitch_url || '',
      'Internal Recruiter Notes': c.internal_notes || '',
      'Applied Date': c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : '',
      'Last Updated': c.updated_at ? new Date(c.updated_at).toISOString().split('T')[0] : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Auto-size columns for high readability
    worksheet['!cols'] = [
      { wch: 16 }, // ID
      { wch: 24 }, // Full Name
      { wch: 28 }, // Email
      { wch: 18 }, // Phone
      { wch: 25 }, // Role
      { wch: 16 }, // Stage
      { wch: 18 }, // Availability
      { wch: 18 }, // English
      { wch: 16 }, // Overlap
      { wch: 14 }, // Exp
      { wch: 24 }, // Timezones
      { wch: 35 }, // Tech Stack
      { wch: 40 }, // Pitch
      { wch: 25 }, // Resume
      { wch: 30 }, // Video
      { wch: 35 }, // Notes
      { wch: 15 }, // Applied Date
      { wch: 15 }, // Last Updated
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidates Pipeline');
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `talentpulse_candidates_${dateStr}.xlsx`);
  };

  // Export CSV (Fallback / Alternative for Admins)
  const handleExportCSV = () => {
    if (!canExportCandidateData(hrUser?.role)) {
      alert('Permission Restricted: Sales Executives are not authorized to download or export candidate data.');
      return;
    }

    const headers = ['Full Name', 'Email', 'Phone', 'Role', 'Status', 'Overlap Hours', 'Stage', 'Resume File', 'Video Pitch URL'];
    const rows = candidates.map(c => [
      `"${c.full_name}"`,
      `"${c.email}"`,
      `"${c.phone_number || ''}"`,
      `"${c.primary_role}"`,
      `"${c.availability_status}"`,
      c.overlap_hours_per_day,
      `"${c.pipeline_stage}"`,
      `"${c.resume_filename || ''}"`,
      `"${c.video_pitch_url || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `talentpulse_candidates_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const kanbanStages: PipelineStage[] = ['new', 'vetted', 'interviewing', 'assigned', 'on_hold'];

  // Render loading while verifying session
  if (!hrUser) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-[#111113] border-t-[#FF4D00] animate-spin mb-4" />
        <span className="font-mono text-xs uppercase tracking-widest text-[#111113]/70">
          Loading Admin Pipeline...
        </span>
      </div>
    );
  }

  // Render blocked gate if unauthorized
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] text-[#111113] flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-md w-full text-center space-y-6 p-8 bg-white border-2 border-[#111113] shadow-[6px_6px_0px_0px_#111113]">
            <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] font-bold">
              [403 - RESTRICTED ACCESS]
            </div>
            <h2 className="font-syne font-extrabold text-2xl sm:text-3xl text-[#111113]">
              Admin Login Required
            </h2>
            <p className="font-sans text-xs text-[#111113]/80 leading-relaxed">
              The Recruiter Pipeline contains confidential candidate dossiers, contact numbers, and evaluation notes. Access is restricted exclusively to single admin <strong>admin@talentpulse.com</strong> with encrypted password.
            </p>

            <div className="pt-2 flex flex-col gap-2.5 font-mono text-xs">
              <Link
                href="/admin/login?redirect=/admin/dashboard"
                className="btn-brutalist btn-brutalist-primary py-3"
              >
                Sign In with Admin Account →
              </Link>
              <Link
                href="/"
                className="btn-brutalist py-2.5"
              >
                Return to Overview
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#111113] flex flex-col font-sans selection:bg-[#FF4D00] selection:text-white">
      <Navbar />

      <main className="flex-1 py-8 px-4 sm:px-[4vw] max-w-7xl mx-auto w-full space-y-6">
        {/* Unauthorized Redirection Alert Banner */}
        {unauthorizedNotice && (
          <div className="p-4 border-2 border-[#111113] bg-amber-50 text-amber-950 font-mono text-xs flex items-center justify-between shadow-[4px_4px_0px_0px_#111113] animate-in fade-in">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[#FF4D00] shrink-0" />
              <div>
                <span className="font-bold uppercase tracking-wider block text-[#FF4D00]">Access Restricted</span>
                <span>{unauthorizedNotice}</span>
              </div>
            </div>
            <button
              onClick={() => setIsNoticeDismissed(true)}
              className="p-1 hover:bg-black/10 font-bold ml-4"
              title="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top HR Auth Banner & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border-2 border-[#111113] shadow-[4px_4px_0px_0px_#111113]">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
              <span className="font-syne font-extrabold text-lg text-[#111113]">
                CANDIDATE PIPELINE
              </span>
              {(() => {
                const roleInfo = getRoleBadgeInfo(hrUser.role);
                return (
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${roleInfo.badgeClass}`}>
                    {roleInfo.label}
                  </span>
                );
              })()}
            </div>
            <p className="font-mono text-xs text-[#111113]/70 mt-1">
              AUTHENTICATED: <strong className="text-[#111113] font-bold">{hrUser.email}</strong> &bull; <span className="italic">{getRoleBadgeInfo(hrUser.role).description}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none max-w-full sm:flex-wrap font-mono text-xs">
            {/* Live Role Switcher (Facilitates testing and multi-role evaluation) */}
            <div className="flex items-center gap-1.5 border-2 border-[#111113] bg-[#F8F7F4] px-2.5 py-1.5 sm:py-1 text-xs font-mono shadow-[2px_2px_0px_0px_#111113] shrink-0 min-h-[44px] sm:min-h-0">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF4D00] shrink-0" />
              <span className="text-[10px] text-[#111113]/70 uppercase font-bold shrink-0">Role:</span>
              <select
                value={hrUser.role}
                onChange={(e) => handleSwitchSimulatedRole(e.target.value as RecruiterRole)}
                className="bg-transparent font-bold text-[#111113] focus:outline-hidden cursor-pointer text-xs"
                title="Switch active role clearance"
              >
                <option value="super_admin">Super Admin (All Access)</option>
                <option value="sales_executive">Sales Executive (Pipeline &amp; Hire Requests)</option>
                <option value="hr_executive">HR Executive (Pipeline, Roles &amp; XLSX Export)</option>
              </select>
            </div>

            {/* Customer Hire Requests: Visible only to Admin and Sales Executive */}
            {canAccessHireRequests(hrUser.role) && (
              <Link
                href="/admin/hire-requests"
                className="btn-brutalist btn-brutalist-primary text-xs py-2 sm:py-1.5 px-3 flex items-center gap-1.5 shrink-0 min-h-[44px] sm:min-h-0"
                title="Review client hire requests and manage offline outreach"
              >
                <Briefcase className="w-3.5 h-3.5 shrink-0" />
                <span>Hire Requests</span>
              </Link>
            )}

            {/* Roles & Technologies: Visible only to Admin and HR Executive */}
            {canManageRolesAndTech(hrUser.role) && (
              <Link
                href="/admin/roles"
                className="btn-brutalist text-xs py-2 sm:py-1.5 px-3 flex items-center gap-1.5 shrink-0 min-h-[44px] sm:min-h-0"
                title="Manage dynamic tracks, open/closed status, and technology moderation"
              >
                <Cpu className="w-3.5 h-3.5 shrink-0" />
                <span>Roles &amp; Tech</span>
              </Link>
            )}

            {/* Admin User Management: Visible only to Admin */}
            {canManageAdminUsers(hrUser.role) && (
              <Link
                href="/admin/users"
                className="btn-brutalist text-xs py-2 sm:py-1.5 px-3 flex items-center gap-1.5 shrink-0 min-h-[44px] sm:min-h-0"
                title="Manage administrator users, active clearance, and invite links"
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Admins</span>
              </Link>
            )}

            {/* SEO & Tracking Suite: Visible only to Admin */}
            {canManageSeo(hrUser.role) && (
              <Link
                href="/admin/seo"
                className="btn-brutalist text-xs py-2 sm:py-1.5 px-3 flex items-center gap-1.5 shrink-0 min-h-[44px] sm:min-h-0"
                title="Manage Global Meta, GTM Tracking, Schema.org, Robots and Sitemaps"
              >
                <Globe className="w-3.5 h-3.5 text-[#FF4D00] shrink-0" />
                <span>SEO &amp; Tracking</span>
              </Link>
            )}

            {/* Resume Storage Migration: Visible to Admin */}
            {canManageAdminUsers(hrUser.role) && (
              <button
                type="button"
                onClick={() => {
                  setShowMigrationModal(true);
                  fetchStorageConfig();
                }}
                className="btn-brutalist text-xs py-2 sm:py-1.5 px-3 flex items-center gap-1.5 shrink-0 min-h-[44px] sm:min-h-0 bg-blue-50 text-blue-900 border-blue-900 hover:bg-blue-100"
                title="Manage DigitalOcean Spaces resume bucket & migration"
              >
                <Cloud className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span>Resume Storage</span>
              </button>
            )}

            <Link
              href="/admin/change-password"
              className="btn-brutalist text-xs py-2 sm:py-1.5 px-3 flex items-center gap-1.5 shrink-0 min-h-[44px] sm:min-h-0"
              title="Update your administrative password"
            >
              <KeyRound className="w-3.5 h-3.5 shrink-0" />
              <span>Password</span>
            </Link>

            {/* Bulk Candidate Export: Available to HR Executives & Admins. Hidden for Sales Executives */}
            {canExportCandidateData(hrUser.role) ? (
              <>
                <button
                  onClick={handleExportXLSX}
                  className="btn-brutalist text-xs py-2 sm:py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-900 font-bold flex items-center gap-1.5 shrink-0 min-h-[44px] sm:min-h-0"
                  title="Download candidate pipeline in native Excel format (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Export Excel</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="btn-brutalist text-xs py-2 sm:py-1.5 px-2.5 shrink-0 min-h-[44px] sm:min-h-0"
                  title="Download CSV file"
                >
                  <Download className="w-3 h-3 shrink-0" />
                  <span>CSV</span>
                </button>
              </>
            ) : (
              <span 
                className="px-2 py-1.5 border border-dashed border-zinc-400 bg-zinc-100 text-zinc-500 text-[10px] font-mono uppercase font-bold shrink-0"
                title="Sales Executives do not have export permissions"
              >
                Exports Restricted
              </span>
            )}

            <Link
              href="/apply"
              className="btn-brutalist text-xs py-2 sm:py-1.5 px-3 bg-[#F8F7F4] hover:bg-[#111113] hover:text-[#F8F7F4] shrink-0 min-h-[44px] sm:min-h-0 flex items-center gap-1"
            >
              <Plus className="w-3 h-3 shrink-0" />
              <span>Add Candidate</span>
            </Link>

            <button
              onClick={handleSignOut}
              className="btn-brutalist text-xs py-2 sm:py-1.5 px-3 border-[#FF4D00] text-[#FF4D00] hover:bg-[#FF4D00] hover:text-white shrink-0 min-h-[44px] sm:min-h-0 flex items-center gap-1"
            >
              <LogOut className="w-3 h-3 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* HR Analytics KPI Header - Brutalist Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-[#111113] border-2 border-[#111113]">
          <div className="bg-[#F8F7F4] p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#111113]/60 mb-1">[TOTAL]</div>
            <div className="font-syne font-extrabold text-2xl text-[#111113]">{kpis.total}</div>
            <span className="font-mono text-[10px] text-[#111113]/60 uppercase">Dossiers</span>
          </div>

          <div className="bg-[#F8F7F4] p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#111113]/60 mb-1">[AVAILABLE]</div>
            <div className="font-syne font-extrabold text-2xl text-[#FF4D00]">{kpis.availableNow}</div>
            <span className="font-mono text-[10px] text-[#111113]/60 uppercase">Immediate</span>
          </div>

          <div className="bg-[#F8F7F4] p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#111113]/60 mb-1">[VIDEO]</div>
            <div className="font-syne font-extrabold text-2xl text-[#111113]">{kpis.withVideo}</div>
            <span className="font-mono text-[10px] text-[#111113]/60 uppercase">Pitches</span>
          </div>

          <div className="bg-[#F8F7F4] p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#111113]/60 mb-1">[RESUMES]</div>
            <div className="font-syne font-extrabold text-2xl text-[#111113]">{kpis.withResume}</div>
            <span className="font-mono text-[10px] text-[#111113]/60 uppercase">PDF CVs</span>
          </div>

          <div className="bg-[#F8F7F4] p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#111113]/60 mb-1">[AI / LLM]</div>
            <div className="font-syne font-extrabold text-2xl text-[#111113]">{kpis.aiEngineers}</div>
            <span className="font-mono text-[10px] text-[#111113]/60 uppercase">Engineers</span>
          </div>

          <div className="bg-[#F8F7F4] p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#111113]/60 mb-1">[MOBILE/ARCH]</div>
            <div className="font-syne font-extrabold text-2xl text-[#111113]">{kpis.mobileAndArchs}</div>
            <span className="font-mono text-[10px] text-[#111113]/60 uppercase">Specialists</span>
          </div>
        </div>

        {/* Search & Multi-Filter Toolbar */}
        <div className="p-5 bg-white border-2 border-[#111113] shadow-[4px_4px_0px_0px_#111113] space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
                placeholder="Search candidates by name, email, stack (PyTorch, Go, Swift)..."
                className="w-full font-mono text-xs px-3.5 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] placeholder:text-[#111113]/50 focus:outline-hidden"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 font-mono text-xs">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 border-2 border-[#111113] uppercase font-bold transition flex items-center gap-1.5 ${
                  viewMode === 'table'
                    ? 'bg-[#111113] text-[#F8F7F4]'
                    : 'bg-white text-[#111113] hover:bg-[#F8F7F4]'
                }`}
                title="Tabular candidate directory"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 border-2 border-[#111113] uppercase font-bold transition flex items-center gap-1.5 ${
                  viewMode === 'cards'
                    ? 'bg-[#111113] text-[#F8F7F4]'
                    : 'bg-white text-[#111113] hover:bg-[#F8F7F4]'
                }`}
                title="Card dossier grid"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-2 border-2 border-[#111113] uppercase font-bold transition flex items-center gap-1.5 ${
                  viewMode === 'kanban'
                    ? 'bg-[#111113] text-[#F8F7F4]'
                    : 'bg-white text-[#111113] hover:bg-[#F8F7F4]'
                }`}
                title="Pipeline stages board"
              >
                <span>Kanban</span>
              </button>
            </div>
          </div>

          {/* Filter Selectors */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-3 border-t border-[#111113]/20 font-mono text-xs">
            {/* Role Filter */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#111113]/70 mb-1">
                Role Track
              </label>
              <select
                value={filters.primaryRole}
                onChange={(e) => setFilters((prev) => ({ ...prev, primaryRole: e.target.value }))}
                className="w-full text-xs py-1.5 px-2 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113]"
              >
                <option value="all">All Roles</option>
                <option value="ai_engineer">AI / LLM Engineer</option>
                <option value="forward_deployed_engineer">Forward Deployed (FDE)</option>
                <option value="mobile_app_developer">Mobile App Developer</option>
                <option value="solutions_architect">Solutions Architect</option>
                <option value="full_stack">Full-Stack</option>
              </select>
            </div>

            {/* Region Overlap */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#111113]/70 mb-1">
                Client Region
              </label>
              <select
                value={filters.targetRegion}
                onChange={(e) => setFilters((prev) => ({ ...prev, targetRegion: e.target.value }))}
                className="w-full text-xs py-1.5 px-2 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113]"
              >
                <option value="all">All Regions</option>
                <option value="USA">USA Overlap</option>
                <option value="Europe">Europe Overlap</option>
                <option value="Asia">Asia Overlap</option>
                <option value="APAC">APAC Overlap</option>
              </select>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#111113]/70 mb-1">
                Availability
              </label>
              <select
                value={filters.availabilityStatus}
                onChange={(e) => setFilters((prev) => ({ ...prev, availabilityStatus: e.target.value }))}
                className="w-full text-xs py-1.5 px-2 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113]"
              >
                <option value="all">All Statuses</option>
                <option value="available_now">Available Now</option>
                <option value="available_soon">Available Soon</option>
                <option value="part_time_only">Part-Time</option>
                <option value="busy">Committed</option>
              </select>
            </div>

            {/* Video Pitch */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#111113]/70 mb-1">
                Video Pitch
              </label>
              <select
                value={filters.hasVideoPitch}
                onChange={(e) => setFilters((prev) => ({ ...prev, hasVideoPitch: e.target.value }))}
                className="w-full text-xs py-1.5 px-2 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113]"
              >
                <option value="all">Any Video</option>
                <option value="yes">Pitch Attached</option>
                <option value="no">No Video</option>
              </select>
            </div>

            {/* Resume Filter */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#111113]/70 mb-1">
                Resume PDF
              </label>
              <select
                value={filters.hasResume}
                onChange={(e) => setFilters((prev) => ({ ...prev, hasResume: e.target.value }))}
                className="w-full text-xs py-1.5 px-2 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113]"
              >
                <option value="all">All Resumes</option>
                <option value="yes">CV Attached</option>
                <option value="no">No CV</option>
              </select>
            </div>

            {/* Pipeline Stage */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-[#111113]/70 mb-1">
                Pipeline Stage
              </label>
              <select
                value={filters.pipelineStage}
                onChange={(e) => setFilters((prev) => ({ ...prev, pipelineStage: e.target.value }))}
                className="w-full text-xs py-1.5 px-2 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113]"
              >
                <option value="all">All Stages</option>
                <option value="new">New Lead</option>
                <option value="vetted">Vetted</option>
                <option value="interviewing">Interviewing</option>
                <option value="assigned">Assigned</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Area: Table View, Cards View, or Kanban View */}
        {viewMode === 'table' && (
          <div className="space-y-4">
            <CandidateTable
              candidates={paginatedCandidates}
              onSelectCandidate={(c) => {
                setSelectedCandidate(c);
                setIsDrawerOpen(true);
              }}
              onQuickStageChange={handleStageChange}
              sortBy={filters.sortBy}
              sortOrder={filters.sortOrder}
              onSortChange={handleSortChange}
            />
            {renderPagination()}
          </div>
        )}

        {viewMode === 'cards' && (
          <div className="space-y-4">
            {paginatedCandidates.length === 0 ? (
              <div className="p-12 text-center font-mono text-xs text-[#111113]/60 uppercase border-2 border-[#111113] bg-white shadow-[4px_4px_0px_0px_#111113]">
                [No candidates matched current search and filter parameters]
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedCandidates.map((c) => (
                  <CandidateCard
                    key={c.id}
                    candidate={c}
                    onSelect={(cand) => {
                      setSelectedCandidate(cand);
                      setIsDrawerOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
            {renderPagination()}
          </div>
        )}

        {viewMode === 'kanban' && (
          /* Kanban Board */
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
            {kanbanStages.map((stage) => {
              const stageMeta = getPipelineStageMeta(stage);
              const stageCandidates = candidates.filter((c) => c.pipeline_stage === stage);

              return (
                <div 
                  key={stage}
                  className="bg-white border-2 border-[#111113] p-4 flex flex-col min-w-[260px] shadow-[4px_4px_0px_0px_#111113]"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-[#111113] font-mono text-xs">
                    <span className="font-bold uppercase tracking-wider text-[#111113]">
                      [{stageMeta.label}]
                    </span>
                    <span className="font-bold text-[#FF4D00]">
                      {stageCandidates.length}
                    </span>
                  </div>

                  {/* Cards in Column */}
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[700px]">
                    {stageCandidates.length === 0 ? (
                      <div className="py-8 text-center font-mono text-xs text-[#111113]/50 border-2 border-dashed border-[#111113]/30 uppercase">
                        [No candidates in stage]
                      </div>
                    ) : (
                      stageCandidates.map((c) => (
                        <CandidateCard
                          key={c.id}
                          candidate={c}
                          compact
                          onSelect={(cand) => {
                            setSelectedCandidate(cand);
                            setIsDrawerOpen(true);
                          }}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* DigitalOcean Spaces Resume Storage & Transfer Modal */}
      {showMigrationModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#111113]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#F8F7F4] border-2 border-[#111113] shadow-[8px_8px_0px_0px_#111113] max-w-2xl w-full p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b-2 border-[#111113] pb-4">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-[#FF4D00] block mb-1">
                  [DIGITALOCEAN SPACES OBJECT STORAGE]
                </span>
                <h2 className="font-syne font-extrabold text-2xl text-[#111113]">
                  Candidate Resume Migration &amp; Storage
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowMigrationModal(false)}
                className="p-1.5 border border-[#111113] hover:bg-[#111113] hover:text-[#F8F7F4] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs max-h-[75vh] overflow-y-auto pr-1">
              {/* Credentials & Connection Configuration Panel */}
              <div className="p-3.5 border-2 border-[#111113] bg-white space-y-3">
                <div className="flex items-center justify-between border-b border-[#111113]/20 pb-2">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-blue-700" />
                    <span className="font-bold text-[#111113] text-xs uppercase">Spaces Connection Settings</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 border font-bold ${
                    isConfiguredSpaces 
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-700' 
                      : 'bg-amber-100 text-amber-900 border-amber-700'
                  }`}>
                    {isConfiguredSpaces ? '● BUCKET CONFIGURED' : '○ SIMULATED / LOCAL CACHE'}
                  </span>
                </div>

                <form onSubmit={handleSaveStorageConfig} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#111113]/70 mb-1">
                        Bucket Name
                      </label>
                      <input
                        type="text"
                        value={storageConfig.bucket}
                        onChange={(e) => setStorageConfig({ ...storageConfig, bucket: e.target.value })}
                        placeholder="talent-pulse-storage"
                        className="w-full bg-[#F8F7F4] border border-[#111113] px-2.5 py-1.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#FF4D00]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-[#111113]/70 mb-1">
                        Region
                      </label>
                      <input
                        type="text"
                        value={storageConfig.region}
                        onChange={(e) => setStorageConfig({ ...storageConfig, region: e.target.value })}
                        placeholder="nyc3"
                        className="w-full bg-[#F8F7F4] border border-[#111113] px-2.5 py-1.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#FF4D00]"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] uppercase font-bold text-[#111113]/70">
                        Endpoint URL
                      </label>
                      <span className="text-[9px] text-[#111113]/60 font-mono">
                        Regional domain only
                      </span>
                    </div>
                    <input
                      type="text"
                      value={storageConfig.endpoint}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStorageConfig(prev => {
                          let ep = val.trim();
                          let reg = prev.region;
                          const b = prev.bucket.toLowerCase().trim();
                          if (b && ep.toLowerCase().includes(`${b}.`)) {
                            ep = ep.replace(new RegExp(`https?://${b}\\.`, 'i'), 'https://');
                          }
                          const doMatch = ep.match(/([a-z0-9-]+)\.digitaloceanspaces\.com/i);
                          if (doMatch && doMatch[1]) {
                            reg = doMatch[1].toLowerCase();
                          }
                          return { ...prev, endpoint: val, region: reg };
                        });
                      }}
                      onBlur={() => {
                        setStorageConfig(prev => {
                          let ep = prev.endpoint.trim();
                          const b = prev.bucket.toLowerCase().trim();
                          if (b && ep.toLowerCase().includes(`${b}.`)) {
                            ep = ep.replace(new RegExp(`https?://${b}\\.`, 'i'), 'https://');
                          }
                          const doMatch = ep.match(/([a-z0-9-]+)\.digitaloceanspaces\.com/i);
                          let reg = prev.region;
                          if (doMatch && doMatch[1]) {
                            reg = doMatch[1].toLowerCase();
                            ep = `https://${reg}.digitaloceanspaces.com`;
                          }
                          return { ...prev, endpoint: ep, region: reg };
                        });
                      }}
                      placeholder="https://sgp1.digitaloceanspaces.com"
                      className="w-full bg-[#F8F7F4] border border-[#111113] px-2.5 py-1.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#FF4D00]"
                    />
                    <p className="text-[9px] text-[#111113]/60 mt-1">
                      Always use the regional endpoint (e.g. <code>https://sgp1.digitaloceanspaces.com</code>). Do not include the bucket name prefix.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] uppercase font-bold text-[#111113]/70">
                          Access Key (DO_SPACES_KEY)
                        </label>
                        {storedStorageMeta.accessKeyMasked && (
                          <span className="text-[9px] font-mono text-[#FF4D00]">
                            Active: {storedStorageMeta.accessKeyMasked}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={storageConfig.accessKey}
                        onChange={(e) => setStorageConfig({ ...storageConfig, accessKey: e.target.value })}
                        placeholder={
                          storedStorageMeta.accessKeyMasked
                            ? `Keep active (${storedStorageMeta.accessKeyMasked})`
                            : 'DO00EXAMPLEKEY...'
                        }
                        className="w-full bg-[#F8F7F4] border border-[#111113] px-2.5 py-1.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#FF4D00]"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] uppercase font-bold text-[#111113]/70">
                          Secret Key (DO_SPACES_SECRET)
                        </label>
                        {storedStorageMeta.hasSecretKey && (
                          <span className="text-[9px] font-mono text-emerald-600 font-bold">
                            Key Saved
                          </span>
                        )}
                      </div>
                      <input
                        type="password"
                        value={storageConfig.secretKey}
                        onChange={(e) => setStorageConfig({ ...storageConfig, secretKey: e.target.value })}
                        placeholder={
                          storedStorageMeta.hasSecretKey
                            ? '•••••••••••••••• (leave blank to keep unchanged)'
                            : 'Enter Spaces Secret Key'
                        }
                        className="w-full bg-[#F8F7F4] border border-[#111113] px-2.5 py-1.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#FF4D00]"
                      />
                    </div>
                  </div>

                  {configFeedback && (
                    <div className={`p-2.5 border text-[11px] flex items-center gap-2 ${
                      configFeedback.type === 'success' 
                        ? 'bg-emerald-50 text-emerald-950 border-emerald-600' 
                        : 'bg-rose-50 text-rose-950 border-rose-600'
                    }`}>
                      {configFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{configFeedback.message}</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isSavingStorageConfig || isLoadingStorageConfig}
                      className="btn-brutalist text-xs py-1.5 px-3 flex items-center gap-1.5 bg-[#111113] text-[#F8F7F4] hover:bg-[#FF4D00] disabled:opacity-50"
                    >
                      {isSavingStorageConfig ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Testing &amp; Saving...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Test Connection &amp; Save Credentials</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Path & Storage Specification */}
              <div className="p-3.5 border-2 border-[#111113] bg-white space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-[#111113]">Storage Path Hierarchy:</span>
                  <span className="text-emerald-700">[PRIVATE ACL ENFORCED]</span>
                </div>
                <div className="bg-[#F8F7F4] p-2 border border-[#111113]/30 font-mono text-[11px] text-[#111113] select-all">
                  Talent Pulse/{'{Month-Year}'}/candidate/{'{candidateId}_{filename}'}
                </div>
                <p className="text-[10px] text-[#111113]/70 uppercase leading-relaxed">
                  Resumes are stored privately in DigitalOcean Spaces. Direct public URL access is prohibited; all files are authenticated via Talent Pulse system routes. Updating a resume deletes the old file automatically.
                </p>
              </div>

              {migrationResult && (
                <div className={`p-4 border-2 space-y-3 animate-in fade-in ${
                  migrationResult.errorCount > 0 || !migrationResult.success
                    ? 'border-amber-700 bg-amber-50 text-amber-950'
                    : 'border-emerald-700 bg-emerald-50 text-emerald-950'
                }`}>
                  <div className={`flex items-center gap-2 font-bold text-xs ${
                    migrationResult.errorCount > 0 || !migrationResult.success ? 'text-amber-900' : 'text-emerald-800'
                  }`}>
                    {migrationResult.errorCount > 0 || !migrationResult.success ? (
                      <AlertTriangle className="w-4 h-4 text-amber-700" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>
                      {migrationResult.errorCount > 0 || !migrationResult.success
                        ? 'Migration Completed With Errors'
                        : 'Migration Execution Complete'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
                    <div className="p-2 bg-white border border-[#111113]/20">
                      <span className="block text-[#111113]/70 text-[10px] uppercase">Scanned</span>
                      <strong className="text-sm">{migrationResult.totalScanned}</strong>
                    </div>
                    <div className="p-2 bg-white border border-[#111113]/20">
                      <span className="block text-[#111113]/70 text-[10px] uppercase">Migrated</span>
                      <strong className="text-sm text-emerald-800">{migrationResult.migratedCount}</strong>
                    </div>
                    <div className="p-2 bg-white border border-[#111113]/20">
                      <span className="block text-[#111113]/70 text-[10px] uppercase">In Spaces</span>
                      <strong className="text-sm">{migrationResult.alreadyInSpacesCount}</strong>
                    </div>
                    <div className="p-2 bg-white border border-[#111113]/20">
                      <span className="block text-[#111113]/70 text-[10px] uppercase">Errors</span>
                      <strong className="text-sm text-rose-700">{migrationResult.errorCount}</strong>
                    </div>
                  </div>

                  {migrationResult.logs && migrationResult.logs.length > 0 && (
                    <div className="max-h-40 overflow-y-auto p-2 bg-black text-emerald-400 font-mono text-[10px] border border-[#111113] space-y-1">
                      {migrationResult.logs.map((log: string, idx: number) => (
                        <div key={idx} className="whitespace-pre-wrap">{log}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {migrationError && (
                <div className="p-3.5 border-2 border-rose-600 bg-rose-50 text-rose-950 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{migrationError}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t-2 border-[#111113] font-mono text-xs">
              <span className="text-[10px] text-[#111113]/60 uppercase">
                CLI command: <code className="font-bold text-[#111113]">npm run migrate:resumes</code>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowMigrationModal(false)}
                  className="btn-brutalist py-2.5 px-4"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleRunMigration}
                  disabled={isMigratingResumes}
                  className="btn-brutalist btn-brutalist-primary py-2.5 px-4 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{isMigratingResumes ? 'TRANSFERRING RESUMES...' : 'EXECUTE RESUME TRANSFER'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Dossier Side-Drawer */}
      <CandidateDetailDrawer
        candidate={selectedCandidate}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onStageChange={handleStageChange}
      />
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center p-6 font-mono text-xs">
          Loading Admin Pipeline...
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
