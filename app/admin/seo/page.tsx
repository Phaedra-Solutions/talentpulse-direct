'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { SeoManagement } from '@/components/admin/SeoManagement';
import { 
  getCurrentHrUser, 
  isEmailAuthorizedForHr, 
  HrUser,
  canManageSeo,
  canAccessHireRequests,
  canManageRolesAndTech,
  canManageAdminUsers,
  getRoleBadgeInfo
} from '@/lib/auth/recruiter-auth';
import { 
  Users, 
  Briefcase, 
  Layers, 
  Globe, 
  Shield, 
  Lock, 
  ArrowLeft,
  ChevronRight
} from 'lucide-react';

export default function AdminSeoPage() {
  const router = useRouter();
  const [hrUser] = useState<HrUser | null>(() => {
    if (typeof window === 'undefined') return null;
    const user = getCurrentHrUser();
    return user && user.email && isEmailAuthorizedForHr(user.email) ? user : null;
  });

  const isAuthorized = Boolean(hrUser && canManageSeo(hrUser.role));

  useEffect(() => {
    if (!hrUser) {
      router.push('/admin/login?redirect=/admin/seo');
    } else if (!canManageSeo(hrUser.role)) {
      router.push('/admin/dashboard?unauthorized=seo');
    }
  }, [hrUser, router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-[#111113] border-t-[#FF4D00] animate-spin mb-4" />
        <span className="font-mono text-xs uppercase tracking-widest text-[#111113]/70">
          Verifying Administrator Permissions...
        </span>
      </div>
    );
  }

  const roleBadge = getRoleBadgeInfo(hrUser?.role);

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#111113] flex flex-col font-sans selection:bg-[#FF4D00] selection:text-white">
      <Navbar />

      {/* Admin Top Header & Nav */}
      <div className="bg-[#111113] text-[#F8F7F4] px-4 sm:px-[4vw] py-4 border-b-2 border-[#111113]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="p-1.5 border border-[#F8F7F4]/30 hover:border-[#FF4D00] hover:text-[#FF4D00] transition-colors"
              title="Return to Candidates Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-[#F8F7F4]/60 uppercase tracking-widest">
                <span>TalentPulse Admin</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#FF4D00]">SEO & Analytics</span>
              </div>
              <h2 className="text-xl font-syne font-bold">SEO & Tracking Engine</h2>
            </div>
          </div>

          {/* Quick Sub-navigation */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <Link
              href="/admin/dashboard"
              className="px-3 py-1.5 border border-[#F8F7F4]/20 hover:border-white transition-colors flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" /> Candidates
            </Link>

            {canAccessHireRequests(hrUser?.role) && (
              <Link
                href="/admin/hire-requests"
                className="px-3 py-1.5 border border-[#F8F7F4]/20 hover:border-white transition-colors flex items-center gap-1.5"
              >
                <Briefcase className="w-3.5 h-3.5" /> Hire Requests
              </Link>
            )}

            {canManageRolesAndTech(hrUser?.role) && (
              <Link
                href="/admin/roles"
                className="px-3 py-1.5 border border-[#F8F7F4]/20 hover:border-white transition-colors flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" /> Roles & Tech
              </Link>
            )}

            {canManageAdminUsers(hrUser?.role) && (
              <Link
                href="/admin/users"
                className="px-3 py-1.5 border border-[#F8F7F4]/20 hover:border-white transition-colors flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" /> User Access
              </Link>
            )}

            <div className="px-3 py-1.5 bg-[#FF4D00] text-white font-bold flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> SEO Suite
            </div>
          </div>
        </div>
      </div>

      {/* Main Admin SEO Container */}
      <main className="flex-1 px-4 sm:px-[4vw] py-8 max-w-7xl mx-auto w-full">
        <SeoManagement hrUser={hrUser} />
      </main>
    </div>
  );
}
