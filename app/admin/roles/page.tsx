'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Role, 
  Technology, 
  RoleStatus, 
  TechnologyStatus 
} from '@/types/roles-tech';
import { 
  getRolesList, 
  createRoleRecord, 
  updateRoleRecord, 
  deleteRoleRecord,
  getTechnologiesList,
  updateTechnologyRecord,
  deleteTechnologyRecord,
  getCandidateCountForRole,
  getCandidateCountForTech,
  resetRolesAndTechData
} from '@/lib/roles-tech-store';
import { 
  getCurrentHrUser, 
  isEmailAuthorizedForHr, 
  HrUser,
  canManageRolesAndTech,
  canAccessHireRequests,
  canManageAdminUsers,
  getRoleBadgeInfo
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
  XCircle, 
  AlertCircle, 
  ExternalLink, 
  RotateCcw, 
  ArrowLeft, 
  Check, 
  X, 
  Search,
  Sparkles,
  Users,
  Briefcase
} from 'lucide-react';

export default function AdminRolesManagementPage() {
  const router = useRouter();
  const [hrUser, setHrUser] = useState<HrUser | null>(() => {
    if (typeof window === 'undefined') return null;
    const user = getCurrentHrUser();
    return user && user.email && isEmailAuthorizedForHr(user.email) ? user : null;
  });

  const [activeTab, setActiveTab] = useState<'roles' | 'pending' | 'approved' | 'rejected'>('roles');
  const [roles, setRoles] = useState<Role[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [roleCandidateCounts, setRoleCandidateCounts] = useState<Record<string, number>>({});
  const [techCandidateCounts, setTechCandidateCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  // New Tech Modal State
  const [isNewTechModalOpen, setIsNewTechModalOpen] = useState(false);
  const [newTechName, setNewTechName] = useState('');
  const [newTechRoleIds, setNewTechRoleIds] = useState<string[]>([]);
  const [newTechIsFeatured, setNewTechIsFeatured] = useState(false);

  // Search filter for tech tabs
  const [techSearch, setTechSearch] = useState('');

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 6000);
  };

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedRoles = await getRolesList(true);
      const fetchedTechs = await getTechnologiesList({ status: 'all' });

      setRoles(fetchedRoles);
      setTechnologies(fetchedTechs);

      // Compute candidate counts for each role
      const rCounts: Record<string, number> = {};
      for (const r of fetchedRoles) {
        rCounts[r.id] = await getCandidateCountForRole(r.slug);
      }
      setRoleCandidateCounts(rCounts);

      // Compute candidate counts for techs
      const tCounts: Record<string, number> = {};
      for (const t of fetchedTechs) {
        tCounts[t.id] = await getCandidateCountForTech(t.name);
      }
      setTechCandidateCounts(tCounts);
    } catch (err: any) {
      showNotice('error', `Failed to load data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hrUser) {
      router.replace('/admin/login?error=auth_required');
      return;
    }
    if (!canManageRolesAndTech(hrUser.role)) {
      router.replace('/admin/dashboard?unauthorized=roles');
      return;
    }
  }, [hrUser, router]);

  useEffect(() => {
    if (!hrUser || !canManageRolesAndTech(hrUser.role)) return;
    let isCancelled = false;
    Promise.all([
      getRolesList(true),
      getTechnologiesList({ status: 'all' })
    ]).then(async ([fetchedRoles, fetchedTechs]) => {
      if (isCancelled) return;
      setRoles(fetchedRoles);
      setTechnologies(fetchedTechs);

      const rCounts: Record<string, number> = {};
      for (const r of fetchedRoles) {
        rCounts[r.id] = await getCandidateCountForRole(r.slug);
      }
      if (isCancelled) return;
      setRoleCandidateCounts(rCounts);

      const tCounts: Record<string, number> = {};
      for (const t of fetchedTechs) {
        tCounts[t.id] = await getCandidateCountForTech(t.name);
      }
      if (isCancelled) return;
      setTechCandidateCounts(tCounts);
      setIsLoading(false);
    }).catch((err) => {
      if (isCancelled) return;
      showNotice('error', `Failed to load data: ${err.message}`);
      setIsLoading(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [hrUser]);

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
      setRoles(prev => prev.map(r => r.id === role.id ? { ...r, status: newStatus } : r));
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
      const linkedTechIds = (role.technologies || []).map(t => t.id);
      setRoleFormTechIds(linkedTechIds);
    } else {
      setEditingRole(null);
      setRoleFormTitle('');
      setRoleFormSlug('');
      setRoleFormShortDesc('');
      setRoleFormDesc('### Role Overview\nDescribe the core objectives of this track.\n\n### Key Responsibilities\n- Responsibility 1\n- Responsibility 2\n\n### Requirements & Delivery Standards\n- Minimum years of experience\n- Timezone overlap commitment');
      setRoleFormStatus('open');
      setRoleFormTechIds([]);
    }
    setIsRoleDrawerOpen(true);
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
        await updateRoleRecord(editingRole.id, {
          title: roleFormTitle,
          slug: roleFormSlug || undefined,
          short_description: roleFormShortDesc,
          description: roleFormDesc,
          status: roleFormStatus,
          technology_ids: roleFormTechIds,
        });
        showNotice('success', `Role "${roleFormTitle}" updated successfully`);
      } else {
        await createRoleRecord({
          title: roleFormTitle,
          slug: roleFormSlug || undefined,
          short_description: roleFormShortDesc,
          description: roleFormDesc,
          status: roleFormStatus,
          technology_ids: roleFormTechIds,
        });
        showNotice('success', `New role "${roleFormTitle}" created successfully`);
      }
      setIsRoleDrawerOpen(false);
      await loadAllData();
    } catch (err: any) {
      showNotice('error', err.message);
    } finally {
      setIsSavingRole(false);
    }
  };

  // Delete role with safety check
  const handleDeleteRole = async (role: Role) => {
    const candidateCount = roleCandidateCounts[role.id] || 0;
    if (candidateCount > 0) {
      showNotice(
        'error',
        `Cannot delete role "${role.title}" because it is associated with ${candidateCount} candidate(s). Please close the role instead.`
      );
      return;
    }

    if (!confirm(`Are you sure you want to delete role "${role.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await deleteRoleRecord(role.id);
      if (!res.success) {
        showNotice('error', res.error || 'Failed to delete role');
        return;
      }
      showNotice('success', `Role "${role.title}" deleted.`);
      await loadAllData();
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  // Moderate technology: Approve or Reject
  const handleModerateTech = async (tech: Technology, targetStatus: TechnologyStatus) => {
    try {
      await updateTechnologyRecord(tech.id, { status: targetStatus });
      setTechnologies(prev => prev.map(t => t.id === tech.id ? { ...t, status: targetStatus } : t));
      showNotice('success', `Technology "${tech.name}" is now ${targetStatus.toUpperCase()}`);
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  // Delete technology with candidate safety check
  const handleDeleteTech = async (tech: Technology) => {
    const candidateCount = techCandidateCounts[tech.id] || 0;
    if (candidateCount > 0) {
      showNotice(
        'error',
        `Cannot delete technology "${tech.name}" because it is associated with ${candidateCount} candidate(s). You can reject or hide it instead.`
      );
      return;
    }

    if (!confirm(`Permanently delete technology "${tech.name}"?`)) {
      return;
    }

    try {
      const res = await deleteTechnologyRecord(tech.id);
      if (!res.success) {
        showNotice('error', res.error || 'Failed to delete technology');
        return;
      }
      showNotice('success', `Technology "${tech.name}" deleted.`);
      await loadAllData();
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  // Add new technology directly from admin
  const handleCreateNewTech = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTechName.trim()) return;

    try {
      const { submitCustomTechnology } = await import('@/lib/roles-tech-store');
      const res = await submitCustomTechnology(newTechName.trim());
      // Set to approved immediately since admin is creating it
      await updateTechnologyRecord(res.technology.id, {
        status: 'approved',
        is_featured: newTechIsFeatured,
        role_ids: newTechRoleIds,
      });

      showNotice('success', `Technology "${newTechName}" added to library`);
      setNewTechName('');
      setNewTechRoleIds([]);
      setNewTechIsFeatured(false);
      setIsNewTechModalOpen(false);
      await loadAllData();
    } catch (err: any) {
      showNotice('error', err.message);
    }
  };

  // Reset to initial seed
  const handleResetToDefault = () => {
    if (confirm('Reset Roles & Technologies to initial seed configuration?')) {
      resetRolesAndTechData();
      loadAllData();
      showNotice('success', 'Reset to initial roles and technologies.');
    }
  };

  const pendingTechs = technologies.filter(t => t.status === 'pending');
  const approvedTechs = technologies.filter(t => t.status === 'approved');
  const rejectedTechs = technologies.filter(t => t.status === 'rejected');

  const filteredApprovedTechs = approvedTechs.filter(t => {
    if (!techSearch.trim()) return true;
    return t.name.toLowerCase().includes(techSearch.toLowerCase());
  });

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
            <button
              onClick={() => setNotification(null)}
              className="p-1 hover:bg-black/10 font-bold"
            >
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
              {hrUser && (() => {
                const roleInfo = getRoleBadgeInfo(hrUser.role);
                return (
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${roleInfo.badgeClass}`}>
                    {roleInfo.label}
                  </span>
                );
              })()}
            </div>
            <p className="font-mono text-xs text-[#111113]/70 mt-1">
              Configure open/closed tracks, write formatted job descriptions, and moderate candidate skills.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
            <Link
              href="/admin/dashboard"
              className="btn-brutalist text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Candidates</span>
            </Link>

            {/* Customer Hire Requests: Accessible only to Admin and Sales Executive (hidden for HR Executive) */}
            {hrUser && canAccessHireRequests(hrUser.role) && (
              <Link
                href="/admin/hire-requests"
                className="btn-brutalist text-xs py-1.5 px-3 flex items-center gap-1.5"
                title="Review client hire requests and manage offline outreach"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Hire Requests</span>
              </Link>
            )}

            {/* Admin Users Clearance: Accessible only to Admin (hidden for HR Executive) */}
            {hrUser && canManageAdminUsers(hrUser.role) && (
              <Link
                href="/admin/users"
                className="btn-brutalist text-xs py-1.5 px-3 flex items-center gap-1.5"
                title="Admin team management"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Admins</span>
              </Link>
            )}

            <button
              onClick={() => handleOpenEditRole()}
              className="btn-brutalist btn-brutalist-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Role</span>
            </button>

            <button
              onClick={() => setIsNewTechModalOpen(true)}
              className="btn-brutalist text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Technology</span>
            </button>

            <button
              onClick={handleResetToDefault}
              title="Reset roles and tech to default seed"
              className="btn-brutalist text-xs py-1.5 px-2.5"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b-2 border-[#111113] pb-px overflow-x-auto">
          <button
            onClick={() => setActiveTab('roles')}
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
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 font-mono text-xs uppercase font-bold border-t-2 border-x-2 border-[#111113] flex items-center gap-2 transition-colors ${
              activeTab === 'pending'
                ? 'bg-white text-[#111113] -mb-0.5 border-b-2 border-b-white'
                : 'bg-[#F8F7F4] text-[#111113]/60 hover:text-[#111113]'
            }`}
          >
            <Terminal className="w-4 h-4 text-[#FF4D00]" />
            <span>Moderation Queue</span>
            {pendingTechs.length > 0 && (
              <span className="bg-[#FF4D00] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {pendingTechs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={`px-4 py-2 font-mono text-xs uppercase font-bold border-t-2 border-x-2 border-[#111113] flex items-center gap-2 transition-colors ${
              activeTab === 'approved'
                ? 'bg-white text-[#111113] -mb-0.5 border-b-2 border-b-white'
                : 'bg-[#F8F7F4] text-[#111113]/60 hover:text-[#111113]'
            }`}
          >
            <span>Approved Library ({approvedTechs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-4 py-2 font-mono text-xs uppercase font-bold border-t-2 border-x-2 border-[#111113] flex items-center gap-2 transition-colors ${
              activeTab === 'rejected'
                ? 'bg-white text-[#111113] -mb-0.5 border-b-2 border-b-white'
                : 'bg-[#F8F7F4] text-[#111113]/60 hover:text-[#111113]'
            }`}
          >
            <span>Rejected ({rejectedTechs.length})</span>
          </button>
        </div>

        {/* TAB 1: ROLES MANAGEMENT */}
        {activeTab === 'roles' && (
          <div className="space-y-4">
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
                        <span
                          className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 border ${
                            isOpen
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-zinc-100 text-zinc-700 border-zinc-300'
                          }`}
                        >
                          {isOpen ? '● Open Track' : '○ Closed (Future)'}
                        </span>

                        <span className="font-mono text-[10px] text-[#111113]/60 uppercase">
                          Slug: {role.slug}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-syne font-bold text-xl text-[#111113]">
                          {role.title}
                        </h3>
                        <p className="font-mono text-xs text-[#111113]/70 mt-1 line-clamp-2">
                          {role.short_description || 'No short description provided.'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#111113]/10 font-mono text-[11px]">
                        <div>
                          <span className="text-[#111113]/60 block text-[9px] uppercase">
                            Candidates
                          </span>
                          <strong className="text-sm font-bold text-[#111113]">
                            {candidateCount}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[#111113]/60 block text-[9px] uppercase">
                            Approved Techs
                          </span>
                          <strong className="text-sm font-bold text-[#111113]">
                            {techCount}
                          </strong>
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
                          title={isOpen ? 'Close this role (moves to Future Tracks)' : 'Open this role (moves to Active Tracks)'}
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
                        onClick={() => handleDeleteRole(role)}
                        className={`p-1 border ${
                          candidateCount > 0
                            ? 'border-zinc-300 text-zinc-400 cursor-not-allowed'
                            : 'border-rose-300 text-rose-600 hover:bg-rose-500 hover:text-white'
                        }`}
                        title={candidateCount > 0 ? `Cannot delete: ${candidateCount} candidates linked` : 'Delete unused role'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: MODERATION QUEUE */}
        {activeTab === 'pending' && (
          <div className="p-6 bg-white border-2 border-[#111113] shadow-[4px_4px_0px_0px_#111113] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-syne font-bold text-lg text-[#111113]">
                  Candidate-Submitted Custom Technologies ({pendingTechs.length})
                </h3>
                <p className="font-mono text-xs text-[#111113]/70">
                  Review custom tools typed by candidates. Approved technologies become selectable across the application; rejected tools are hidden.
                </p>
              </div>
            </div>

            {pendingTechs.length === 0 ? (
              <div className="p-12 text-center font-mono text-xs text-[#111113]/60 border-2 border-dashed border-[#111113]/30">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                Moderation queue is clean. Zero pending candidate technologies.
              </div>
            ) : (
              <div className="divide-y divide-[#111113]/10 border border-[#111113]">
                {pendingTechs.map((tech) => (
                  <div key={tech.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8F7F4]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#111113]">
                          {tech.name}
                        </span>
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-mono px-2 py-0.2 uppercase font-bold">
                          Pending Review
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-[#111113]/50 block mt-0.5">
                        Submitted on: {new Date(tech.created_at).toLocaleDateString()}
                      </span>
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
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: APPROVED TECHNOLOGIES LIBRARY */}
        {activeTab === 'approved' && (
          <div className="p-6 bg-white border-2 border-[#111113] shadow-[4px_4px_0px_0px_#111113] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-syne font-bold text-lg text-[#111113]">
                  Approved Technologies ({approvedTechs.length})
                </h3>
                <p className="font-mono text-xs text-[#111113]/70">
                  Master library of active skills shown in application selectors.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#111113]/40" />
                <input
                  type="text"
                  placeholder="Filter skills..."
                  value={techSearch}
                  onChange={(e) => setTechSearch(e.target.value)}
                  className="w-full font-mono text-xs pl-8 pr-3 py-2 border border-[#111113] bg-[#F8F7F4]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredApprovedTechs.map((tech) => {
                const count = techCandidateCounts[tech.id] || 0;
                return (
                  <div
                    key={tech.id}
                    className="p-3 border-2 border-[#111113] bg-[#F8F7F4] flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-[#111113]">
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

                    <div className="flex items-center gap-1">
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
                        onClick={() => handleDeleteTech(tech)}
                        disabled={count > 0}
                        className={`p-1 ${count > 0 ? 'text-zinc-300 cursor-not-allowed' : 'hover:text-rose-600'}`}
                        title={count > 0 ? `Cannot delete: linked with ${count} candidates` : 'Delete technology'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: REJECTED TECHNOLOGIES */}
        {activeTab === 'rejected' && (
          <div className="p-6 bg-white border-2 border-[#111113] shadow-[4px_4px_0px_0px_#111113] space-y-4">
            <div>
              <h3 className="font-syne font-bold text-lg text-[#111113]">
                Rejected Technologies ({rejectedTechs.length})
              </h3>
              <p className="font-mono text-xs text-[#111113]/70">
                These technologies are hidden from candidates and the public overview.
              </p>
            </div>

            {rejectedTechs.length === 0 ? (
              <div className="p-8 text-center font-mono text-xs text-[#111113]/60">
                No rejected technologies.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {rejectedTechs.map((tech) => (
                  <div key={tech.id} className="p-3 border border-dashed border-[#111113] flex items-center justify-between">
                    <span className="font-mono text-xs line-through text-[#111113]/60">{tech.name}</span>
                    <button
                      type="button"
                      onClick={() => handleModerateTech(tech, 'approved')}
                      className="text-xs font-mono font-bold text-emerald-700 hover:underline"
                    >
                      Restore →
                    </button>
                  </div>
                ))}
              </div>
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
                {/* Title */}
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

                {/* Status Toggle & Slug */}
                <div className="grid grid-cols-2 gap-4">
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

                {/* Short description */}
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

                {/* Rich Text Editor for Detailed Job Description */}
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

                {/* Associate Approved Technologies */}
                <div>
                  <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1 flex items-center justify-between">
                    <span>Associated Approved Technologies ({roleFormTechIds.length})</span>
                    <span className="text-[10px] text-[#111113]/60 uppercase">Click to toggle</span>
                  </label>
                  <div className="max-h-48 overflow-y-auto p-3 border-2 border-[#111113] bg-white flex flex-wrap gap-1.5">
                    {approvedTechs.map((tech) => {
                      const isSelected = roleFormTechIds.includes(tech.id);
                      return (
                        <button
                          key={tech.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setRoleFormTechIds(prev => prev.filter(id => id !== tech.id));
                            } else {
                              setRoleFormTechIds(prev => [...prev, tech.id]);
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
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-[#111113] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsRoleDrawerOpen(false)}
                    className="btn-brutalist py-2 px-4 text-xs font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingRole}
                    className="btn-brutalist btn-brutalist-primary py-2 px-5 text-xs font-mono"
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
                <h3 className="font-syne font-bold text-lg text-[#111113]">
                  Add Master Technology
                </h3>
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
                    className="btn-brutalist btn-brutalist-primary py-1.5 px-4 text-xs"
                  >
                    Add Technology
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
