'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  HireRequest,
  HireRequestStatus,
  getHireRequestStatusMeta,
} from '@/types/hire-request';
import {
  getHireRequestsList,
  updateHireRequestStatusAndNotes,
  deleteHireRequest,
  resetMockHireRequests,
} from '@/lib/hire-request-store';
import {
  getCurrentHrUser,
  signOutHrRecruiter,
  isEmailAuthorizedForHr,
  HrUser,
  canAccessHireRequests,
  canManageRolesAndTech,
  canManageAdminUsers,
  canExportHireRequests,
  getRoleBadgeInfo
} from '@/lib/auth/recruiter-auth';
import { Navbar } from '@/components/Navbar';
import {
  Briefcase,
  Building2,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  Users,
  Cpu,
  KeyRound,
  Download,
  RotateCcw,
  Edit3,
  Trash2,
  X,
  Save,
  MessageSquare,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

export default function AdminHireRequestsPage() {
  const router = useRouter();

  const [hrUser, setHrUser] = useState<HrUser | null>(() => {
    if (typeof window === 'undefined') return null;
    const user = getCurrentHrUser();
    return user && user.email && isEmailAuthorizedForHr(user.email) ? user : null;
  });

  const [isAuthorized] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const user = getCurrentHrUser();
    return Boolean(user && user.email && isEmailAuthorizedForHr(user.email));
  });

  const [requests, setRequests] = useState<HireRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveSupabase, setIsLiveSupabase] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | HireRequestStatus>('all');

  // Selected request for offline drawer/modal
  const [activeRequest, setActiveRequest] = useState<HireRequest | null>(null);
  const [editStatus, setEditStatus] = useState<HireRequestStatus>('new');
  const [editNotes, setEditNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Auth gate: Restrict to Admins & Sales Executives (HR Executives redirected)
  useEffect(() => {
    if (!isAuthorized) {
      router.replace('/admin/login?error=auth_required');
      return;
    }
    if (hrUser && !canAccessHireRequests(hrUser.role)) {
      router.replace('/admin/dashboard?unauthorized=hire-requests');
      return;
    }
  }, [isAuthorized, hrUser, router]);

  // Load requests
  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const { requests: data, isLiveSupabase: live } = await getHireRequestsList();
      setRequests(data);
      setIsLiveSupabase(live);
    } catch (err) {
      console.error('Failed to load hire requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthorized) return;
    let isCancelled = false;
    getHireRequestsList()
      .then(({ requests: data, isLiveSupabase: live }) => {
        if (!isCancelled) {
          setRequests(data);
          setIsLiveSupabase(live);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to load hire requests:', err);
          setIsLoading(false);
        }
      });
    return () => {
      isCancelled = true;
    };
  }, [isAuthorized]);

  const handleOpenReview = (req: HireRequest) => {
    setActiveRequest(req);
    setEditStatus(req.status);
    setEditNotes(req.offline_notes || '');
  };

  // Metrics
  const metrics = useMemo(() => {
    return {
      total: requests.length,
      newCount: requests.filter((r) => r.status === 'new').length,
      contactedCount: requests.filter((r) => r.status === 'contacted').length,
      negotiatingCount: requests.filter((r) => r.status === 'negotiating').length,
      signedCount: requests.filter((r) => r.status === 'contract_signed').length,
    };
  }, [requests]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (statusFilter !== 'all' && req.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        req.client_name.toLowerCase().includes(q) ||
        req.business_name.toLowerCase().includes(q) ||
        req.client_email.toLowerCase().includes(q) ||
        req.role_title.toLowerCase().includes(q) ||
        req.country.toLowerCase().includes(q) ||
        req.client_phone.includes(q)
      );
    });
  }, [requests, statusFilter, searchQuery]);

  // Handle save offline review notes & status
  const handleSaveReview = async () => {
    if (!activeRequest) return;
    setIsSaving(true);
    try {
      const updated = await updateHireRequestStatusAndNotes(
        activeRequest.id,
        editStatus,
        editNotes
      );
      if (updated) {
        setRequests((prev) =>
          prev.map((r) => (r.id === activeRequest.id ? updated : r))
        );
        setActiveRequest(updated);
      }
    } catch (err) {
      console.error('Failed to update hire request:', err);
      alert('Error updating hire request');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this hire request?')) return;
    try {
      await deleteHireRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      if (activeRequest?.id === id) {
        setActiveRequest(null);
      }
    } catch (err) {
      console.error('Failed to delete request:', err);
    }
  };

  // Handle reset sample data
  const handleReset = async () => {
    if (confirm('Reset client hire requests to default demonstration records?')) {
      const resetData = await resetMockHireRequests();
      setRequests(resetData);
      setActiveRequest(null);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!canExportHireRequests(hrUser?.role)) {
      alert('Permission Restricted: Sales Executives are not authorized to download or export customer data.');
      return;
    }

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
      'Offline Notes',
    ];

    const rows = requests.map((r) => [
      `"${r.id}"`,
      `"${r.client_name}"`,
      `"${r.business_name}"`,
      `"${r.role_title}"`,
      `"${r.expected_cost}"`,
      `"${r.timeline_to_start}"`,
      `"${r.country}"`,
      `"${r.client_email}"`,
      `"${r.client_phone}"`,
      `"${r.status}"`,
      `"${r.created_at}"`,
      `"${(r.offline_notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `talentpulse_client_hire_requests_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!isAuthorized || !hrUser) {
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

          <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
            <Link
              href="/admin/dashboard"
              className="btn-brutalist text-xs py-1.5 px-3 flex items-center gap-1.5"
              title="Candidates Pipeline"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Candidates</span>
            </Link>

            {/* Roles & Technologies: Permitted to Admin and HR Executive */}
            {canManageRolesAndTech(hrUser.role) && (
              <Link
                href="/admin/roles"
                className="btn-brutalist text-xs py-1.5 px-3 flex items-center gap-1.5"
                title="Roles & Technologies Management"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Roles &amp; Tech</span>
              </Link>
            )}

            {/* Admin user management: Permitted only to Admin */}
            {canManageAdminUsers(hrUser.role) && (
              <Link
                href="/admin/users"
                className="btn-brutalist text-xs py-1.5 px-3 flex items-center gap-1.5"
                title="Admin user management"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Admins</span>
              </Link>
            )}

            <button
              onClick={handleReset}
              title="Reset sample client hire requests"
              className="btn-brutalist text-xs py-1.5 px-3"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>

            {/* Export Button: Available to Admin, Hidden/Restricted for Sales Executive */}
            {canExportHireRequests(hrUser.role) ? (
              <button
                onClick={handleExportCSV}
                className="btn-brutalist text-xs py-1.5 px-3"
                title="Download client requests as CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            ) : (
              <span 
                className="px-2 py-1 border border-dashed border-zinc-400 bg-zinc-100 text-zinc-500 text-[10px] font-mono uppercase font-bold"
                title="Sales Executives do not have export permissions"
              >
                Exports Restricted
              </span>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white border-2 border-[#111113] p-4 shadow-[2px_2px_0px_0px_#111113]">
            <span className="font-mono text-[10px] text-[#111113]/60 uppercase block">
              Total Inquiries
            </span>
            <span className="font-syne font-extrabold text-2xl text-[#111113]">
              {metrics.total}
            </span>
          </div>

          <div className="bg-white border-2 border-[#111113] p-4 shadow-[2px_2px_0px_0px_#111113]">
            <span className="font-mono text-[10px] text-[#FF4D00] uppercase block font-bold">
              New (Needs Offline Call)
            </span>
            <span className="font-syne font-extrabold text-2xl text-[#FF4D00]">
              {metrics.newCount}
            </span>
          </div>

          <div className="bg-white border-2 border-[#111113] p-4 shadow-[2px_2px_0px_0px_#111113]">
            <span className="font-mono text-[10px] text-blue-700 uppercase block font-bold">
              Contacted Offline
            </span>
            <span className="font-syne font-extrabold text-2xl text-blue-800">
              {metrics.contactedCount}
            </span>
          </div>

          <div className="bg-white border-2 border-[#111113] p-4 shadow-[2px_2px_0px_0px_#111113]">
            <span className="font-mono text-[10px] text-purple-700 uppercase block font-bold">
              In Negotiation
            </span>
            <span className="font-syne font-extrabold text-2xl text-purple-800">
              {metrics.negotiatingCount}
            </span>
          </div>

          <div className="bg-white border-2 border-[#111113] p-4 shadow-[2px_2px_0px_0px_#111113]">
            <span className="font-mono text-[10px] text-emerald-700 uppercase block font-bold">
              Contracts Signed
            </span>
            <span className="font-syne font-extrabold text-2xl text-emerald-800">
              {metrics.signedCount}
            </span>
          </div>
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
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="font-mono text-xs px-3 py-2 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] focus:outline-hidden focus:border-[#FF4D00]"
            >
              <option value="all">All Statuses ({requests.length})</option>
              <option value="new">New ({metrics.newCount})</option>
              <option value="contacted">Contacted ({metrics.contactedCount})</option>
              <option value="negotiating">In Negotiation ({metrics.negotiatingCount})</option>
              <option value="contract_signed">Contract Signed ({metrics.signedCount})</option>
              <option value="closed">Closed / Archived</option>
            </select>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white border-2 border-[#111113] shadow-[6px_6px_0px_0px_#111113] overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center font-mono text-xs text-[#111113]/60">
              Loading client hire requests...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center font-mono text-xs text-[#111113]/60 space-y-3">
              <p>No client hire requests found matching criteria.</p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="btn-brutalist text-xs py-1.5 px-3"
                >
                  Clear search
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
                  {filteredRequests.map((req) => {
                    const meta = getHireRequestStatusMeta(req.status);
                    const isSelected = activeRequest?.id === req.id;

                    return (
                      <tr
                        key={req.id}
                        className={`hover:bg-[#FF4D00]/5 transition-colors ${
                          isSelected ? 'bg-orange-50/80' : ''
                        }`}
                      >
                        {/* Status */}
                        <td className="p-3 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${meta.color}`}
                          >
                            {meta.label}
                          </span>
                        </td>

                        {/* Company & Contact */}
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

                        {/* Role Requested */}
                        <td className="p-3">
                          <span className="font-bold text-[#111113]">{req.role_title}</span>
                        </td>

                        {/* Budget */}
                        <td className="p-3 whitespace-nowrap">
                          <span className="font-bold text-[#FF4D00]">{req.expected_cost}</span>
                        </td>

                        {/* Timeline */}
                        <td className="p-3 whitespace-nowrap text-[#111113]/80">
                          {req.timeline_to_start}
                        </td>

                        {/* Contact details */}
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

                        {/* Offline Notes preview */}
                        <td className="p-3 max-w-xs">
                          <p className="text-[11px] text-[#111113]/70 truncate" title={req.offline_notes}>
                            {req.offline_notes || 'No offline notes logged yet'}
                          </p>
                        </td>

                        {/* Actions */}
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
                              onClick={() => handleDelete(req.id)}
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
        </div>

        {/* Offline Review & Detail Modal / Drawer */}
        {activeRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111113]/70 backdrop-blur-xs">
            <div className="bg-[#F8F7F4] border-2 border-[#111113] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative shadow-[10px_10px_0px_0px_#111113] space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b-2 border-[#111113] pb-4">
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="bg-[#FF4D00] text-white px-2 py-0.5 font-bold uppercase">
                      CLIENT DOSSIER
                    </span>
                    <span className="text-[#111113]/60">{activeRequest.id}</span>
                  </div>
                  <h2 className="font-syne font-bold text-2xl text-[#111113] mt-1">
                    {activeRequest.business_name}
                  </h2>
                  <p className="font-sans text-xs text-[#111113]/70">
                    Contact: <strong>{activeRequest.client_name}</strong> • Region: <strong>{activeRequest.country}</strong>
                  </p>
                </div>

                <button
                  onClick={() => setActiveRequest(null)}
                  className="p-1 border-2 border-[#111113] hover:bg-[#111113] hover:text-[#F8F7F4] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Requirement Summary Cards */}
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
                  <strong className="text-xs text-[#111113]">
                    {new Date(activeRequest.created_at).toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Direct Offline Contact Details */}
              <div className="bg-white border-2 border-[#111113] p-4 space-y-3 font-mono text-xs">
                <div className="font-bold text-[#111113] uppercase flex items-center justify-between border-b border-[#111113]/10 pb-2">
                  <span>Direct Communication Channels</span>
                  <span className="text-[10px] text-[#FF4D00]">Verified International Phone</span>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {/* Phone */}
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

                  {/* Email */}
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

              {/* Project Brief */}
              {activeRequest.project_scope && (
                <div className="bg-white border-2 border-[#111113] p-4 space-y-1.5">
                  <span className="font-mono text-[10px] text-[#111113]/60 uppercase block font-bold">
                    Contract Scope Brief Submitted by Customer:
                  </span>
                  <p className="font-sans text-xs text-[#111113] whitespace-pre-wrap leading-relaxed">
                    {activeRequest.project_scope}
                  </p>
                </div>
              )}

              {/* Recruiter Offline Status & Contact Notes Editor */}
              <div className="bg-orange-50/70 border-2 border-[#111113] p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-[#111113]">
                  <MessageSquare className="w-4 h-4 text-[#FF4D00]" />
                  <span>Recruiter Offline Review &amp; Contact Notes</span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Status update */}
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

                {/* Offline Notes */}
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

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveRequest(null)}
                    className="btn-brutalist text-xs py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveReview}
                    className="btn-brutalist btn-brutalist-primary text-xs py-2 px-6 flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save Review Notes'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
