'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Role,
  Technology,
  RoleStatus,
  TechnologyStatus,
} from '@/types/roles-tech';
import {
  getRolesList,
  createRoleRecord,
  updateRoleRecord,
  deleteRoleRecord,
  updateTechnologyRecord,
  deleteTechnologyRecord,
  submitCustomTechnology,
} from '@/lib/roles-tech-store';
import {
  useCurrentHrUser,
  canManageRolesAndTech,
  canAccessHireRequests,
  canManageAdminUsers,
  getRoleBadgeInfo,
  getAdminAuthHeaders,
} from '@/lib/auth/recruiter-auth';
import { Navbar } from '@/components/Navbar';
import { RichTextEditor } from '@/components/RichTextEditor';
import {
  Layers,
  Terminal,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
  Check,
  X,
  Search,
  Users,
  Briefcase,
  CheckSquare,
  Square,
} from 'lucide-react';

const TECH_PAGE_SIZE = 25;

export default function AdminRolesManagementPage() {
  const router = useRouter();
  const hrUser = useCurrentHrUser();

  const [activeTab, setActiveTab] = useState<'roles' | 'pending' | 'approved' | 'rejected'>('roles');
  const [roles, setRoles] = useState<Role[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [techTotal, setTechTotal] = useState(0);
  const [techPage, setTechPage] = useState(1);
  const [techStatusCounts, setTechStatusCounts] = useState<{
    pending: number;
    approved: number;
    rejected: number;
  }>({ pending: 0, approved: 0, rejected: 0 });

  const [roleCandidateCounts, setRoleCandidateCounts] = useState<Record<string, number>>({});
  const [techNameCounts, setTechNameCounts] = useState<Record<string, number>>({});

  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isLoadingTechs, setIsLoadingTechs] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Selection & Bulk Moderation State
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Search filter across tech tabs (server-side debounced)
  const [techSearch, setTechSearch] = useState('');
  const [debouncedTechSearch, setDebouncedTechSearch] = useState('');

  // Edit / Create Role Drawer State
  const [isRoleDrawerOpen, setIsRoleDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleFormTitle, setRoleFormTitle] = useState('');
  const [roleFormSlug, setRoleFormSlug] = useState('');
  const [roleFormShortDesc, setRoleFormShortDesc] = useState('');
  const [roleFormDesc, setRoleFormDesc] = useState('');
  const [roleFormStatus, setRoleFormStatus] = useState<RoleStatus>('open');
  const [roleFormTechIds, setRoleFormTechIds] = useState<string[]>([]);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [approvedTechOptions, setApprovedTechOptions] = useState<Technology[]>([]);
  const [isLoadingApprovedOptions, setIsLoadingApprovedOptions] = useState(false);
  const [drawerTechFilter, setDrawerTechFilter] = useState('');

  // New Tech Modal State
  const [isNewTechModalOpen, setIsNewTechModalOpen] = useState(false);
  const [newTechName, setNewTechName] = useState('');
  const [newTechIsFeatured, setNewTechIsFeatured] = useState(false);
  const [isCreatingTech, setIsCreatingTech] = useState(false);

  // In-app delete confirmation modal (replaces window.confirm for iframe safety)
  const [confirmDelete, setConfirmDelete] = useState<
    | { type: 'role'; item: Role }
    | { type: 'tech'; item: Technology }
    | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showNotice = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
  }, []);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 6000);
    return () => clearTimeout(timer);
  }, [notification]);

  // Debounce search query before querying /api/technologies
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTechSearch(techSearch);
      setTechPage(1);
    }, 280);
    return () => clearTimeout(timer);
  }, [techSearch]);

  const hrEmail = hrUser?.email;
  const hrRole = hrUser?.role;

  // Strict Auth Gate
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!hrEmail || !hrRole) {
      router.replace('/admin/login?redirect=/admin/roles');
    } else if (!canManageRolesAndTech(hrRole)) {
      router.replace('/admin/dashboard?unauthorized=roles');
    }
  }, [hrEmail, hrRole, router]);

  // 1. Initial Lightweight Load: Roles + Pre-Aggregated DB Stats (ZERO candidate resume blobs)
  const refreshRolesAndStats = useCallback(async () => {
    setIsLoadingRoles(true);
    try {
      const authHeaders = getAdminAuthHeaders();
      const [rolesRes, statsRes] = await Promise.all([
        fetch('/api/roles?includeClosed=true', { headers: authHeaders }),
        fetch('/api/admin/roles-tech-stats', { headers: authHeaders }),
      ]);

      const rolesJson = await rolesRes.json();
      const fetchedRoles: Role[] =
        rolesJson.success && Array.isArray(rolesJson.roles)
          ? rolesJson.roles
          : await getRolesList(true);
      setRoles(fetchedRoles);

      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        if (statsJson.success) {
          setRoleCandidateCounts(statsJson.roleCountsById || {});
          setTechNameCounts(statsJson.techNameCounts || {});
          if (statsJson.techStatusCounts) {
            setTechStatusCounts(statsJson.techStatusCounts);
          }
        }
      }
    } catch (err: any) {
      showNotice('error', `Failed to load roles & metrics: ${err.message}`);
    } finally {
      setIsLoadingRoles(false);
    }
  }, [showNotice]);

  useEffect(() => {
    if (!hrEmail || !hrRole || !canManageRolesAndTech(hrRole)) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        refreshRolesAndStats();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [hrEmail, hrRole, refreshRolesAndStats]);

  // 2. Paginated Server-Side Load for Technologies when viewing a tech tab
  const fetchPaginatedTechs = useCallback(
    async (statusTab: 'pending' | 'approved' | 'rejected', pageNum: number, searchVal: string) => {
      setIsLoadingTechs(true);
      try {
        const authHeaders = getAdminAuthHeaders();
        const params = new URLSearchParams({
          status: statusTab,
          page: String(pageNum),
          limit: String(TECH_PAGE_SIZE),
          includeCounts: 'true',
        });
        if (searchVal.trim()) {
          params.set('query', searchVal.trim());
        }

        const res = await fetch(`/api/technologies?${params.toString()}`, {
          headers: authHeaders,
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to load technologies');
        }

        setTechnologies(json.technologies || []);
        setTechTotal(typeof json.total === 'number' ? json.total : (json.technologies || []).length);
        if (json.counts) {
          setTechStatusCounts({
            pending: json.counts.pending || 0,
            approved: json.counts.approved || 0,
            rejected: json.counts.rejected || 0,
          });
        }
        setSelectedTechIds([]);
      } catch (err: any) {
        showNotice('error', err.message || 'Failed to load technologies');
      } finally {
        setIsLoadingTechs(false);
      }
    },
    [showNotice]
  );

  useEffect(() => {
    if (!hrEmail || !hrRole || !canManageRolesAndTech(hrRole)) return;
    if (activeTab === 'roles') return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        fetchPaginatedTechs(activeTab, techPage, debouncedTechSearch);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [hrEmail, hrRole, activeTab, techPage, debouncedTechSearch, fetchPaginatedTechs]);

  // Lazily load full approved tech list when opening the Role Drawer
  const ensureApprovedOptionsLoaded = useCallback(async (force = false) => {
    if (!force && approvedTechOptions.length > 0) return;
    setIsLoadingApprovedOptions(true);
    try {
      const res = await fetch('/api/technologies?status=approved&limit=500', {
        headers: getAdminAuthHeaders(),
      });
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.technologies)) {
        setApprovedTechOptions(json.technologies);
      }
    } catch (err) {
      console.warn('Failed to load approved technology options:', err);
    } finally {
      setIsLoadingApprovedOptions(false);
    }
  }, [approvedTechOptions.length]);

  const handleTabChange = (tab: 'roles' | 'pending' | 'approved' | 'rejected') => {
    setActiveTab(tab);
    setTechPage(1);
    setSelectedTechIds([]);
  };

  if (!hrUser) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] text-[#111113] flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-4 p-8 bg-white border-2 border-[#111113] shadow-[6px_6px_0px_0px_#111113]">
            <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] font-bold">
              [403 - RESTRICTED ACCESS]
            </div>
            <h2 className="font-syne font-extrabold text-2xl text-[#111113]">
              Admin Authentication Required
            </h2>
            <p className="font-mono text-xs text-[#111113]/70">
              Only authorized TalentPulse Direct administrators can manage roles and technology moderation.
            </p>
            <Link href="/admin/login?redirect=/admin/roles" className="btn-brutalist btn-brutalist-primary py-2.5">
              Sign In as Admin →
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Handle open/close toggle for a role
  const handleToggleRoleStatus = async (role: Role) => {
    try {
      const newStatus: RoleStatus = role.status === 'open' ? 'closed' : 'open';
      await updateRoleRecord(role.id, { status: newStatus });
      setRoles((prev) => prev.map((r) => (r.id === role.id ? { ...r, status: newStatus } : r)));
      showNotice('success', `Role "${role.title}" is now ${newStatus.toUpperCase()}`);
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  // Open edit role drawer
  const handleOpenEditRole = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setRoleFormTitle(role.title);
      setRoleFormSlug(role.slug);
      setRoleFormShortDesc(role.short_description || '');
      setRoleFormDesc(role.description || '');
      setRoleFormStatus(role.status);
      setRoleFormTechIds((role.technologies || []).map((t) => t.id));
    } else {
      setEditingRole(null);
      setRoleFormTitle('');
      setRoleFormSlug('');
      setRoleFormShortDesc('');
      setRoleFormDesc(
        '### Role Overview\nDescribe the core objectives of this track.\n\n### Key Responsibilities\n- Responsibility 1\n- Responsibility 2\n\n### Requirements & Delivery Standards\n- Minimum years of experience\n- Timezone overlap commitment'
      );
      setRoleFormStatus('open');
      setRoleFormTechIds([]);
    }
    setDrawerTechFilter('');
    setIsRoleDrawerOpen(true);
    ensureApprovedOptionsLoaded();
  };

  // Save role (create or update)
  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleFormTitle.trim()) {
      showNotice('error', 'Role title is required');
      return;
    }

    setIsSavingRole(true);
    try {
      if (editingRole) {
        const updated = await updateRoleRecord(editingRole.id, {
          title: roleFormTitle,
          slug: roleFormSlug || undefined,
          short_description: roleFormShortDesc,
          description: roleFormDesc,
          status: roleFormStatus,
          technology_ids: roleFormTechIds,
        });
        setRoles((prev) => prev.map((r) => (r.id === editingRole.id ? updated : r)));
        showNotice('success', `Role "${roleFormTitle}" updated successfully`);
      } else {
        const created = await createRoleRecord({
          title: roleFormTitle,
          slug: roleFormSlug || undefined,
          short_description: roleFormShortDesc,
          description: roleFormDesc,
          status: roleFormStatus,
          technology_ids: roleFormTechIds,
        });
        setRoles((prev) => [...prev, created]);
        showNotice('success', `New role "${roleFormTitle}" created successfully`);
      }
      setIsRoleDrawerOpen(false);
    } catch (err: any) {
      showNotice('error', err.message);
    } finally {
      setIsSavingRole(false);
    }
  };

  // Request delete confirmation for role
  const requestDeleteRole = (role: Role) => {
    const candidateCount = roleCandidateCounts[role.id] || 0;
    if (candidateCount > 0) {
      showNotice(
        'error',
        `Cannot delete role "${role.title}" because it is associated with ${candidateCount} candidate(s). Please close the role instead.`
      );
      return;
    }
    setConfirmDelete({ type: 'role', item: role });
  };

  // Request delete confirmation for technology
  const requestDeleteTech = (tech: Technology) => {
    const candidateCount = techNameCounts[tech.name.toLowerCase().trim()] || 0;
    if (candidateCount > 0) {
      showNotice(
        'error',
        `Cannot delete technology "${tech.name}" because it is associated with ${candidateCount} candidate(s). You can reject or hide it instead.`
      );
      return;
    }
    setConfirmDelete({ type: 'tech', item: tech });
  };

  // Execute confirmed delete without full-page reload
  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);
    try {
      if (confirmDelete.type === 'role') {
        const role = confirmDelete.item;
        const res = await deleteRoleRecord(role.id);
        if (!res.success) {
          showNotice('error', res.error || 'Failed to delete role');
          return;
        }
        setRoles((prev) => prev.filter((r) => r.id !== role.id));
        showNotice('success', `Role "${role.title}" deleted.`);
      } else {
        const tech = confirmDelete.item;
        const res = await deleteTechnologyRecord(tech.id);
        if (!res.success) {
          showNotice('error', res.error || 'Failed to delete technology');
          return;
        }
        showNotice('success', `Technology "${tech.name}" deleted.`);
        setApprovedTechOptions((prev) => prev.filter((t) => t.id !== tech.id));
        if (activeTab !== 'roles') {
          await fetchPaginatedTechs(activeTab, techPage, debouncedTechSearch);
        }
      }
      setConfirmDelete(null);
    } catch (err: any) {
      showNotice('error', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Moderate a single technology: Approve or Reject
  const handleModerateTech = async (tech: Technology, targetStatus: TechnologyStatus) => {
    try {
      await updateTechnologyRecord(tech.id, { status: targetStatus });
      showNotice('success', `Technology "${tech.name}" is now ${targetStatus.toUpperCase()}`);
      setApprovedTechOptions([]); // invalidate drawer options cache so newly approved/rejected techs reflect

      if (activeTab !== 'roles') {
        const nextPage =
          technologies.length === 1 && techPage > 1 ? techPage - 1 : techPage;
        if (nextPage !== techPage) {
          setTechPage(nextPage);
        } else {
          await fetchPaginatedTechs(activeTab, nextPage, debouncedTechSearch);
        }
      }
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  // Bulk Moderate Selected Technologies (Single SQL UPDATE via PATCH /api/technologies)
  const handleBulkModerate = async (targetStatus: TechnologyStatus) => {
    if (selectedTechIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      const res = await fetch('/api/technologies', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminAuthHeaders(),
        },
        body: JSON.stringify({ ids: selectedTechIds, status: targetStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Bulk update failed');
      }

      showNotice(
        'success',
        `Updated ${json.updatedCount || selectedTechIds.length} technology item(s) to ${targetStatus.toUpperCase()}.`
      );
      setApprovedTechOptions([]);
      setSelectedTechIds([]);

      if (activeTab !== 'roles') {
        const remainingOnPage = technologies.length - selectedTechIds.length;
        const nextPage = remainingOnPage <= 0 && techPage > 1 ? techPage - 1 : techPage;
        if (nextPage !== techPage) {
          setTechPage(nextPage);
        } else {
          await fetchPaginatedTechs(activeTab, nextPage, debouncedTechSearch);
        }
      }
    } catch (err: any) {
      showNotice('error', err.message || 'Bulk moderation failed');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const toggleSelectTech = (id: string) => {
    setSelectedTechIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const allOnPageSelected =
    technologies.length > 0 && technologies.every((t) => selectedTechIds.includes(t.id));

  const handleToggleSelectAllOnPage = () => {
    if (allOnPageSelected) {
      setSelectedTechIds([]);
    } else {
      setSelectedTechIds(technologies.map((t) => t.id));
    }
  };

  // Add new technology directly from admin
  const handleCreateNewTech = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTechName.trim()) return;

    setIsCreatingTech(true);
    try {
      const res = await submitCustomTechnology(newTechName.trim());
      await updateTechnologyRecord(res.technology.id, {
        status: 'approved',
        is_featured: newTechIsFeatured,
      });

      showNotice('success', `Technology "${newTechName.trim()}" added to approved library`);
      setNewTechName('');
      setNewTechIsFeatured(false);
      setIsNewTechModalOpen(false);
      setApprovedTechOptions([]);

      if (activeTab === 'approved') {
        await fetchPaginatedTechs('approved', 1, debouncedTechSearch);
        setTechPage(1);
      } else {
        setTechStatusCounts((prev) => ({
          ...prev,
          approved: prev.approved + 1,
        }));
      }
    } catch (err: any) {
      showNotice('error', err.message);
    } finally {
      setIsCreatingTech(false);
    }
  };

  const techTotalPages = Math.max(1, Math.ceil(techTotal / TECH_PAGE_SIZE));
  const safeTechPage = Math.min(techPage, techTotalPages);

  const filteredDrawerOptions = approvedTechOptions.filter((t) => {
    if (!drawerTechFilter.trim()) return true;
    return t.name.toLowerCase().includes(drawerTechFilter.toLowerCase());
  });

  const renderTechPagination = () => {
    if (techTotal === 0) return null;
    const startRecord = (safeTechPage - 1) * TECH_PAGE_SIZE + 1;
    const endRecord = Math.min(startRecord + technologies.length - 1, techTotal);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#111113]/15 font-mono text-xs">
        <div className="text-[#111113]/80">
          Showing <span className="font-bold text-[#FF4D00]">[{startRecord}–{endRecord}]</span> of{' '}
          <span className="font-bold text-[#111113]">{techTotal}</span> items ({TECH_PAGE_SIZE} per page)
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={safeTechPage <= 1 || isLoadingTechs}
            onClick={() => setTechPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 border-2 border-[#111113] uppercase font-bold text-xs bg-white hover:bg-[#111113] hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          <span className="px-2 font-bold">
            Page {safeTechPage} / {techTotalPages}
          </span>
          <button
            type="button"
            disabled={safeTechPage >= techTotalPages || isLoadingTechs}
            onClick={() => setTechPage((p) => Math.min(techTotalPages, p + 1))}
            className="px-3 py-1.5 border-2 border-[#111113] uppercase font-bold text-xs bg-white hover:bg-[#111113] hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </div>
    );
  };

  if (!hrUser || !canManageRolesAndTech(hrUser.role)) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-[#111113] border-t-[#FF4D00] animate-spin mb-4" />
        <span className="font-mono text-xs uppercase tracking-widest text-[#111113]/70">
          Verifying Permissions...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#111113] flex flex-col font-sans selection:bg-[#FF4D00] selection:text-white">
      <Navbar />

      <main className="flex-1 py-8 px-4 sm:px-[4vw] max-w-7xl mx-auto w-full space-y-6">
        {/* Notification Banner */}
        {notification && (
          <div
            className={`p-4 border-2 font-mono text-xs flex items-center justify-between shadow-[4px_4px_0px_0px_#111113] ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-[#111113]'
                : 'bg-rose-50 text-rose-900 border-[#111113]'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="p-1 hover:bg-black/10 font-bold">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Admin Navigation & Action Bar */}
        <div className="p-5 bg-white border-2 border-[#111113] shadow-[4px_4px_0px_0px_#111113] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
              <span className="font-syne font-extrabold text-xl text-[#111113]">
                ROLES &amp; TECHNOLOGIES CONSOLE
              </span>
              {(() => {
                const roleInfo = getRoleBadgeInfo(hrUser.role);
                return (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${roleInfo.badgeClass}`}
                  >
                    {roleInfo.label}
                  </span>
                );
              })()}
            </div>
            <p className="font-mono text-xs text-[#111113]/70 mt-1">
              Configure open/closed tracks, write formatted job descriptions, and moderate candidate skills.
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none max-w-full sm:flex-wrap font-mono text-xs">
            <Link
              href="/admin/dashboard"
              className="btn-brutalist text-xs py-2 sm:py-1.5 px-3 flex items-center gap-1.5 shrink-0 min-h-[44px] sm:min-h-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span>Candidates</span>
            </Link>

            {canAccessHireRequests(hrUser.role) && (
              <Link
                href="/admin/hire-requests"
                className="btn-brutalist text-xs py-2 sm:py-1.5 px-3 flex items-center gap-1.5 shrink-0 min-h-[44px] sm:min-h-0"
                title="Review client hire requests and manage offline outreach"
              >
                <Briefcase className="w-3.5 h-3.5 shrink-0" />
                <span>Hire Requests</span>
              </Link>
            )}

            {canManageAdminUsers(hrUser.role) && (
              <Link
                href="/admin/users"
                className="btn-brutalist text-xs py-2 sm:py-1.5 px-3 flex items-center gap-1.5 shrink-0 min-h-[44px] sm:min-h-0"
                title="Admin team management"
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Admins</span>
              </Link>
            )}

            <button
              onClick={() => handleOpenEditRole()}
              className="btn-brutalist btn-brutalist-primary text-xs py-2 sm:py-1.5 px-3 flex items-center gap-1.5 shrink-0 min-h-[44px] sm:min-h-0"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>New Role</span>
            </button>

            <button
              onClick={() => setIsNewTechModalOpen(true)}
              className="btn-brutalist text-xs py-2 sm:py-1.5 px-3 flex items-center gap-1.5 shrink-0 min-h-[44px] sm:min-h-0"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>New Technology</span>
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b-2 border-[#111113] pb-px overflow-x-auto">
          <button
            onClick={() => handleTabChange('roles')}
            className={`px-4 py-2 font-mono text-xs uppercase font-bold border-t-2 border-x-2 border-[#111113] flex items-center gap-2 transition-colors ${
              activeTab === 'roles'
                ? 'bg-white text-[#111113] -mb-0.5 border-b-2 border-b-white'
                : 'bg-[#F8F7F4] text-[#111113]/60 hover:text-[#111113]'
            }`}
          >
            <Layers className="w-4 h-4 text-[#FF4D00]" />
            <span>Roles Management ({roles.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('pending')}
            className={`px-4 py-2 font-mono text-xs uppercase font-bold border-t-2 border-x-2 border-[#111113] flex items-center gap-2 transition-colors ${
              activeTab === 'pending'
                ? 'bg-white text-[#111113] -mb-0.5 border-b-2 border-b-white'
                : 'bg-[#F8F7F4] text-[#111113]/60 hover:text-[#111113]'
            }`}
          >
            <Terminal className="w-4 h-4 text-[#FF4D00]" />
            <span>Moderation Queue</span>
            {techStatusCounts.pending > 0 && (
              <span className="bg-[#FF4D00] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {techStatusCounts.pending}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('approved')}
            className={`px-4 py-2 font-mono text-xs uppercase font-bold border-t-2 border-x-2 border-[#111113] flex items-center gap-2 transition-colors ${
              activeTab === 'approved'
                ? 'bg-white text-[#111113] -mb-0.5 border-b-2 border-b-white'
                : 'bg-[#F8F7F4] text-[#111113]/60 hover:text-[#111113]'
            }`}
          >
            <span>Approved Library ({techStatusCounts.approved})</span>
          </button>

          <button
            onClick={() => handleTabChange('rejected')}
            className={`px-4 py-2 font-mono text-xs uppercase font-bold border-t-2 border-x-2 border-[#111113] flex items-center gap-2 transition-colors ${
              activeTab === 'rejected'
                ? 'bg-white text-[#111113] -mb-0.5 border-b-2 border-b-white'
                : 'bg-[#F8F7F4] text-[#111113]/60 hover:text-[#111113]'
            }`}
          >
            <span>Rejected ({techStatusCounts.rejected})</span>
          </button>
        </div>

        {/* TAB 1: ROLES MANAGEMENT */}
        {activeTab === 'roles' && (
          <div className="space-y-4">
            {isLoadingRoles ? (
              <div className="p-12 bg-white border-2 border-[#111113] shadow-[4px_4px_0px_0px_#111113] flex flex-col items-center justify-center gap-3 font-mono text-xs">
                <div className="w-8 h-8 border-4 border-[#111113] border-t-[#FF4D00] animate-spin" />
                <span className="uppercase tracking-wider text-[#111113]/70">Loading roles...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((role) => {
                  const isOpen = role.status === 'open';
                  const candidateCount = roleCandidateCounts[role.id] || 0;
                  const techCount = role.technologies?.length || 0;

                  return (
                    <div
                      key={role.id}
                      className="p-5 bg-white border-2 border-[#111113] shadow-[4px_4px_0px_0px_#111113] flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => handleToggleRoleStatus(role)}
                            className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 border cursor-pointer hover:opacity-80 transition ${
                              isOpen
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200'
                            }`}
                            title={
                              isOpen
                                ? 'Click to close role (moves to Future Tracks)'
                                : 'Click to open role (moves to Active Tracks)'
                            }
                          >
                            {isOpen ? '● Open Track' : '○ Closed (Future)'}
                          </button>

                          <span className="font-mono text-[10px] text-[#111113]/60 uppercase">
                            Slug: {role.slug}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-syne font-bold text-xl text-[#111113]">{role.title}</h3>
                          <p className="font-mono text-xs text-[#111113]/70 mt-1 line-clamp-2">
                            {role.short_description || 'No short description provided.'}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#111113]/10 font-mono text-[11px]">
                          <div>
                            <span className="text-[#111113]/60 block text-[9px] uppercase">Candidates</span>
                            <strong className="text-sm font-bold text-[#111113]">{candidateCount}</strong>
                          </div>
                          <div>
                            <span className="text-[#111113]/60 block text-[9px] uppercase">
                              Approved Techs
                            </span>
                            <strong className="text-sm font-bold text-[#111113]">{techCount}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t-2 border-[#111113]/10 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleRoleStatus(role)}
                            className={`px-2.5 py-1 text-[11px] font-mono uppercase font-bold border transition-colors ${
                              isOpen
                                ? 'border-zinc-400 text-zinc-700 hover:bg-zinc-100'
                                : 'border-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                            }`}
                            title={
                              isOpen
                                ? 'Close this role (moves to Future Tracks)'
                                : 'Open this role (moves to Active Tracks)'
                            }
                          >
                            {isOpen ? 'Close Role' : 'Open Role'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditRole(role)}
                            className="p-1 border border-[#111113] hover:bg-[#111113] hover:text-white transition-colors"
                            title="Edit role & description"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <Link
                            href={`/roles/${role.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 border border-[#111113] hover:bg-[#111113] hover:text-white transition-colors"
                            title="Preview public role page in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>

                        <button
                          type="button"
                          onClick={() => requestDeleteRole(role)}
                          className={`p-1 border ${
                            candidateCount > 0
                              ? 'border-zinc-300 text-zinc-400 cursor-not-allowed'
                              : 'border-rose-300 text-rose-600 hover:bg-rose-500 hover:text-white'
                          }`}
                          title={
                            candidateCount > 0
                              ? `Cannot delete: ${candidateCount} candidates linked`
                              : 'Delete unused role'
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SHARED TECHNOLOGY TOOLBAR (Search + Bulk Actions for Tabs 2, 3, 4) */}
        {activeTab !== 'roles' && (
          <div className="p-6 bg-white border-2 border-[#111113] shadow-[4px_4px_0px_0px_#111113] space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-syne font-bold text-lg text-[#111113]">
                  {activeTab === 'pending' &&
                    `Candidate-Submitted Custom Technologies (${techStatusCounts.pending})`}
                  {activeTab === 'approved' &&
                    `Approved Technologies (${techStatusCounts.approved})`}
                  {activeTab === 'rejected' &&
                    `Rejected Technologies (${techStatusCounts.rejected})`}
                </h3>
                <p className="font-mono text-xs text-[#111113]/70">
                  {activeTab === 'pending' &&
                    'Review custom tools typed by candidates. Use checkboxes to bulk-approve or bulk-reject items page by page.'}
                  {activeTab === 'approved' &&
                    'Master library of active skills shown in application selectors.'}
                  {activeTab === 'rejected' &&
                    'These technologies are hidden from candidates and the public overview.'}
                </p>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#111113]/40" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab} skills...`}
                  value={techSearch}
                  onChange={(e) => setTechSearch(e.target.value)}
                  className="w-full font-mono text-xs pl-8 pr-3 py-2 border-2 border-[#111113] bg-[#F8F7F4]"
                />
              </div>
            </div>

            {/* Bulk Moderation Bar */}
            {technologies.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#F8F7F4] border border-[#111113] font-mono text-xs">
                <button
                  type="button"
                  onClick={handleToggleSelectAllOnPage}
                  className="flex items-center gap-2 font-bold hover:text-[#FF4D00] transition"
                >
                  {allOnPageSelected ? (
                    <CheckSquare className="w-4 h-4 text-[#FF4D00]" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  <span>
                    {allOnPageSelected
                      ? `Deselect Page (${technologies.length})`
                      : `Select Page (${technologies.length})`}
                  </span>
                </button>

                {selectedTechIds.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-[#111113]/70">
                      {selectedTechIds.length} selected:
                    </span>
                    {activeTab !== 'approved' && (
                      <button
                        type="button"
                        disabled={isBulkUpdating}
                        onClick={() => handleBulkModerate('approved')}
                        className="btn-brutalist btn-brutalist-primary text-xs py-1 px-3 flex items-center gap-1 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>
                          {activeTab === 'rejected' ? 'Restore Selected' : 'Approve Selected'}
                        </span>
                      </button>
                    )}
                    {activeTab !== 'rejected' && (
                      <button
                        type="button"
                        disabled={isBulkUpdating}
                        onClick={() => handleBulkModerate('rejected')}
                        className="btn-brutalist text-xs py-1 px-3 text-rose-700 border-rose-400 hover:bg-rose-500 hover:text-white flex items-center gap-1 disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject Selected</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Loading State */}
            {isLoadingTechs ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3 font-mono text-xs border border-dashed border-[#111113]/30">
                <div className="w-7 h-7 border-4 border-[#111113] border-t-[#FF4D00] animate-spin" />
                <span className="uppercase tracking-wider text-[#111113]/70">
                  Loading {activeTab} technologies...
                </span>
              </div>
            ) : technologies.length === 0 ? (
              <div className="p-12 text-center font-mono text-xs text-[#111113]/60 border-2 border-dashed border-[#111113]/30">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                {debouncedTechSearch.trim()
                  ? `No ${activeTab} technologies matched "${debouncedTechSearch}".`
                  : activeTab === 'pending'
                  ? 'Moderation queue is clean. Zero pending candidate technologies.'
                  : `No ${activeTab} technologies found.`}
              </div>
            ) : (
              <>
                {/* TAB 2: PENDING LIST */}
                {activeTab === 'pending' && (
                  <div className="divide-y divide-[#111113]/10 border border-[#111113]">
                    {technologies.map((tech) => {
                      const isChecked = selectedTechIds.includes(tech.id);
                      const count = techNameCounts[tech.name.toLowerCase().trim()] || 0;
                      return (
                        <div
                          key={tech.id}
                          className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8F7F4] ${
                            isChecked ? 'bg-amber-50/70' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectTech(tech.id)}
                              className="mt-1 w-4 h-4 accent-[#FF4D00] cursor-pointer"
                              aria-label={`Select ${tech.name}`}
                            />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-sm text-[#111113]">
                                  {tech.name}
                                </span>
                                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-mono px-2 py-0.2 uppercase font-bold">
                                  Pending Review
                                </span>
                                {count > 0 && (
                                  <span className="font-mono text-[10px] text-[#111113]/70">
                                    ({count} Candidate{count === 1 ? '' : 's'})
                                  </span>
                                )}
                              </div>
                              <span
                                suppressHydrationWarning
                                className="font-mono text-[10px] text-[#111113]/50 block mt-0.5"
                              >
                                Submitted on: {new Date(tech.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleModerateTech(tech, 'approved')}
                              className="btn-brutalist btn-brutalist-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleModerateTech(tech, 'rejected')}
                              className="btn-brutalist text-xs py-1.5 px-3 text-rose-700 hover:bg-rose-500 hover:text-white border-rose-300 flex items-center gap-1.5"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* TAB 3: APPROVED GRID */}
                {activeTab === 'approved' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {technologies.map((tech) => {
                      const count = techNameCounts[tech.name.toLowerCase().trim()] || 0;
                      const isChecked = selectedTechIds.includes(tech.id);
                      return (
                        <div
                          key={tech.id}
                          className={`p-3 border-2 border-[#111113] flex items-center justify-between gap-2 ${
                            isChecked ? 'bg-amber-50' : 'bg-[#F8F7F4]'
                          }`}
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectTech(tech.id)}
                              className="mt-0.5 w-3.5 h-3.5 accent-[#FF4D00] cursor-pointer shrink-0"
                              aria-label={`Select ${tech.name}`}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono text-xs font-bold text-[#111113] truncate">
                                  {tech.name}
                                </span>
                                {tech.is_featured && (
                                  <span className="text-[9px] bg-[#FF4D00] text-white px-1 font-bold uppercase">
                                    Core
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-[10px] text-[#111113]/60 block mt-0.5">
                                {count} Candidate(s)
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleModerateTech(tech, 'rejected')}
                              className="p-1 hover:text-[#FF4D00]"
                              title="Move to rejected"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => requestDeleteTech(tech)}
                              disabled={count > 0}
                              className={`p-1 ${
                                count > 0
                                  ? 'text-zinc-300 cursor-not-allowed'
                                  : 'hover:text-rose-600'
                              }`}
                              title={
                                count > 0
                                  ? `Cannot delete: linked with ${count} candidates`
                                  : 'Delete technology'
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* TAB 4: REJECTED GRID */}
                {activeTab === 'rejected' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {technologies.map((tech) => {
                      const isChecked = selectedTechIds.includes(tech.id);
                      return (
                        <div
                          key={tech.id}
                          className={`p-3 border border-dashed border-[#111113] flex items-center justify-between gap-2 ${
                            isChecked ? 'bg-amber-50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectTech(tech.id)}
                              className="w-3.5 h-3.5 accent-[#FF4D00] cursor-pointer shrink-0"
                              aria-label={`Select ${tech.name}`}
                            />
                            <span className="font-mono text-xs line-through text-[#111113]/60 truncate">
                              {tech.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleModerateTech(tech, 'approved')}
                            className="text-xs font-mono font-bold text-emerald-700 hover:underline shrink-0"
                          >
                            Restore →
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {renderTechPagination()}
              </>
            )}
          </div>
        )}

        {/* ROLE EDIT / CREATE DRAWER */}
        {isRoleDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs">
            <div className="bg-[#F8F7F4] border-l-2 border-[#111113] w-full max-w-2xl h-full flex flex-col shadow-2xl overflow-y-auto">
              <div className="p-5 border-b-2 border-[#111113] bg-white flex items-center justify-between sticky top-0 z-10">
                <div className="font-mono text-xs">
                  <span className="font-syne font-bold text-lg text-[#111113]">
                    {editingRole ? `EDIT: ${editingRole.title}` : 'CREATE NEW ROLE'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRoleDrawerOpen(false)}
                  className="p-1 border border-[#111113] hover:bg-[#111113] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveRole} className="p-6 space-y-5 flex-1">
                <div>
                  <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                    Role Title <span className="text-[#FF4D00]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={roleFormTitle}
                    onChange={(e) => setRoleFormTitle(e.target.value)}
                    placeholder="e.g. AI & LLM Engineer"
                    className="w-full font-mono text-xs px-3.5 py-2.5 border-2 border-[#111113] bg-white text-[#111113] focus:border-[#FF4D00]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                      Role Status
                    </label>
                    <select
                      value={roleFormStatus}
                      onChange={(e) => setRoleFormStatus(e.target.value as RoleStatus)}
                      className="w-full font-mono text-xs px-3.5 py-2.5 border-2 border-[#111113] bg-white text-[#111113]"
                    >
                      <option value="open">Open (Active Track)</option>
                      <option value="closed">Closed (Future Track)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                      URL Slug
                    </label>
                    <input
                      type="text"
                      value={roleFormSlug}
                      onChange={(e) => setRoleFormSlug(e.target.value)}
                      placeholder="auto-generated if empty"
                      className="w-full font-mono text-xs px-3.5 py-2.5 border-2 border-[#111113] bg-white text-[#111113]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                    Short Summary (Overview card teaser)
                  </label>
                  <textarea
                    rows={2}
                    value={roleFormShortDesc}
                    onChange={(e) => setRoleFormShortDesc(e.target.value)}
                    placeholder="Concise 1-2 sentence description for overview tiles..."
                    className="w-full font-mono text-xs p-3 border-2 border-[#111113] bg-white text-[#111113]"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                    Detailed Job Description (Rich Text Editor)
                  </label>
                  <RichTextEditor
                    value={roleFormDesc}
                    onChange={setRoleFormDesc}
                    placeholder="Write detailed responsibilities, technical expectations, and timezone requirements..."
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1 flex items-center justify-between">
                    <span>Associated Approved Technologies ({roleFormTechIds.length})</span>
                    <span className="text-[10px] text-[#111113]/60 uppercase">Click to toggle</span>
                  </label>
                  <input
                    type="text"
                    value={drawerTechFilter}
                    onChange={(e) => setDrawerTechFilter(e.target.value)}
                    placeholder="Filter approved skills..."
                    className="w-full font-mono text-xs px-3 py-1.5 mb-2 border border-[#111113] bg-white"
                  />
                  <div className="max-h-48 overflow-y-auto p-3 border-2 border-[#111113] bg-white flex flex-wrap gap-1.5">
                    {isLoadingApprovedOptions ? (
                      <span className="font-mono text-xs text-[#111113]/60">
                        Loading approved technologies...
                      </span>
                    ) : filteredDrawerOptions.length === 0 ? (
                      <span className="font-mono text-xs text-[#111113]/60">
                        No approved technologies found.
                      </span>
                    ) : (
                      filteredDrawerOptions.map((tech) => {
                        const isSelected = roleFormTechIds.includes(tech.id);
                        return (
                          <button
                            key={tech.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setRoleFormTechIds((prev) => prev.filter((id) => id !== tech.id));
                              } else {
                                setRoleFormTechIds((prev) => [...prev, tech.id]);
                              }
                            }}
                            className={`px-2.5 py-1 text-[11px] font-mono border transition ${
                              isSelected
                                ? 'bg-[#111113] text-white border-[#111113] font-bold shadow-[2px_2px_0px_0px_#FF4D00]'
                                : 'bg-[#F8F7F4] text-[#111113] border-[#111113]/30 hover:border-[#111113]'
                            }`}
                          >
                            {isSelected ? `✓ ${tech.name}` : `+ ${tech.name}`}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-[#111113] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsRoleDrawerOpen(false)}
                    className="btn-brutalist py-2.5 px-4 text-xs font-mono min-h-[44px] flex items-center justify-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingRole}
                    className="btn-brutalist btn-brutalist-primary py-2.5 px-5 text-xs font-mono min-h-[44px] flex items-center justify-center"
                  >
                    {isSavingRole ? 'Saving...' : 'Save Role Specification'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* NEW TECH MODAL */}
        {isNewTechModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-[#F8F7F4] border-2 border-[#111113] max-w-md w-full p-6 shadow-[8px_8px_0px_0px_#111113] space-y-4">
              <div className="flex items-center justify-between border-b border-[#111113]/20 pb-2">
                <h3 className="font-syne font-bold text-lg text-[#111113]">Add Master Technology</h3>
                <button
                  type="button"
                  onClick={() => setIsNewTechModalOpen(false)}
                  className="p-1 hover:text-[#FF4D00]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateNewTech} className="space-y-4">
                <div>
                  <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                    Technology Name <span className="text-[#FF4D00]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newTechName}
                    onChange={(e) => setNewTechName(e.target.value)}
                    placeholder="e.g. PyTorch, Rust, LangChain"
                    className="w-full font-mono text-xs px-3 py-2 border-2 border-[#111113] bg-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isFeaturedCheck"
                    checked={newTechIsFeatured}
                    onChange={(e) => setNewTechIsFeatured(e.target.checked)}
                    className="accent-[#FF4D00]"
                  />
                  <label htmlFor="isFeaturedCheck" className="font-mono text-xs text-[#111113] cursor-pointer">
                    Mark as Core / Featured Technology
                  </label>
                </div>

                <div className="pt-2 border-t border-[#111113]/20 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewTechModalOpen(false)}
                    className="btn-brutalist py-1.5 px-3 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingTech}
                    className="btn-brutalist btn-brutalist-primary py-1.5 px-4 text-xs disabled:opacity-50"
                  >
                    {isCreatingTech ? 'Adding...' : 'Add Technology'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* IN-APP DELETE CONFIRMATION MODAL */}
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-[#F8F7F4] border-2 border-[#111113] max-w-md w-full p-6 shadow-[8px_8px_0px_0px_#111113] space-y-4">
              <div className="font-mono text-xs uppercase font-bold text-rose-700">
                [Confirm Permanent Delete]
              </div>
              <p className="font-mono text-xs text-[#111113]">
                {confirmDelete.type === 'role'
                  ? `Are you sure you want to permanently delete role "${confirmDelete.item.title}"? This action cannot be undone.`
                  : `Permanently delete technology "${confirmDelete.item.name}"?`}
              </p>
              <div className="pt-2 border-t border-[#111113]/20 flex justify-end gap-2 font-mono text-xs">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setConfirmDelete(null)}
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
