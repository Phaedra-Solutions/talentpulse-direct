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
import { 
  getCurrentHrUser, 
  signOutHrRecruiter, 
  isEmailAuthorizedForHr, 
  HrUser 
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
  KeyRound
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

  // Export CSV
  const handleExportCSV = () => {
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
        {/* Top HR Auth Banner & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border-2 border-[#111113] shadow-[4px_4px_0px_0px_#111113]">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="font-syne font-extrabold text-lg text-[#111113]">
                RECRUITER PIPELINE
              </span>
              <span className="bg-[#FF4D00] text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                ADMIN ACCESS
              </span>
            </div>
            <p className="font-mono text-xs text-[#111113]/70 mt-1">
              AUTHENTICATED: <strong className="text-[#111113] font-bold">{hrUser.email}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
            <Link
              href="/admin/users"
              className="btn-brutalist btn-brutalist-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
              title="Manage administrator users, active clearance, and invite links"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Manage Admins</span>
            </Link>

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

            <button
              onClick={handleExportCSV}
              className="btn-brutalist text-xs py-1.5 px-3"
            >
              <Download className="w-3 h-3" />
              <span>Export CSV</span>
            </button>

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
