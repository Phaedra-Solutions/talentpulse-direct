'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  HireRequest,
  HireRequestStatus,
  getHireRequestStatusMeta,
} from '@/types/hire-request';
import {
  useCurrentHrUser,
  canAccessHireRequests,
  canManageRolesAndTech,
  canManageAdminUsers,
  canExportHireRequests,
  getRoleBadgeInfo,
  getAdminAuthHeaders,
} from '@/lib/auth/recruiter-auth';
import { Navbar } from '@/components/Navbar';
import {
  Building2,
  Phone,
  Mail,
  Search,
  Filter,
  CheckCircle2,
  Users,
  Cpu,
  Download,
  Edit3,
  Trash2,
  X,
  Save,
  MessageSquare,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';

interface HireStats {
  total: number;
  newCount: number;
  contactedCount: number;
  negotiatingCount: number;
  signedCount: number;
  closedCount: number;
}

function getPageNumbers(current: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | 'ellipsis')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  if (start > 2) pages.push('ellipsis');
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < totalPages - 1) pages.push('ellipsis');
  pages.push(totalPages);
  return pages;
}

export default function AdminHireRequestsPage() {
  const router = useRouter();

  const hrUser = useCurrentHrUser();
  const hrEmail = hrUser?.email;
  const hrRole = hrUser?.role;
  const isAuthorized = Boolean(hrEmail && hrRole && canAccessHireRequests(hrRole));

  const [requests, setRequests] = useState<HireRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [stats, setStats] = useState<HireStats>({
    total: 0,
    newCount: 0,
    contactedCount: 0,
    negotiatingCount: 0,
    signedCount: 0,
    closedCount: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | HireRequestStatus>('all');

  // Selected request for offline drawer/modal
  const [activeRequest, setActiveRequest] = useState<HireRequest | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [editStatus, setEditStatus] = useState<HireRequestStatus>('new');
  const [editNotes, setEditNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // In-app delete confirmation modal
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<HireRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Auth gate: Restrict to Super Admins & Sales Executives
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!hrEmail || !hrRole) {
      router.replace('/admin/login?redirect=/admin/hire-requests');
    } else if (!canAccessHireRequests(hrRole)) {
      router.replace('/admin/dashboard?unauthorized=hire-requests');
    }
  }, [hrEmail, hrRole, router]);

  // Auto-dismiss transient toast
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  // Debounce server-side search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Server-side paginated load via authenticated API route (service_role bypasses RLS safely)
  const fetchHireRequests = useCallback(
    async (
      pageNum: number,
      limitNum: number,
      statusVal: 'all' | HireRequestStatus,
      searchVal: string,
      withStats = true
    ) => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const params = new URLSearchParams({
          page: String(pageNum),
          limit: String(limitNum),
          status: statusVal,
          summary: 'true',
          includeStats: withStats ? 'true' : 'false',
        });
        if (searchVal.trim()) {
          params.set('search', searchVal.trim());
        }

        const res = await fetch(`/api/hire-requests?${params.toString()}`, {
          headers: getAdminAuthHeaders(),
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || `Failed to load hire requests (HTTP ${res.status})`);
        }

        setRequests(Array.isArray(json.data) ? json.data : []);
        setTotal(typeof json.total === 'number' ? json.total : (json.data || []).length);
        if (json.stats) {
          setStats(json.stats);
        }
      } catch (err: any) {
        console.error('Failed to load hire requests:', err);
        setFetchError(err?.message || 'Unable to load hire requests from server.');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!isAuthorized) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        fetchHireRequests(page, pageSize, statusFilter, debouncedSearch, true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthorized, page, pageSize, statusFilter, debouncedSearch, fetchHireRequests]);

  // Open review modal & lazily hydrate full project_scope + notes from /api/hire-requests/[id]
  const handleOpenReview = async (req: HireRequest) => {
    setActiveRequest(req);
    setEditStatus(req.status);
    setEditNotes(req.offline_notes || '');

    if (req.project_scope === undefined) {
      setIsLoadingDetail(true);
      try {
        const res = await fetch(`/api/hire-requests/${req.id}`, {
          headers: getAdminAuthHeaders(),
        });
        const json = await res.json();
        if (res.ok && json.success && json.data) {
          setActiveRequest(json.data);
          setEditStatus(json.data.status);
          setEditNotes(json.data.offline_notes || '');
        }
      } catch {
        // Keep summary fields if detail fetch fails
      } finally {
        setIsLoadingDetail(false);
      }
    }
  };

  // Save offline review notes & status via PATCH /api/hire-requests/[id]
  const handleSaveReview = async () => {
    if (!activeRequest) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/hire-requests/${activeRequest.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify({
          status: editStatus,
          offline_notes: editNotes,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || 'Failed to update hire request');
      }

      setActiveRequest(json.data);
      setNotice({ type: 'success', message: `Updated status & notes for ${json.data.business_name}.` });
      await fetchHireRequests(page, pageSize, statusFilter, debouncedSearch, true);
    } catch (err: any) {
      console.error('Failed to update hire request:', err);
      setNotice({ type: 'error', message: err?.message || 'Error updating hire request' });
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm delete via DELETE /api/hire-requests/[id]
  const handleConfirmDelete = async () => {
    if (!confirmDeleteItem) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/hire-requests/${confirmDeleteItem.id}`, {
        method: 'DELETE',
        headers: getAdminAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete hire request');
      }

      if (activeRequest?.id === confirmDeleteItem.id) {
        setActiveRequest(null);
      }
      setNotice({
        type: 'success',
        message: `Deleted hire request for ${confirmDeleteItem.business_name}.`,
      });
      setConfirmDeleteItem(null);

      const nextPage = requests.length === 1 && page > 1 ? page - 1 : page;
      if (nextPage !== page) {
        setPage(nextPage);
      } else {
        await fetchHireRequests(nextPage, pageSize, statusFilter, debouncedSearch, true);
      }
    } catch (err: any) {
      console.error('Failed to delete request:', err);
      setNotice({ type: 'error', message: err?.message || 'Delete failed' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Server-side full CSV export across all matching rows
  const handleExportCSV = async () => {
    if (!canExportHireRequests(hrRole)) {
      setNotice({
        type: 'error',
        message: 'Permission Restricted: Sales Executives cannot export customer data.',
      });
      return;
    }

    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        export: 'true',
        status: statusFilter,
      });
      if (debouncedSearch.trim()) {
        params.set('search', debouncedSearch.trim());
      }

      const res = await fetch(`/api/hire-requests?${params.toString()}`, {
        headers: getAdminAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Export failed');
      }

      const rowsToExport: HireRequest[] = json.data || [];
      const headers = [
        'ID',
        'Client Name',
        'Business Name',
        'Role Requested',
        'Expected Cost',
        'Timeline',
        'Country',
        'Email',
        'Phone',
        'Status',
        'Created At',
        'Project Scope',
        'Offline Notes',
      ];

      const esc = (val: string | undefined) => `"${(val || '').replace(/"/g, '""')}"`;

      const rows = rowsToExport.map((r) => [
        esc(r.id),
        esc(r.client_name),
        esc(r.business_name),
        esc(r.role_title),
        esc(r.expected_cost),
        esc(r.timeline_to_start),
        esc(r.country),
        esc(r.client_email),
        esc(r.client_phone),
        esc(r.status),
        esc(r.created_at),
        esc(r.project_scope),
        esc(r.offline_notes),
      ]);

      const csvBody = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const blob = new Blob([csvBody], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `talentpulse_client_hire_requests_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setNotice({ type: 'error', message: err?.message || 'CSV export failed' });
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const startRecord = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endRecord = Math.min(startRecord + requests.length - 1, total);

  if (!hrUser) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-[#111113] border-t-[#FF4D00] animate-spin mb-4" />
        <span className="font-mono text-xs uppercase tracking-widest text-[#111113]/70">
          Verifying Access Permissions...
        </span>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] text-[#111113] flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-4 p-8 bg-white border-2 border-[#111113] shadow-[6px_6px_0px_0px_#111113]">
            <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] font-bold">
              [403 - RESTRICTED ACCESS]
            </div>
            <h2 className="font-syne font-extrabold text-2xl text-[#111113]">
              Admin Login Required
            </h2>
            <p className="font-sans text-xs text-[#111113]/80">
              Client hire requests contain enterprise budgets, contact identities, and negotiation notes. Access is restricted exclusively to authorized administrators.
            </p>
            <Link
              href="/admin/login?redirect=/admin/hire-requests"
              className="btn-brutalist btn-brutalist-primary py-2.5 px-4 text-xs block"
            >
              Sign In to Admin Portal →
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#111113] flex flex-col font-sans selection:bg-[#FF4D00] selection:text-white">
      <Navbar />

      <main className="flex-1 py-8 px-4 sm:px-[4vw] max-w-7xl mx-auto w-full space-y-6">
        {/* Toast Notice */}
        {notice && (
          <div
            className={`p-4 border-2 border-[#111113] font-mono text-xs flex items-center justify-between shadow-[4px_4px_0px_0px_#111113] ${
              notice.type === 'success'
                ? 'bg-emerald-50 text-emerald-950'
                : 'bg-rose-50 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-2">
              {notice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{notice.message}</span>
            </div>
            <button onClick={() => setNotice(null)} className="p-1 hover:bg-black/10">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* API Error Banner */}
        {fetchError && (
          <div className="p-4 bg-rose-50 border-2 border-rose-600 font-mono text-xs text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[4px_4px_0px_0px_#111113]">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Database Error:</strong> {fetchError}
              </span>
            </div>
            <button
              type="button"
              onClick={() => fetchHireRequests(page, pageSize, statusFilter, debouncedSearch, true)}
              className="btn-brutalist text-xs py-1 px-3 bg-white flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Top HR Auth Banner & Sub-Nav */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border-2 border-[#111113] shadow-[4px_4px_0px_0px_#111113]">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
              <span className="font-syne font-extrabold text-lg text-[#111113]">
                CLIENT HIRE REQUESTS
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
            <Link
              href="/admin/dashboard"
              className="btn-brutalist text-xs py-2 sm:py-1.5 px-3 flex items-center gap-1.5 shrink-0 min-h-[44px] sm:min-h-0"
              title="Candidates Pipeline"
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>Candidates</span>
            </Link>

            {canManageRolesAndTech(hrUser.role) && (
              <Link
                href="/admin/roles"
                className="btn-brutalist text-xs py-2 sm:py-1.5 px-3 flex items-center gap-1.5 shrink-0 min-h-[44px] sm:min-h-0"
                title="Roles & Technologies Management"
              >
                <Cpu className="w-3.5 h-3.5 shrink-0" />
                <span>Roles &amp; Tech</span>
              </Link>
            )}

            {canManageAdminUsers(hrUser.role) && (
              <Link
                href="/admin/users"
                className="btn-brutalist text-xs py-2 sm:py-1.5 px-3 flex items-center gap-1.5 shrink-0 min-h-[44px] sm:min-h-0"
                title="Admin user management"
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Admins</span>
              </Link>
            )}

            {canExportHireRequests(hrUser.role) ? (
              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportCSV}
                className="btn-brutalist text-xs py-2 sm:py-1.5 px-3 shrink-0 min-h-[44px] sm:min-h-0 flex items-center gap-1.5 disabled:opacity-50"
                title="Download all matching client requests as CSV"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>{isExporting ? 'Exporting...' : 'CSV'}</span>
              </button>
            ) : (
              <span
                className="px-2 py-1.5 border border-dashed border-zinc-400 bg-zinc-100 text-zinc-500 text-[10px] font-mono uppercase font-bold shrink-0"
                title="Sales Executives do not have export permissions"
              >
                Exports Restricted
              </span>
            )}
          </div>
        </div>

        {/* Metrics Grid (click to quick-filter by status) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setPage(1);
            }}
            className={`text-left bg-white border-2 border-[#111113] p-4 shadow-[2px_2px_0px_0px_#111113] transition hover:bg-[#F8F7F4] ${
              statusFilter === 'all' ? 'ring-2 ring-[#FF4D00]' : ''
            }`}
          >
            <span className="font-mono text-[10px] text-[#111113]/60 uppercase block">
              Total Inquiries
            </span>
            <span className="font-syne font-extrabold text-2xl text-[#111113]">
              {stats.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter('new');
              setPage(1);
            }}
            className={`text-left bg-white border-2 border-[#111113] p-4 shadow-[2px_2px_0px_0px_#111113] transition hover:bg-[#F8F7F4] ${
              statusFilter === 'new' ? 'ring-2 ring-[#FF4D00]' : ''
            }`}
          >
            <span className="font-mono text-[10px] text-[#FF4D00] uppercase block font-bold">
              New (Needs Offline Call)
            </span>
            <span className="font-syne font-extrabold text-2xl text-[#FF4D00]">
              {stats.newCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter('contacted');
              setPage(1);
            }}
            className={`text-left bg-white border-2 border-[#111113] p-4 shadow-[2px_2px_0px_0px_#111113] transition hover:bg-[#F8F7F4] ${
              statusFilter === 'contacted' ? 'ring-2 ring-[#FF4D00]' : ''
            }`}
          >
            <span className="font-mono text-[10px] text-blue-700 uppercase block font-bold">
              Contacted Offline
            </span>
            <span className="font-syne font-extrabold text-2xl text-blue-800">
              {stats.contactedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter('negotiating');
              setPage(1);
            }}
            className={`text-left bg-white border-2 border-[#111113] p-4 shadow-[2px_2px_0px_0px_#111113] transition hover:bg-[#F8F7F4] ${
              statusFilter === 'negotiating' ? 'ring-2 ring-[#FF4D00]' : ''
            }`}
          >
            <span className="font-mono text-[10px] text-purple-700 uppercase block font-bold">
              In Negotiation
            </span>
            <span className="font-syne font-extrabold text-2xl text-purple-800">
              {stats.negotiatingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter('contract_signed');
              setPage(1);
            }}
            className={`text-left bg-white border-2 border-[#111113] p-4 shadow-[2px_2px_0px_0px_#111113] col-span-2 sm:col-span-1 lg:col-span-1 transition hover:bg-[#F8F7F4] ${
              statusFilter === 'contract_signed' ? 'ring-2 ring-[#FF4D00]' : ''
            }`}
          >
            <span className="font-mono text-[10px] text-emerald-700 uppercase block font-bold">
              Contracts Signed
            </span>
            <span className="font-syne font-extrabold text-2xl text-emerald-800">
              {stats.signedCount}
            </span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white border-2 border-[#111113] p-4 shadow-[4px_4px_0px_0px_#111113] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[#111113]/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, client name, email, phone, role, country..."
              className="w-full font-mono text-xs pl-9 pr-3 py-2 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] placeholder:text-[#111113]/40 focus:outline-hidden focus:border-[#FF4D00]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#111113]/60 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="font-mono text-xs px-3 py-2 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] focus:outline-hidden focus:border-[#FF4D00]"
            >
              <option value="all">All Statuses ({stats.total})</option>
              <option value="new">New ({stats.newCount})</option>
              <option value="contacted">Contacted ({stats.contactedCount})</option>
              <option value="negotiating">In Negotiation ({stats.negotiatingCount})</option>
              <option value="contract_signed">Contract Signed ({stats.signedCount})</option>
              <option value="closed">Closed / Archived ({stats.closedCount})</option>
            </select>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white border-2 border-[#111113] shadow-[6px_6px_0px_0px_#111113] overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 font-mono text-xs text-[#111113]/70">
              <div className="w-8 h-8 border-4 border-[#111113] border-t-[#FF4D00] animate-spin" />
              <span className="uppercase tracking-wider">Loading client hire requests...</span>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center font-mono text-xs text-[#111113]/60 space-y-3">
              <p>
                {debouncedSearch.trim() || statusFilter !== 'all'
                  ? 'No client hire requests matched your current search or filter.'
                  : 'No client hire requests recorded yet.'}
              </p>
              {(debouncedSearch.trim() || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setPage(1);
                  }}
                  className="btn-brutalist text-xs py-1.5 px-3"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="bg-[#111113] text-[#F8F7F4] uppercase text-[11px] tracking-wider border-b-2 border-[#111113]">
                    <th className="p-3">Status</th>
                    <th className="p-3">Company &amp; Contact</th>
                    <th className="p-3">Role Requested</th>
                    <th className="p-3">Budget</th>
                    <th className="p-3">Timeline</th>
                    <th className="p-3">Direct Contact</th>
                    <th className="p-3">Offline Notes</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#111113]/20">
                  {requests.map((req) => {
                    const meta = getHireRequestStatusMeta(req.status);
                    const isSelected = activeRequest?.id === req.id;

                    return (
                      <tr
                        key={req.id}
                        className={`hover:bg-[#FF4D00]/5 transition-colors ${
                          isSelected ? 'bg-orange-50/80' : ''
                        }`}
                      >
                        <td className="p-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${meta.color}`}
                          >
                            {meta.label}
                          </span>
                        </td>

                        <td className="p-3">
                          <div className="font-bold text-[#111113] flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-[#111113]/60 shrink-0" />
                            <span>{req.business_name}</span>
                          </div>
                          <div className="text-[11px] text-[#111113]/70 flex items-center gap-1.5 mt-0.5">
                            <span>{req.client_name}</span>
                            <span>•</span>
                            <span className="text-[#111113]/60">{req.country}</span>
                          </div>
                        </td>

                        <td className="p-3">
                          <span className="font-bold text-[#111113]">{req.role_title}</span>
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          <span className="font-bold text-[#FF4D00]">{req.expected_cost}</span>
                        </td>

                        <td className="p-3 whitespace-nowrap text-[#111113]/80">
                          {req.timeline_to_start}
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <a
                              href={`tel:${req.client_phone}`}
                              className="inline-flex items-center gap-1 text-[#111113] hover:text-[#FF4D00] transition-colors"
                              title="Click to dial phone"
                            >
                              <Phone className="w-3 h-3 text-[#111113]/60" />
                              <span>{req.client_phone}</span>
                            </a>
                            <a
                              href={`mailto:${req.client_email}?subject=Contract%20Engagement%20Inquiry%20-%20${encodeURIComponent(req.role_title)}`}
                              className="inline-flex items-center gap-1 text-[11px] text-[#111113]/70 hover:text-[#FF4D00] transition-colors truncate max-w-[180px]"
                              title="Click to send email"
                            >
                              <Mail className="w-3 h-3 text-[#111113]/40" />
                              <span className="truncate">{req.client_email}</span>
                            </a>
                          </div>
                        </td>

                        <td className="p-3 max-w-xs">
                          <p className="text-[11px] text-[#111113]/70 truncate" title={req.offline_notes}>
                            {req.offline_notes || 'No offline notes logged yet'}
                          </p>
                        </td>

                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenReview(req)}
                              className="btn-brutalist btn-brutalist-primary text-[10px] py-1 px-2.5 flex items-center gap-1"
                              title="Review request details and record offline call notes"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Review</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setConfirmDeleteItem(req)}
                              className="p-1.5 border border-[#111113] text-[#111113]/70 hover:text-red-600 hover:border-red-600 transition-colors"
                              title="Delete request"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Server-Side Pagination Footer */}
          {total > 0 && (
            <div className="p-4 border-t-2 border-[#111113] bg-[#F8F7F4] flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
              <div className="flex items-center gap-3 flex-wrap text-[#111113]/80">
                <span>
                  Showing <span className="font-bold text-[#FF4D00]">[{startRecord}–{endRecord}]</span> of{' '}
                  <span className="font-bold text-[#111113]">{total}</span> inquiries
                </span>
                <label className="flex items-center gap-1.5 text-[11px]">
                  <span>Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="border border-[#111113] bg-white px-2 py-1 font-bold"
                  >
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </label>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  disabled={safePage <= 1 || isLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border-2 border-[#111113] uppercase font-bold text-xs bg-white hover:bg-[#111113] hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                {getPageNumbers(safePage, totalPages).map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span key={`e-${idx}`} className="px-1.5 text-[#111113]/50">
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      disabled={isLoading}
                      onClick={() => setPage(item)}
                      className={`px-2.5 py-1.5 border-2 border-[#111113] font-bold text-xs transition ${
                        item === safePage
                          ? 'bg-[#111113] text-white'
                          : 'bg-white text-[#111113] hover:bg-[#F8F7F4]'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
                <button
                  type="button"
                  disabled={safePage >= totalPages || isLoading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 border-2 border-[#111113] uppercase font-bold text-xs bg-white hover:bg-[#111113] hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Offline Review & Detail Modal / Drawer */}
        {activeRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#111113]/70 backdrop-blur-xs">
            <div className="bg-[#F8F7F4] border-2 border-[#111113] max-w-2xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-8 relative shadow-[6px_6px_0px_0px_#111113] sm:shadow-[10px_10px_0px_0px_#111113] space-y-5 sm:space-y-6">
              <div className="flex items-start justify-between border-b-2 border-[#111113] pb-4 gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
                    <span className="bg-[#FF4D00] text-white px-2 py-0.5 font-bold uppercase">
                      CLIENT DOSSIER
                    </span>
                    <span className="text-[#111113]/60 truncate">{activeRequest.id}</span>
                  </div>
                  <h2 className="font-syne font-bold text-xl sm:text-2xl text-[#111113] mt-1 break-words">
                    {activeRequest.business_name}
                  </h2>
                  <p className="font-sans text-xs text-[#111113]/70">
                    Contact: <strong>{activeRequest.client_name}</strong> • Region: <strong>{activeRequest.country}</strong>
                  </p>
                </div>

                <button
                  onClick={() => setActiveRequest(null)}
                  className="p-2 border-2 border-[#111113] hover:bg-[#111113] hover:text-[#F8F7F4] transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 font-mono text-xs">
                <div className="bg-white border-2 border-[#111113] p-3 space-y-1">
                  <span className="text-[10px] text-[#111113]/60 uppercase block">Requested Role</span>
                  <strong className="text-sm text-[#111113]">{activeRequest.role_title}</strong>
                </div>

                <div className="bg-white border-2 border-[#111113] p-3 space-y-1">
                  <span className="text-[10px] text-[#111113]/60 uppercase block">Expected Cost / Budget</span>
                  <strong className="text-sm text-[#FF4D00]">{activeRequest.expected_cost}</strong>
                </div>

                <div className="bg-white border-2 border-[#111113] p-3 space-y-1">
                  <span className="text-[10px] text-[#111113]/60 uppercase block">Timeline to Start</span>
                  <strong className="text-sm text-[#111113]">{activeRequest.timeline_to_start}</strong>
                </div>

                <div className="bg-white border-2 border-[#111113] p-3 space-y-1">
                  <span className="text-[10px] text-[#111113]/60 uppercase block">Submission Date</span>
                  <strong suppressHydrationWarning className="text-xs text-[#111113]">
                    {new Date(activeRequest.created_at).toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="bg-white border-2 border-[#111113] p-4 space-y-3 font-mono text-xs">
                <div className="font-bold text-[#111113] uppercase flex items-center justify-between border-b border-[#111113]/10 pb-2">
                  <span>Direct Communication Channels</span>
                  <span className="text-[10px] text-[#FF4D00]">Verified International Phone</span>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-2.5 border border-[#111113]/30 bg-[#F8F7F4]">
                    <div className="flex items-center gap-2 truncate">
                      <Phone className="w-4 h-4 text-[#FF4D00] shrink-0" />
                      <a href={`tel:${activeRequest.client_phone}`} className="font-bold text-[#111113] hover:underline truncate">
                        {activeRequest.client_phone}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(activeRequest.client_phone, 'phone')}
                      className="p-1 hover:text-[#FF4D00] transition-colors ml-2"
                      title="Copy phone"
                    >
                      {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2.5 border border-[#111113]/30 bg-[#F8F7F4]">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-4 h-4 text-[#FF4D00] shrink-0" />
                      <a href={`mailto:${activeRequest.client_email}`} className="font-bold text-[#111113] hover:underline truncate">
                        {activeRequest.client_email}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(activeRequest.client_email, 'email')}
                      className="p-1 hover:text-[#FF4D00] transition-colors ml-2"
                      title="Copy email"
                    >
                      {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {(isLoadingDetail || activeRequest.project_scope) && (
                <div className="bg-white border-2 border-[#111113] p-4 space-y-1.5">
                  <span className="font-mono text-[10px] text-[#111113]/60 uppercase block font-bold">
                    Contract Scope Brief Submitted by Customer:
                  </span>
                  {isLoadingDetail ? (
                    <span className="font-mono text-xs text-[#111113]/60 animate-pulse">
                      Loading contract scope details...
                    </span>
                  ) : (
                    <p className="font-sans text-xs text-[#111113] whitespace-pre-wrap leading-relaxed">
                      {activeRequest.project_scope}
                    </p>
                  )}
                </div>
              )}

              <div className="bg-orange-50/70 border-2 border-[#111113] p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-[#111113]">
                  <MessageSquare className="w-4 h-4 text-[#FF4D00]" />
                  <span>Recruiter Offline Review &amp; Contact Notes</span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[11px] uppercase font-bold text-[#111113] mb-1">
                      Engagement Pipeline Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as HireRequestStatus)}
                      className="w-full font-mono text-xs px-3 py-2 border-2 border-[#111113] bg-white text-[#111113] focus:outline-hidden focus:border-[#FF4D00]"
                    >
                      <option value="new">New (Needs Initial Call)</option>
                      <option value="contacted">Contacted Offline</option>
                      <option value="negotiating">In Negotiation / Profiles Sent</option>
                      <option value="contract_signed">Contract Signed / Deployed</option>
                      <option value="closed">Closed / Archived</option>
                    </select>
                  </div>

                  <div>
                    <span className="block font-mono text-[11px] uppercase font-bold text-[#111113] mb-1">
                      Active Status Details
                    </span>
                    <div className="font-mono text-xs p-2 border border-[#111113]/30 bg-white">
                      Current: <strong>{getHireRequestStatusMeta(editStatus).label}</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[11px] uppercase font-bold text-[#111113] mb-1">
                    Internal Recruiter Notes (Call Logs, Rates Agreed, Candidates Pitched):
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={4}
                    placeholder="Log offline call notes, agreed rates, client feedback, candidate profiles shared, or interview dates..."
                    className="w-full font-mono text-xs p-3 border-2 border-[#111113] bg-white text-[#111113] focus:outline-hidden focus:border-[#FF4D00]"
                  ></textarea>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveRequest(null)}
                    className="btn-brutalist text-xs py-2.5 px-4 min-h-[44px] flex items-center justify-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveReview}
                    className="btn-brutalist btn-brutalist-primary text-xs py-2.5 px-6 min-h-[44px] flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5 shrink-0" />
                    <span>{isSaving ? 'Saving...' : 'Save Review Notes'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* IN-APP DELETE CONFIRMATION MODAL */}
        {confirmDeleteItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-[#F8F7F4] border-2 border-[#111113] max-w-md w-full p-6 shadow-[8px_8px_0px_0px_#111113] space-y-4">
              <div className="font-mono text-xs uppercase font-bold text-rose-700">
                [Confirm Permanent Delete]
              </div>
              <p className="font-mono text-xs text-[#111113]">
                Are you sure you want to permanently delete the hire request from{' '}
                <strong>{confirmDeleteItem.business_name}</strong> ({confirmDeleteItem.client_name})? This cannot be undone.
              </p>
              <div className="pt-2 border-t border-[#111113]/20 flex justify-end gap-2 font-mono text-xs">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setConfirmDeleteItem(null)}
                  className="btn-brutalist py-1.5 px-3"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="btn-brutalist py-1.5 px-4 bg-rose-600 text-white border-[#111113] hover:bg-rose-700 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
