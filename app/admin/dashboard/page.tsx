'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Candidate, 
  CandidateFilters, 
  PipelineStage, 
  getPipelineStageMeta 
} from '@/types/candidate';
import { 
  getCandidatesList, 
  updateCandidateStageAndNotesRecord, 
  resetMockData 
} from '@/lib/candidate-store';
import * as XLSX from 'xlsx';
import { 
  getCurrentHrUser, 
  signOutHrRecruiter, 
  isEmailAuthorizedForHr, 
  HrUser,
  RecruiterRole,
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
  RotateCcw, 
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
  Globe
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [hrUser, setHrUser] = useState<HrUser | null>(() => {
    if (typeof window === 'undefined') return null;
    const user = getCurrentHrUser();
    return user && user.email && isEmailAuthorizedForHr(user.email) ? user : null;
  });
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const user = getCurrentHrUser();
    return Boolean(user && user.email && isEmailAuthorizedForHr(user.email));
  });
  const [isCheckingAuth] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return false;
  });
  const [rawCandidates, setRawCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveSupabase, setIsLiveSupabase] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

  // Unauthorized redirection notification banner state
  const [unauthorizedNotice, setUnauthorizedNotice] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const unauth = params.get('unauthorized');
    if (unauth === 'hire-requests') {
      return 'Access Restricted: HR Executives are authorized to manage candidate pipelines, export candidate records as Excel (.xlsx), and administer Roles & Technologies, but are not permitted to access Customer Hire Requests.';
    }
    if (unauth === 'roles') {
      return 'Access Restricted: Sales Executives are authorized to view and update candidate pipelines and customer hire requests, but are not permitted to configure Roles & Technologies.';
    }
    if (unauth === 'users') {
      return 'Access Restricted: Team clearance and administrator provisioning is restricted strictly to Administrators.';
    }
    return null;
  });

  const handleSwitchSimulatedRole = (newRole: RecruiterRole) => {
    if (!hrUser) return;
    const updated = updateHrUserSession({ role: newRole });
    if (updated) {
      setHrUser(updated);
    }
  };

  // 1. Strict Auth Verification Gate: Redirect if unauthorized or first login
  useEffect(() => {
    if (!isAuthorized) {
      router.replace('/admin/login?error=auth_required');
      return;
    }
    if (hrUser?.must_change_password) {
      router.replace(`/admin/change-password?email=${encodeURIComponent(hrUser.email)}&first_login=true`);
    }
  }, [isAuthorized, hrUser, router]);

  // 2. Fetch all candidates once upon authentication or manual refresh
  const reloadCandidates = async () => {
    if (!isAuthorized) return;
    setIsLoading(true);
    try {
      const { candidates: data, isLiveSupabase: live } = await getCandidatesList();
      setRawCandidates(data);
      setIsLiveSupabase(live);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

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

  // Reset to initial mock dataset
  const handleResetData = () => {
    if (confirm('Reset talent pipeline to initial mock engineers?')) {
      resetMockData();
      reloadCandidates();
    }
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

  // Render blocked gate if unauthenticated or unauthorized
  if (!isAuthorized || !hrUser) {
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
              onClick={() => setUnauthorizedNotice(null)}
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

          <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
            {/* Live Role Switcher (Facilitates testing and multi-role evaluation) */}
            <div className="flex items-center gap-1.5 border-2 border-[#111113] bg-[#F8F7F4] px-2 py-1 text-xs font-mono shadow-[2px_2px_0px_0px_#111113]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF4D00]" />
              <span className="text-[10px] text-[#111113]/70 uppercase font-bold">Role:</span>
              <select
                value={hrUser.role}
                onChange={(e) => handleSwitchSimulatedRole(e.target.value as RecruiterRole)}
                className="bg-transparent font-bold text-[#111113] focus:outline-hidden cursor-pointer text-xs"
                title="Switch active role clearance"
              >
                <option value="admin">Admin (All Access)</option>
                <option value="sales_executive">Sales Executive (Pipeline &amp; Hire Requests)</option>
                <option value="hr_executive">HR Executive (Pipeline, Roles &amp; XLSX Export)</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>

            {/* Customer Hire Requests: Visible only to Admin and Sales Executive */}
            {canAccessHireRequests(hrUser.role) && (
              <Link
                href="/admin/hire-requests"
                className="btn-brutalist btn-brutalist-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                title="Review client hire requests and manage offline outreach"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Hire Requests</span>
              </Link>
            )}

            {/* Roles & Technologies: Visible only to Admin and HR Executive */}
            {canManageRolesAndTech(hrUser.role) && (
              <Link
                href="/admin/roles"
                className="btn-brutalist text-xs py-1.5 px-3 flex items-center gap-1.5"
                title="Manage dynamic tracks, open/closed status, and technology moderation"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Roles &amp; Tech</span>
              </Link>
            )}

            {/* Admin User Management: Visible only to Admin */}
            {canManageAdminUsers(hrUser.role) && (
              <Link
                href="/admin/users"
                className="btn-brutalist text-xs py-1.5 px-3 flex items-center gap-1.5"
                title="Manage administrator users, active clearance, and invite links"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Admins</span>
              </Link>
            )}

            {/* SEO & Tracking Suite: Visible only to Admin */}
            {canManageSeo(hrUser.role) && (
              <Link
                href="/admin/seo"
                className="btn-brutalist text-xs py-1.5 px-3 flex items-center gap-1.5"
                title="Manage Global Meta, GTM Tracking, Schema.org, Robots and Sitemaps"
              >
                <Globe className="w-3.5 h-3.5 text-[#FF4D00]" />
                <span>SEO &amp; Tracking</span>
              </Link>
            )}

            <Link
              href="/admin/change-password"
              className="btn-brutalist text-xs py-1.5 px-3 flex items-center gap-1.5"
              title="Update your administrative password"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Password</span>
            </Link>

            <button
              onClick={handleResetData}
              title="Reset sample candidate dataset"
              className="btn-brutalist text-xs py-1.5 px-3"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>

            {/* Bulk Candidate Export: Available to HR Executives & Admins. Hidden for Sales Executives */}
            {canExportCandidateData(hrUser.role) ? (
              <>
                <button
                  onClick={handleExportXLSX}
                  className="btn-brutalist text-xs py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-900 font-bold flex items-center gap-1.5"
                  title="Download candidate pipeline in native Excel format (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Export Excel (.xlsx)</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="btn-brutalist text-xs py-1.5 px-2.5"
                  title="Download CSV file"
                >
                  <Download className="w-3 h-3" />
                  <span>CSV</span>
                </button>
              </>
            ) : (
              <span 
                className="px-2 py-1 border border-dashed border-zinc-400 bg-zinc-100 text-zinc-500 text-[10px] font-mono uppercase font-bold"
                title="Sales Executives do not have export permissions"
              >
                Exports Restricted
              </span>
            )}

            <Link
              href="/apply"
              className="btn-brutalist text-xs py-1.5 px-3 bg-[#F8F7F4] hover:bg-[#111113] hover:text-[#F8F7F4]"
            >
              <Plus className="w-3 h-3" />
              <span>Add Candidate</span>
            </Link>

            <button
              onClick={handleSignOut}
              className="btn-brutalist text-xs py-1.5 px-3 border-[#FF4D00] text-[#FF4D00] hover:bg-[#FF4D00] hover:text-white"
            >
              <LogOut className="w-3 h-3" />
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
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 border-2 border-[#111113] uppercase font-bold transition ${
                  viewMode === 'table'
                    ? 'bg-[#111113] text-[#F8F7F4]'
                    : 'bg-white text-[#111113] hover:bg-[#F8F7F4]'
                }`}
              >
                Table View
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-2 border-2 border-[#111113] uppercase font-bold transition ${
                  viewMode === 'kanban'
                    ? 'bg-[#111113] text-[#F8F7F4]'
                    : 'bg-white text-[#111113] hover:bg-[#F8F7F4]'
                }`}
              >
                Kanban
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

        {/* Content Area: Table View or Kanban View */}
        {viewMode === 'table' ? (
          <CandidateTable
            candidates={candidates}
            onSelectCandidate={(c) => {
              setSelectedCandidate(c);
              setIsDrawerOpen(true);
            }}
            onQuickStageChange={handleStageChange}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSortChange={handleSortChange}
          />
        ) : (
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
