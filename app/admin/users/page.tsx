'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { 
  getCurrentHrUser, 
  signOutHrRecruiter, 
  HrUser,
  AUTHORIZED_ADMIN_EMAIL
} from '@/lib/auth/recruiter-auth';
import { 
  Users, 
  UserPlus, 
  Copy, 
  Check, 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  Search, 
  KeyRound, 
  Trash2, 
  ArrowLeft, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  X,
  Lock,
  LogOut,
  SlidersHorizontal,
  Mail,
  UserCheck,
  UserX
} from 'lucide-react';

interface AdminUserItem {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'recruiter';
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  must_change_password: boolean;
}

export default function AdminUsersManagementPage() {
  const router = useRouter();
  const [currentUser] = useState<HrUser | null>(() => {
    if (typeof window === 'undefined') return null;
    return getCurrentHrUser();
  });
  const [isAuthorized] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const user = getCurrentHrUser();
    return Boolean(user && user.email);
  });
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'super_admin' | 'admin' | 'recruiter'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State for Add User
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'super_admin' | 'admin' | 'recruiter'>('admin');
  const [newIsActive, setNewIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Success / Invite Link Modal State
  const [createdInviteInfo, setCreatedInviteInfo] = useState<{
    email: string;
    full_name: string;
    tempPassword: string;
    inviteLink: string;
  } | null>(null);

  // Copied toast state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Fetch Admin Users function
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.users)) {
          setUsers(data.users);
        }
      }
    } catch (err) {
      console.error('Failed to load admin users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auth gate & Initial Fetch via Promise callback
  useEffect(() => {
    if (!isAuthorized) {
      router.replace('/admin/login?error=auth_required');
      return;
    }

    let isCancelled = false;
    fetch('/api/admin/users')
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && Array.isArray(data.users)) {
          setUsers(data.users);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to load admin users:', err);
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isAuthorized, router]);

  // Helper to generate full invite URL
  const buildInviteUrl = (token: string) => {
    if (typeof window === 'undefined') return `/admin/setup-password?invite=${token}`;
    return `${window.location.origin}/admin/setup-password?invite=${token}`;
  };

  // 1-Click Copy Invite Link to Clipboard
  const handleCopyInviteLink = async (link: string, id: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // Fallback
      prompt('Copy invite link:', link);
    }
  };

  // Handle Add User Submit
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setAddError('Please enter administrator full name.');
      return;
    }
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setAddError('Please enter a valid administrator email address.');
      return;
    }

    setIsSubmitting(true);
    setAddError(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: newName.trim(),
          email: newEmail.trim().toLowerCase(),
          role: newRole,
          is_active: newIsActive,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setAddError(data.error || 'Failed to provision new administrator.');
        setIsSubmitting(false);
        return;
      }

      // User created successfully
      const inviteUrl = buildInviteUrl(data.invite_token);
      setCreatedInviteInfo({
        email: data.user.email,
        full_name: data.user.full_name,
        tempPassword: data.temporary_password,
        inviteLink: inviteUrl,
      });

      setIsAddModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewRole('admin');
      setNewIsActive(true);

      // Refresh list
      fetchUsers();
    } catch (err: any) {
      setAddError(err.message || 'Network error creating user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle User Active / Inactive Status
  const handleToggleActive = async (user: AdminUserItem) => {
    if (user.email === AUTHORIZED_ADMIN_EMAIL && user.is_active) {
      alert('The primary system super administrator cannot be deactivated.');
      return;
    }

    const nextStatus = !user.is_active;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          is_active: nextStatus,
        }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, is_active: nextStatus } : u))
        );
        setActionSuccessMessage(`Admin ${user.email} marked as ${nextStatus ? 'ACTIVE' : 'INACTIVE'}.`);
        setTimeout(() => setActionSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // Trigger Force Password Reset & Generate New Invite Link
  const handleForcePasswordReset = async (user: AdminUserItem) => {
    if (!confirm(`Force password reset for ${user.full_name} (${user.email})? A new invite link and temporary password will be generated.`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          trigger_password_reset: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.invite_token) {
        const inviteUrl = buildInviteUrl(data.invite_token);
        setCreatedInviteInfo({
          email: user.email,
          full_name: user.full_name,
          tempPassword: data.temporary_password,
          inviteLink: inviteUrl,
        });
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to trigger reset:', err);
    }
  };

  // Delete User
  const handleDeleteUser = async (user: AdminUserItem) => {
    if (user.email === AUTHORIZED_ADMIN_EMAIL) {
      alert('Security Protection: The primary super administrator account cannot be deleted.');
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete administrator account for ${user.full_name} (${user.email})? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users?id=${user.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        setActionSuccessMessage(`Administrator ${user.email} was removed from the database.`);
        setTimeout(() => setActionSuccessMessage(null), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user.');
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.is_active) ||
        (statusFilter === 'inactive' && !u.is_active);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // KPI calculations
  const kpis = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.is_active).length;
    const inactive = users.filter((u) => !u.is_active).length;
    const pendingFirstLogin = users.filter((u) => u.must_change_password).length;
    return { total, active, inactive, pendingFirstLogin };
  }, [users]);

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#111113] flex flex-col font-sans selection:bg-[#FF4D00] selection:text-white">
      <Navbar />

      <main className="flex-1 py-8 px-4 sm:px-[4vw] max-w-7xl mx-auto w-full space-y-6">
        {/* Top Header & Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border-2 border-[#111113] shadow-[4px_4px_0px_0px_#111113]">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="p-2 border-2 border-[#111113] hover:bg-[#111113] hover:text-[#F8F7F4] transition"
              title="Return to Candidate Pipeline"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="font-syne font-extrabold text-lg text-[#111113]">
                  ADMIN CLEARANCE &amp; USERS
                </span>
                <span className="bg-[#111113] text-[#F8F7F4] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  ROLE-BASED ACCESS
                </span>
              </div>
              <p className="font-mono text-xs text-[#111113]/70">
                Provision administrator accounts, assign clearance roles, toggle active status, and copy invite onboarding links.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
            <Link
              href="/admin/dashboard"
              className="btn-brutalist py-2 px-3 text-xs"
            >
              Pipeline Dashboard
            </Link>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn-brutalist btn-brutalist-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Administrator</span>
            </button>
            <button
              onClick={fetchUsers}
              disabled={isLoading}
              className="p-2 border-2 border-[#111113] bg-white hover:bg-[#F8F7F4] transition disabled:opacity-50"
              title="Refresh Users List"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Action Notification Banner */}
        {actionSuccessMessage && (
          <div className="p-3.5 border-2 border-[#111113] bg-emerald-50 text-emerald-900 font-mono text-xs flex items-center gap-2 shadow-[3px_3px_0px_0px_#111113]">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}

        {/* Security Policy Notice */}
        <div className="p-4 border-2 border-[#111113] bg-white text-xs font-mono text-[#111113] flex items-start gap-3 shadow-[4px_4px_0px_0px_#111113]">
          <ShieldAlert className="w-5 h-5 text-[#FF4D00] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold uppercase tracking-wider block mb-0.5 text-[#FF4D00]">
              [MANDATORY SECURITY ENFORCEMENT: FIRST-LOGIN PASSWORD ROTATION]
            </span>
            <span>
              All newly invited administrators are provisioned with an invitation link and a temporary security code. Upon their first login, they are strictly required to configure a private personal password before granted access to candidate pipelines and confidential resumes.
            </span>
          </div>
        </div>

        {/* KPI Metrics Matrix */}
        <div className="editorial-grid">
          <div className="p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#111113]/60 mb-1">[TOTAL ADMINS]</div>
            <div className="font-syne font-extrabold text-2xl text-[#111113]">{kpis.total}</div>
            <span className="font-mono text-[10px] text-[#111113]/60 uppercase">Provisioned</span>
          </div>

          <div className="p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#111113]/60 mb-1">[ACTIVE CLEARANCE]</div>
            <div className="font-syne font-extrabold text-2xl text-emerald-600">{kpis.active}</div>
            <span className="font-mono text-[10px] text-[#111113]/60 uppercase">Enabled</span>
          </div>

          <div className="p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#111113]/60 mb-1">[DEACTIVATED]</div>
            <div className="font-syne font-extrabold text-2xl text-rose-600">{kpis.inactive}</div>
            <span className="font-mono text-[10px] text-[#111113]/60 uppercase">Blocked</span>
          </div>

          <div className="p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#111113]/60 mb-1">[FIRST LOGIN PENDING]</div>
            <div className="font-syne font-extrabold text-2xl text-[#FF4D00]">{kpis.pendingFirstLogin}</div>
            <span className="font-mono text-[10px] text-[#111113]/60 uppercase">Must Change Password</span>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="p-5 bg-white border-2 border-[#111113] shadow-[4px_4px_0px_0px_#111113] space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search administrators by name or email address..."
                className="w-full font-mono text-xs px-3.5 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] placeholder:text-[#111113]/50 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-3 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] font-bold focus:outline-hidden"
              >
                <option value="all">All Roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="recruiter">Recruiter</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2.5 border-2 border-[#111113] bg-[#F8F7F4] text-[#111113] font-bold focus:outline-hidden"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Administrators Table */}
        <div className="bg-white border-2 border-[#111113] shadow-[6px_6px_0px_0px_#111113] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="bg-[#111113] text-[#F8F7F4] font-mono uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-4">Clearance Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Password Flow</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#111113]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center font-mono text-xs text-[#111113]/60 uppercase">
                      {isLoading ? 'Loading administrators...' : 'No administrators match the specified filter criteria.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isSuper = user.role === 'super_admin';
                    const isCurrent = currentUser?.email === user.email;

                    return (
                      <tr key={user.id} className="hover:bg-[#F8F7F4] transition-colors">
                        {/* Name & Email */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className="font-bold text-[#111113] flex items-center gap-2">
                            <span>{user.full_name}</span>
                            {isCurrent && (
                              <span className="bg-[#111113] text-[#F8F7F4] text-[9px] px-1.5 py-0.2 uppercase font-bold">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#111113]/70 block">{user.email}</span>
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4 font-mono">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                            user.role === 'super_admin'
                              ? 'bg-[#111113] text-[#F8F7F4] border-[#111113]'
                              : user.role === 'admin'
                              ? 'bg-[#FF4D00] text-white border-[#FF4D00]'
                              : 'bg-white text-[#111113] border-[#111113]'
                          }`}>
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Status Toggle Button */}
                        <td className="py-3.5 px-4 font-mono">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(user)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 border-2 border-[#111113] text-[10px] uppercase font-bold transition ${
                              user.is_active
                                ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-900 hover:bg-rose-200'
                            }`}
                            title="Click to toggle account activation"
                          >
                            {user.is_active ? <UserCheck className="w-3.5 h-3.5 text-emerald-700" /> : <UserX className="w-3.5 h-3.5 text-rose-700" />}
                            <span>{user.is_active ? 'Active' : 'Inactive'}</span>
                          </button>
                        </td>

                        {/* Password Flow Status */}
                        <td className="py-3.5 px-4 font-mono">
                          {user.must_change_password ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-[#FF4D00] bg-orange-50 border border-[#FF4D00] px-2 py-0.5">
                              <KeyRound className="w-3 h-3" />
                              <span>First-Login Required</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Password Set</span>
                            </span>
                          )}
                        </td>

                        {/* Last Login */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-[#111113]/70">
                          {user.last_login_at ? (
                            <span>{new Date(user.last_login_at).toLocaleDateString()} {new Date(user.last_login_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          ) : (
                            <span className="text-[#FF4D00] font-bold uppercase text-[10px]">Never (Awaiting Invite)</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right font-mono">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Copy Invite Link */}
                            <button
                              type="button"
                              onClick={() => handleForcePasswordReset(user)}
                              className="p-1.5 border border-[#111113] bg-white hover:bg-[#111113] hover:text-[#F8F7F4] text-[#111113] transition"
                              title="Copy / Regenerate Invite Link"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete User */}
                            {user.email !== AUTHORIZED_ADMIN_EMAIL && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(user)}
                                className="p-1.5 border border-rose-600 bg-white hover:bg-rose-600 hover:text-white text-rose-600 transition"
                                title="Delete Administrator Account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL 1: ADD NEW ADMINISTRATOR */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111113]/70 backdrop-blur-xs">
          <div className="bg-[#F8F7F4] border-2 border-[#111113] max-w-lg w-full p-6 sm:p-8 relative shadow-[8px_8px_0px_0px_#111113] space-y-5 animate-in fade-in duration-150">
            <button
              onClick={() => {
                setIsAddModalOpen(false);
                setAddError(null);
              }}
              className="absolute top-4 right-4 p-1 border border-[#111113] hover:bg-[#111113] hover:text-[#F8F7F4] transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] font-bold block mb-1">
                [PROVISION ADMINISTRATOR]
              </span>
              <h3 className="font-syne font-bold text-2xl text-[#111113]">
                Add Team Member
              </h3>
              <p className="font-mono text-xs text-[#111113]/70 mt-1">
                Generate onboarding credentials with mandatory first-login password update.
              </p>
            </div>

            {addError && (
              <div className="p-3 border-2 border-rose-600 bg-rose-50 text-rose-900 font-mono text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  required
                  className="w-full font-mono text-xs px-3.5 py-2.5 border-2 border-[#111113] bg-white text-[#111113] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. elena@talentpulse.com"
                  required
                  className="w-full font-mono text-xs px-3.5 py-2.5 border-2 border-[#111113] bg-white text-[#111113] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                    Clearance Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full font-mono text-xs px-3 py-2.5 border-2 border-[#111113] bg-white text-[#111113] font-bold focus:outline-hidden"
                  >
                    <option value="admin">Admin</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                    Initial Status
                  </label>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer font-mono text-xs">
                      <input
                        type="checkbox"
                        checked={newIsActive}
                        onChange={(e) => setNewIsActive(e.target.checked)}
                        className="w-4 h-4 accent-[#FF4D00] border-2 border-[#111113]"
                      />
                      <span>Active</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t-2 border-[#111113]/20 flex items-center justify-end gap-3 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-brutalist py-2.5 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-brutalist btn-brutalist-primary py-2.5 px-5 disabled:opacity-50"
                >
                  {isSubmitting ? 'Provisioning...' : 'Provision & Generate Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INVITE LINK GENERATED / COPY DETAILS */}
      {createdInviteInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111113]/70 backdrop-blur-xs">
          <div className="bg-[#F8F7F4] border-2 border-[#111113] max-w-lg w-full p-6 sm:p-8 relative shadow-[8px_8px_0px_0px_#111113] space-y-5 animate-in fade-in duration-150">
            <button
              onClick={() => setCreatedInviteInfo(null)}
              className="absolute top-4 right-4 p-1 border border-[#111113] hover:bg-[#111113] hover:text-[#F8F7F4] transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-emerald-700 font-bold block mb-1">
                [INVITATION LINK READY]
              </span>
              <h3 className="font-syne font-bold text-2xl text-[#111113]">
                Administrator Provisioned
              </h3>
              <p className="font-mono text-xs text-[#111113]/70 mt-1">
                Copy the secure onboarding link below and provide it to <strong>{createdInviteInfo.full_name}</strong>.
              </p>
            </div>

            {/* Invite Link Box */}
            <div className="p-4 border-2 border-[#111113] bg-white space-y-2 font-mono text-xs">
              <span className="text-[10px] uppercase font-bold text-[#FF4D00] block">
                Direct Onboarding Link (Valid 7 Days):
              </span>
              <div className="p-2 border border-[#111113] bg-[#F8F7F4] break-all select-all font-mono text-[11px] text-[#111113]">
                {createdInviteInfo.inviteLink}
              </div>
              <button
                type="button"
                onClick={() => handleCopyInviteLink(createdInviteInfo.inviteLink, 'modal-invite')}
                className="w-full btn-brutalist btn-brutalist-primary py-2.5 text-xs font-bold flex items-center justify-center gap-2 mt-2"
              >
                {copiedId === 'modal-invite' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>INVITE LINK COPIED TO CLIPBOARD!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>COPY ONBOARDING LINK</span>
                  </>
                )}
              </button>
            </div>

            {/* Temporary Credentials Box */}
            <div className="p-3.5 border border-[#111113] bg-amber-50 font-mono text-xs space-y-1">
              <div className="font-bold text-[#111113] flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#FF4D00]" />
                <span>Temporary Security Password:</span>
              </div>
              <div className="font-bold text-[#FF4D00] text-sm tracking-wider select-all">
                {createdInviteInfo.tempPassword}
              </div>
              <p className="text-[10px] text-[#111113]/70 pt-1">
                If the user logs in directly at <code className="font-bold">/admin/login</code>, they can use this temporary code and will be prompted to choose a permanent password immediately.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setCreatedInviteInfo(null)}
                className="btn-brutalist py-2 px-6 font-mono text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
