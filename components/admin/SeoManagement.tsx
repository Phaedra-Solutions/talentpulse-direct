'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Globe, 
  Tag, 
  Share2, 
  FileText, 
  Cpu, 
  Bot, 
  Save, 
  RotateCcw, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  Code, 
  ShieldCheck, 
  ArrowLeft,
  Search,
  Sparkles,
  Layers,
  Check,
  Copy
} from 'lucide-react';
import { 
  SeoSettings, 
  PageSeoOverride, 
  FaqItem, 
  getSeoSettings, 
  getPageSeoOverrides,
  DEFAULT_SEO_SETTINGS,
  DEFAULT_PAGE_OVERRIDES
} from '@/lib/seo-service';
import { HrUser, canManageSeo } from '@/lib/auth/recruiter-auth';

interface SeoManagementProps {
  hrUser: HrUser | null;
}

type TabType = 'global' | 'gtm' | 'social' | 'pages' | 'schema' | 'crawlers';

export function SeoManagement({ hrUser }: SeoManagementProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('global');
  const [settings, setSettings] = useState<SeoSettings>(DEFAULT_SEO_SETTINGS);
  const [pageOverrides, setPageOverrides] = useState<PageSeoOverride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedGtm, setCopiedGtm] = useState(false);

  // Social preview simulator state
  const [previewPlatform, setPreviewPlatform] = useState<'google' | 'twitter' | 'facebook'>('google');

  // Page override edit modal state
  const [editingOverride, setEditingOverride] = useState<PageSeoOverride | null>(null);
  const [isNewPageModalOpen, setIsNewPageModalOpen] = useState(false);
  const [newPagePath, setNewPagePath] = useState('');

  // Check admin authorization
  const isAuthorized = Boolean(hrUser && canManageSeo(hrUser.role));

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [loadedSettings, loadedOverrides] = await Promise.all([
          getSeoSettings(),
          getPageSeoOverrides(),
        ]);
        setSettings(loadedSettings);
        setPageOverrides(loadedOverrides);
      } catch (err: any) {
        setErrorMessage('Failed to load SEO configuration from server.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveSettings = async () => {
    if (!isAuthorized) {
      setErrorMessage('Unauthorized: Only administrators can modify SEO and tracking configurations.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(null);

    try {
      const res = await fetch('/api/admin/seo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save SEO settings');
      }

      setSettings(data.settings);
      setSaveSuccess('SEO configuration saved and published successfully!');
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePageOverride = async (override: PageSeoOverride) => {
    if (!isAuthorized) {
      setErrorMessage('Unauthorized: Only administrators can edit page overrides.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/seo/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(override),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save page override');

      setPageOverrides(prev => {
        const idx = prev.findIndex(p => p.path === override.path);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = data.page;
          return updated;
        }
        return [...prev, data.page];
      });

      setEditingOverride(null);
      setIsNewPageModalOpen(false);
      setNewPagePath('');
      setSaveSuccess(`Page override for "${override.path}" saved.`);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating page override');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePageOverride = async (path: string) => {
    if (!confirm(`Are you sure you want to delete the custom override for ${path}?`)) return;

    try {
      const res = await fetch(`/api/admin/seo/pages?path=${encodeURIComponent(path)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Delete failed');

      setPageOverrides(prev => prev.filter(p => p.path !== path));
      setSaveSuccess(`Deleted override for ${path}.`);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete page override');
    }
  };

  // FAQ Handlers
  const handleAddFaq = () => {
    const newFaq: FaqItem = {
      id: `faq-${Date.now()}`,
      question: 'New Question',
      answer: 'Detailed, authoritative answer here.',
      is_active: true,
    };
    setSettings(prev => ({
      ...prev,
      faq_items: [...prev.faq_items, newFaq],
    }));
  };

  const handleUpdateFaq = (id: string, field: 'question' | 'answer' | 'is_active', value: any) => {
    setSettings(prev => ({
      ...prev,
      faq_items: prev.faq_items.map(f => f.id === id ? { ...f, [field]: value } : f),
    }));
  };

  const handleDeleteFaq = (id: string) => {
    setSettings(prev => ({
      ...prev,
      faq_items: prev.faq_items.filter(f => f.id !== id),
    }));
  };

  const copyGtmCode = () => {
    const code = `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${settings.gtm_id}');</script>
<!-- End Google Tag Manager -->`;
    navigator.clipboard.writeText(code);
    setCopiedGtm(true);
    setTimeout(() => setCopiedGtm(false), 2000);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-100 border-2 border-red-600 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-syne font-bold text-[#111113] mb-2">Access Restricted</h2>
        <p className="text-sm font-mono text-[#111113]/70 max-w-md mb-6">
          SEO and tracking configuration requires Administrator privileges. Your current role is <strong>{hrUser?.role || 'Guest'}</strong>.
        </p>
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111113] text-[#F8F7F4] font-mono text-xs uppercase tracking-wider font-bold hover:bg-[#FF4D00] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-12">
        <div className="w-10 h-10 border-4 border-[#111113] border-t-[#FF4D00] animate-spin mb-4" />
        <span className="font-mono text-xs uppercase tracking-widest text-[#111113]/70">
          Loading Enterprise SEO Configuration...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="bg-white border-2 border-[#111113] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#111113] text-[#F8F7F4] font-mono text-[11px] font-bold tracking-widest uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF4D00]" />
              ADMIN ONLY
            </span>
            <span className="font-mono text-xs text-[#111113]/60 uppercase tracking-wider">
              Next.js 15 App Router SEO Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-syne font-extrabold text-[#111113] mt-2">
            Search Engine Optimization & Tracking Suite
          </h1>
          <p className="text-xs font-mono text-[#111113]/70 mt-1">
            Manage metadata, GTM injection, social cards, Schema.org JSON-LD, robots.txt, sitemaps, and llms.txt.
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch md:self-auto">
          <Link
            href="/admin/dashboard"
            className="flex-1 md:flex-none px-4 py-2 border-2 border-[#111113] text-center font-mono text-xs uppercase font-bold tracking-wider hover:bg-[#111113]/5 transition-colors"
          >
            Dashboard
          </Link>
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#FF4D00] text-white font-mono text-xs uppercase font-bold tracking-wider hover:bg-[#e04400] transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Publish Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-600 flex items-center gap-3 text-emerald-900 font-mono text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border-2 border-red-600 flex items-center gap-3 text-red-900 font-mono text-xs">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b-2 border-[#111113] pb-2 font-mono text-xs uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('global')}
          className={`flex items-center gap-2 px-4 py-2 border-2 font-bold transition-all ${
            activeTab === 'global'
              ? 'bg-[#111113] text-white border-[#111113]'
              : 'bg-white text-[#111113] border-transparent hover:border-[#111113]'
          }`}
        >
          <Globe className="w-4 h-4" /> Global Meta
        </button>

        <button
          onClick={() => setActiveTab('gtm')}
          className={`flex items-center gap-2 px-4 py-2 border-2 font-bold transition-all ${
            activeTab === 'gtm'
              ? 'bg-[#111113] text-white border-[#111113]'
              : 'bg-white text-[#111113] border-transparent hover:border-[#111113]'
          }`}
        >
          <Tag className="w-4 h-4" /> GTM & Analytics
        </button>

        <button
          onClick={() => setActiveTab('social')}
          className={`flex items-center gap-2 px-4 py-2 border-2 font-bold transition-all ${
            activeTab === 'social'
              ? 'bg-[#111113] text-white border-[#111113]'
              : 'bg-white text-[#111113] border-transparent hover:border-[#111113]'
          }`}
        >
          <Share2 className="w-4 h-4" /> Social & Preview
        </button>

        <button
          onClick={() => setActiveTab('pages')}
          className={`flex items-center gap-2 px-4 py-2 border-2 font-bold transition-all ${
            activeTab === 'pages'
              ? 'bg-[#111113] text-white border-[#111113]'
              : 'bg-white text-[#111113] border-transparent hover:border-[#111113]'
          }`}
        >
          <FileText className="w-4 h-4" /> Page Overrides ({pageOverrides.length})
        </button>

        <button
          onClick={() => setActiveTab('schema')}
          className={`flex items-center gap-2 px-4 py-2 border-2 font-bold transition-all ${
            activeTab === 'schema'
              ? 'bg-[#111113] text-white border-[#111113]'
              : 'bg-white text-[#111113] border-transparent hover:border-[#111113]'
          }`}
        >
          <Code className="w-4 h-4" /> Schema & FAQs
        </button>

        <button
          onClick={() => setActiveTab('crawlers')}
          className={`flex items-center gap-2 px-4 py-2 border-2 font-bold transition-all ${
            activeTab === 'crawlers'
              ? 'bg-[#111113] text-white border-[#111113]'
              : 'bg-white text-[#111113] border-transparent hover:border-[#111113]'
          }`}
        >
          <Bot className="w-4 h-4" /> Robots, Sitemap & LLMs.txt
        </button>
      </div>

      {/* TAB 1: Global Meta */}
      {activeTab === 'global' && (
        <div className="bg-white border-2 border-[#111113] p-6 space-y-6">
          <div className="border-b border-[#111113]/10 pb-4">
            <h2 className="text-xl font-syne font-bold text-[#111113]">Global Default Metadata</h2>
            <p className="text-xs font-mono text-[#111113]/60">
              Configures the default title, meta description, and canonical domain applied across all pages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1.5">
                Site Name
              </label>
              <input
                type="text"
                value={settings.site_name}
                onChange={e => setSettings({ ...settings, site_name: e.target.value })}
                className="w-full px-3 py-2 border-2 border-[#111113] font-mono text-xs focus:outline-none focus:border-[#FF4D00]"
                placeholder="TalentPulse"
              />
            </div>

            <div>
              <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1.5">
                Canonical Base URL (No trailing slash)
              </label>
              <input
                type="url"
                value={settings.canonical_base_url}
                onChange={e => setSettings({ ...settings, canonical_base_url: e.target.value })}
                className="w-full px-3 py-2 border-2 border-[#111113] font-mono text-xs focus:outline-none focus:border-[#FF4D00]"
                placeholder="https://talentpulse.dev"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-mono text-xs uppercase font-bold text-[#111113]">
                  Title Template (Use %s for dynamic page title)
                </label>
                <span className="font-mono text-[11px] text-[#111113]/50">Example: %s | TalentPulse</span>
              </div>
              <input
                type="text"
                value={settings.title_template}
                onChange={e => setSettings({ ...settings, title_template: e.target.value })}
                className="w-full px-3 py-2 border-2 border-[#111113] font-mono text-xs focus:outline-none focus:border-[#FF4D00]"
                placeholder="%s | TalentPulse"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-mono text-xs uppercase font-bold text-[#111113]">
                  Default Page Title
                </label>
                <span className={`font-mono text-[11px] ${settings.default_title.length > 60 ? 'text-[#FF4D00] font-bold' : 'text-[#111113]/50'}`}>
                  {settings.default_title.length}/60 chars (Recommended ≤ 60)
                </span>
              </div>
              <input
                type="text"
                value={settings.default_title}
                onChange={e => setSettings({ ...settings, default_title: e.target.value })}
                className="w-full px-3 py-2 border-2 border-[#111113] font-mono text-xs focus:outline-none focus:border-[#FF4D00]"
                placeholder="TalentPulse | Hire Top 1% Vetted Remote Tech Talent"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-mono text-xs uppercase font-bold text-[#111113]">
                  Default Meta Description
                </label>
                <span className={`font-mono text-[11px] ${settings.default_meta_description.length > 160 ? 'text-[#FF4D00] font-bold' : 'text-[#111113]/50'}`}>
                  {settings.default_meta_description.length}/160 chars (Recommended 140-160)
                </span>
              </div>
              <textarea
                rows={3}
                value={settings.default_meta_description}
                onChange={e => setSettings({ ...settings, default_meta_description: e.target.value })}
                className="w-full px-3 py-2 border-2 border-[#111113] font-mono text-xs focus:outline-none focus:border-[#FF4D00]"
                placeholder="Source pre-vetted senior software engineers, architects, and AI developers..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1.5">
                Default Keywords (Comma separated)
              </label>
              <input
                type="text"
                value={settings.default_keywords}
                onChange={e => setSettings({ ...settings, default_keywords: e.target.value })}
                className="w-full px-3 py-2 border-2 border-[#111113] font-mono text-xs focus:outline-none focus:border-[#FF4D00]"
                placeholder="vetted developers, hire engineers, react developers, nextjs"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GTM & Analytics */}
      {activeTab === 'gtm' && (
        <div className="bg-white border-2 border-[#111113] p-6 space-y-6">
          <div className="border-b border-[#111113]/10 pb-4">
            <h2 className="text-xl font-syne font-bold text-[#111113]">Google Tag Manager & Tracking</h2>
            <p className="text-xs font-mono text-[#111113]/60">
              Injects official Google Tag Manager scripts into document &lt;head&gt; and &lt;noscript&gt; fallback into &lt;body&gt;.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1.5">
                Google Tag Manager ID
              </label>
              <input
                type="text"
                value={settings.gtm_id}
                onChange={e => setSettings({ ...settings, gtm_id: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border-2 border-[#111113] font-mono text-xs focus:outline-none focus:border-[#FF4D00]"
                placeholder="GTM-XXXXXXX"
              />
              <p className="mt-1 font-mono text-[11px] text-[#111113]/60">
                Container format: GTM- followed by letters/numbers.
              </p>
            </div>

            <div>
              <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1.5">
                Google Analytics 4 Measurement ID
              </label>
              <input
                type="text"
                value={settings.ga_id}
                onChange={e => setSettings({ ...settings, ga_id: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border-2 border-[#111113] font-mono text-xs focus:outline-none focus:border-[#FF4D00]"
                placeholder="G-XXXXXXXXXX"
              />
              <p className="mt-1 font-mono text-[11px] text-[#111113]/60">
                GA4 property ID format: G- followed by alphanumeric ID.
              </p>
            </div>

            <div className="md:col-span-2 p-4 bg-[#F8F7F4] border-2 border-[#111113] flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold uppercase text-[#111113] block">
                  Enable Google Tag Manager Injection
                </span>
                <span className="font-mono text-[11px] text-[#111113]/60">
                  When enabled, GTM container code is injected across all page renders.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.is_gtm_enabled}
                  onChange={e => setSettings({ ...settings, is_gtm_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none border-2 border-[#111113] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-2 after:border-[#111113] after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF4D00]"></div>
              </label>
            </div>

            {/* Injected Snippet Live Inspection */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs uppercase font-bold text-[#111113]">
                  Active Generated GTM Code (Injected into &lt;head&gt; and &lt;body&gt;)
                </span>
                <button
                  type="button"
                  onClick={copyGtmCode}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#111113] text-white font-mono text-[11px] uppercase hover:bg-[#FF4D00] transition-colors"
                >
                  {copiedGtm ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedGtm ? 'Copied' : 'Copy Snippet'}
                </button>
              </div>

              <pre className="p-4 bg-[#111113] text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed border-2 border-[#111113]">
{`<!-- Google Tag Manager (Head Script) -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${settings.gtm_id || 'GTM-XXXXXXX'}');</script>

<!-- Google Tag Manager (Body noscript fallback) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${settings.gtm_id || 'GTM-XXXXXXX'}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Social & Cards Simulator */}
      {activeTab === 'social' && (
        <div className="bg-white border-2 border-[#111113] p-6 space-y-6">
          <div className="border-b border-[#111113]/10 pb-4">
            <h2 className="text-xl font-syne font-bold text-[#111113]">Open Graph & Social Share Preview</h2>
            <p className="text-xs font-mono text-[#111113]/60">
              Configure Facebook/LinkedIn Open Graph, Twitter/X cards, and test how links appear in Google SERPs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1.5">
                  Default Social Share Image URL (og:image)
                </label>
                <input
                  type="url"
                  value={settings.og_image_url}
                  onChange={e => setSettings({ ...settings, og_image_url: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-[#111113] font-mono text-xs focus:outline-none focus:border-[#FF4D00]"
                  placeholder="https://talentpulse.dev/og-talentpulse.png"
                />
                <p className="mt-1 font-mono text-[11px] text-[#111113]/60">
                  Recommended resolution: 1200 x 630 pixels.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1.5">
                    Open Graph Type
                  </label>
                  <select
                    value={settings.og_type}
                    onChange={e => setSettings({ ...settings, og_type: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-[#111113] font-mono text-xs focus:outline-none focus:border-[#FF4D00] bg-white"
                  >
                    <option value="website">website</option>
                    <option value="article">article</option>
                    <option value="profile">profile</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1.5">
                    Twitter Card Type
                  </label>
                  <select
                    value={settings.twitter_card}
                    onChange={e => setSettings({ ...settings, twitter_card: e.target.value as any })}
                    className="w-full px-3 py-2 border-2 border-[#111113] font-mono text-xs focus:outline-none focus:border-[#FF4D00] bg-white"
                  >
                    <option value="summary_large_image">summary_large_image</option>
                    <option value="summary">summary</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1.5">
                  Twitter/X Handle (Creator / Site)
                </label>
                <input
                  type="text"
                  value={settings.twitter_handle}
                  onChange={e => setSettings({ ...settings, twitter_handle: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-[#111113] font-mono text-xs focus:outline-none focus:border-[#FF4D00]"
                  placeholder="@TalentPulseDev"
                />
              </div>
            </div>

            {/* Interactive Live Simulator */}
            <div className="border-2 border-[#111113] p-5 bg-[#F8F7F4]">
              <div className="flex items-center justify-between border-b border-[#111113]/20 pb-3 mb-4">
                <span className="font-mono text-xs uppercase font-bold text-[#111113] flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-[#FF4D00]" /> Live Card Simulator
                </span>
                <div className="flex gap-1 font-mono text-[10px] uppercase">
                  {(['google', 'twitter', 'facebook'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPreviewPlatform(p)}
                      className={`px-2.5 py-1 font-bold border ${
                        previewPlatform === p ? 'bg-[#111113] text-white border-[#111113]' : 'bg-white text-[#111113] border-gray-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {previewPlatform === 'google' && (
                <div className="bg-white p-4 rounded shadow-sm border border-gray-200 font-sans">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-full bg-[#111113] flex items-center justify-center text-white text-[10px] font-bold">
                      TP
                    </div>
                    <div>
                      <div className="text-xs text-gray-800 font-medium">TalentPulse</div>
                      <div className="text-[11px] text-gray-500 font-mono truncate max-w-sm">
                        {settings.canonical_base_url}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-blue-700 text-lg hover:underline cursor-pointer font-medium leading-snug line-clamp-1">
                    {settings.default_title}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                    {settings.default_meta_description}
                  </p>
                </div>
              )}

              {previewPlatform === 'twitter' && (
                <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm max-w-md mx-auto">
                  <div className="h-44 bg-[#111113] relative flex items-center justify-center text-white">
                    {settings.og_image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={settings.og_image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as any).style.display = 'none';
                        }}
                      />
                    ) : null}
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 text-white font-mono text-[10px] uppercase">
                      talentpulse.dev
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="font-bold text-sm text-gray-900 line-clamp-1">
                      {settings.default_title}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {settings.default_meta_description}
                    </div>
                  </div>
                </div>
              )}

              {previewPlatform === 'facebook' && (
                <div className="bg-white rounded overflow-hidden border border-gray-300 shadow-sm max-w-md mx-auto font-sans">
                  <div className="h-44 bg-gray-900 flex items-center justify-center text-white text-xs font-mono">
                    {settings.og_image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={settings.og_image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as any).style.display = 'none';
                        }}
                      />
                    ) : (
                      '1200 x 630 OG Preview Image'
                    )}
                  </div>
                  <div className="p-3 bg-gray-100 border-t border-gray-200">
                    <span className="text-[10px] font-mono uppercase text-gray-500 block">
                      TALENTPULSE.DEV
                    </span>
                    <span className="font-bold text-sm text-gray-900 line-clamp-1 block mt-0.5">
                      {settings.default_title}
                    </span>
                    <span className="text-xs text-gray-600 line-clamp-2 block mt-0.5">
                      {settings.default_meta_description}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Page Overrides Table */}
      {activeTab === 'pages' && (
        <div className="bg-white border-2 border-[#111113] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#111113]/10 pb-4">
            <div>
              <h2 className="text-xl font-syne font-bold text-[#111113]">Page-Specific SEO Overrides</h2>
              <p className="text-xs font-mono text-[#111113]/60">
                Customize titles, meta descriptions, canonical URLs, and indexing robots directives for individual routes.
              </p>
            </div>
            <button
              onClick={() => {
                setNewPagePath('/custom-route');
                setIsNewPageModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#111113] text-[#F8F7F4] font-mono text-xs uppercase font-bold tracking-wider hover:bg-[#FF4D00] transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Route Override
            </button>
          </div>

          <div className="overflow-x-auto border-2 border-[#111113]">
            <table className="w-full text-left font-sans text-xs">
              <thead className="bg-[#111113] text-white font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-3">Route / Slug</th>
                  <th className="p-3">Title & Meta Description</th>
                  <th className="p-3">Canonical URL</th>
                  <th className="p-3 text-center">Indexing Directives</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pageOverrides.map((page) => (
                  <tr key={page.path} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 align-top font-mono font-bold text-[#FF4D00]">
                      {page.path}
                    </td>
                    <td className="p-3 align-top max-w-md">
                      <div className="font-bold text-[#111113] line-clamp-1">{page.title}</div>
                      <div className="text-gray-600 text-[11px] mt-0.5 line-clamp-2">{page.description}</div>
                    </td>
                    <td className="p-3 align-top font-mono text-[11px] text-gray-500 truncate max-w-xs">
                      {page.canonical_url || `${settings.canonical_base_url}${page.path}`}
                    </td>
                    <td className="p-3 align-top text-center">
                      <span className={`inline-block px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                        page.no_index 
                          ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}>
                        {page.no_index ? 'NOINDEX' : 'INDEX'}
                      </span>
                    </td>
                    <td className="p-3 align-top text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => setEditingOverride(page)}
                          className="p-1.5 bg-[#111113] text-white hover:bg-[#FF4D00] transition-colors"
                          title="Edit Override"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {page.path !== '/' && (
                          <button
                            onClick={() => handleDeletePageOverride(page.path)}
                            className="p-1.5 bg-red-600 text-white hover:bg-red-700 transition-colors"
                            title="Delete Override"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Page Override Modal */}
      {editingOverride && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#111113] max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#111113]/20 pb-3">
              <div>
                <span className="font-mono text-xs uppercase font-bold text-[#FF4D00]">[OVERRIDE CONFIG]</span>
                <h3 className="text-xl font-syne font-bold text-[#111113]">Edit Route: {editingOverride.path}</h3>
              </div>
              <button
                onClick={() => setEditingOverride(null)}
                className="font-mono text-lg font-bold p-1 hover:text-[#FF4D00]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="block font-bold uppercase mb-1">Page Title</label>
                <input
                  type="text"
                  value={editingOverride.title}
                  onChange={e => setEditingOverride({ ...editingOverride, title: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-[#111113]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase mb-1">Meta Description</label>
                <textarea
                  rows={3}
                  value={editingOverride.description}
                  onChange={e => setEditingOverride({ ...editingOverride, description: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-[#111113]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase mb-1">Canonical URL</label>
                <input
                  type="url"
                  value={editingOverride.canonical_url || ''}
                  onChange={e => setEditingOverride({ ...editingOverride, canonical_url: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-[#111113]"
                  placeholder={`https://talentpulse.dev${editingOverride.path}`}
                />
              </div>

              <div>
                <label className="block font-bold uppercase mb-1">Custom Social Share Image URL (og:image)</label>
                <input
                  type="url"
                  value={editingOverride.og_image_url || ''}
                  onChange={e => setEditingOverride({ ...editingOverride, og_image_url: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-[#111113]"
                  placeholder="https://talentpulse.dev/og-custom.png"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 p-3 bg-[#F8F7F4] border border-[#111113]">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={editingOverride.no_index}
                    onChange={e => setEditingOverride({ ...editingOverride, no_index: e.target.checked })}
                    className="w-4 h-4 text-[#FF4D00]"
                  />
                  <span>noindex (Block search bots)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={editingOverride.no_follow}
                    onChange={e => setEditingOverride({ ...editingOverride, no_follow: e.target.checked })}
                    className="w-4 h-4 text-[#FF4D00]"
                  />
                  <span>nofollow (Do not follow links)</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#111113]/20">
              <button
                type="button"
                onClick={() => setEditingOverride(null)}
                className="px-4 py-2 border border-[#111113] font-mono text-xs uppercase"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSavePageOverride(editingOverride)}
                className="px-6 py-2 bg-[#FF4D00] text-white font-mono text-xs uppercase font-bold hover:bg-[#e04400]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Page Route Modal */}
      {isNewPageModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#111113] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-xl font-syne font-bold text-[#111113]">Add Route Override</h3>
            <p className="text-xs font-mono text-gray-600">
              Enter the exact URL path to configure custom meta tags for this route (e.g. <code>/candidates</code>, <code>/enterprise</code>).
            </p>

            <div>
              <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1">
                Route Slug / Path
              </label>
              <input
                type="text"
                value={newPagePath}
                onChange={e => setNewPagePath(e.target.value)}
                className="w-full px-3 py-2 border-2 border-[#111113] font-mono text-xs"
                placeholder="/custom-path"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsNewPageModalOpen(false)}
                className="px-4 py-2 border border-[#111113] font-mono text-xs uppercase"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newPagePath.startsWith('/')) {
                    alert('Path must start with a slash (e.g. /my-page)');
                    return;
                  }
                  const newOverride: PageSeoOverride = {
                    path: newPagePath,
                    title: `${newPagePath.replace('/', '')} | TalentPulse`,
                    description: settings.default_meta_description,
                    canonical_url: `${settings.canonical_base_url}${newPagePath}`,
                    no_index: false,
                    no_follow: false,
                  };
                  handleSavePageOverride(newOverride);
                }}
                className="px-5 py-2 bg-[#111113] text-white font-mono text-xs uppercase font-bold hover:bg-[#FF4D00]"
              >
                Initialize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Schema.org & FAQs */}
      {activeTab === 'schema' && (
        <div className="bg-white border-2 border-[#111113] p-6 space-y-8">
          <div>
            <div className="border-b border-[#111113]/10 pb-4 mb-6">
              <h2 className="text-xl font-syne font-bold text-[#111113]">Organization Structured Data (JSON-LD)</h2>
              <p className="text-xs font-mono text-[#111113]/60">
                Helps search engines generate rich Brand Knowledge Panels in Google SERPs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1.5">
                  Brand Legal Name
                </label>
                <input
                  type="text"
                  value={settings.organization_json?.legalName || ''}
                  onChange={e => setSettings({
                    ...settings,
                    organization_json: {
                      ...settings.organization_json,
                      legalName: e.target.value,
                    }
                  })}
                  className="w-full px-3 py-2 border-2 border-[#111113] font-mono text-xs"
                  placeholder="TalentPulse Global Technologies Inc."
                />
              </div>

              <div>
                <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1.5">
                  Logo URL (High-res PNG or SVG)
                </label>
                <input
                  type="url"
                  value={settings.organization_json?.logo || ''}
                  onChange={e => setSettings({
                    ...settings,
                    organization_json: {
                      ...settings.organization_json,
                      logo: e.target.value,
                    }
                  })}
                  className="w-full px-3 py-2 border-2 border-[#111113] font-mono text-xs"
                  placeholder="https://talentpulse.dev/logo.png"
                />
              </div>

              <div>
                <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1.5">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={settings.organization_json?.email || ''}
                  onChange={e => setSettings({
                    ...settings,
                    organization_json: {
                      ...settings.organization_json,
                      email: e.target.value,
                    }
                  })}
                  className="w-full px-3 py-2 border-2 border-[#111113] font-mono text-xs"
                  placeholder="hire@talentpulse.dev"
                />
              </div>

              <div>
                <label className="block font-mono text-xs uppercase font-bold text-[#111113] mb-1.5">
                  Founding Year
                </label>
                <input
                  type="text"
                  value={settings.organization_json?.foundingYear || ''}
                  onChange={e => setSettings({
                    ...settings,
                    organization_json: {
                      ...settings.organization_json,
                      foundingYear: e.target.value,
                    }
                  })}
                  className="w-full px-3 py-2 border-2 border-[#111113] font-mono text-xs"
                  placeholder="2024"
                />
              </div>
            </div>
          </div>

          {/* FAQ Schema Builder */}
          <div className="border-t-2 border-[#111113] pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-syne font-bold text-[#111113]">FAQPage Structured Data Builder</h3>
                <p className="text-xs font-mono text-[#111113]/60">
                  Adds structured FAQ markup directly to the landing page and enables Google search snippets.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddFaq}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#111113] text-white font-mono text-xs uppercase font-bold hover:bg-[#FF4D00] transition-colors"
              >
                <Plus className="w-4 h-4" /> Add FAQ
              </button>
            </div>

            <div className="space-y-4">
              {settings.faq_items.map((faq, idx) => (
                <div key={faq.id || idx} className="p-4 bg-[#F8F7F4] border-2 border-[#111113] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold uppercase text-[#FF4D00]">
                      Question #{idx + 1}
                    </span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 font-mono text-[11px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={faq.is_active}
                          onChange={e => handleUpdateFaq(faq.id, 'is_active', e.target.checked)}
                          className="w-3.5 h-3.5"
                        />
                        <span>Active in Schema</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeleteFaq(faq.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete FAQ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={faq.question}
                    onChange={e => handleUpdateFaq(faq.id, 'question', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-[#111113] bg-white font-mono text-xs font-bold"
                    placeholder="Enter question..."
                  />

                  <textarea
                    rows={2}
                    value={faq.answer}
                    onChange={e => handleUpdateFaq(faq.id, 'answer', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-[#111113] bg-white font-mono text-xs"
                    placeholder="Enter authoritative answer..."
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Crawlers & Bot Directives */}
      {activeTab === 'crawlers' && (
        <div className="bg-white border-2 border-[#111113] p-6 space-y-6">
          <div className="border-b border-[#111113]/10 pb-4">
            <h2 className="text-xl font-syne font-bold text-[#111113]">Search Engines & AI Crawler Directives</h2>
            <p className="text-xs font-mono text-[#111113]/60">
              Verify live crawler endpoints, manage robots.txt rules, and inspect the AI-ready llms.txt.
            </p>
          </div>

          {/* Master Indexing Switch */}
          <div className="p-4 bg-[#F8F7F4] border-2 border-[#111113] flex items-center justify-between">
            <div>
              <span className="font-mono text-xs font-bold uppercase text-[#111113] block">
                Allow Search Engines to Index TalentPulse
              </span>
              <span className="font-mono text-[11px] text-[#111113]/60">
                When switched off, robots.txt serves `Disallow: /` to block all bots during staging or private maintenance.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.is_indexing_enabled}
                onChange={e => setSettings({ ...settings, is_indexing_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none border-2 border-[#111113] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-2 after:border-[#111113] after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF4D00]"></div>
            </label>
          </div>

          {/* Live Endpoints Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border-2 border-[#111113] bg-[#F8F7F4]">
              <div className="font-mono text-[11px] uppercase tracking-wider text-[#FF4D00] font-bold mb-1">
                [SEARCH DIRECTIVE]
              </div>
              <h3 className="font-syne font-bold text-base text-[#111113] mb-1">robots.txt</h3>
              <p className="text-xs font-mono text-[#111113]/70 mb-4">
                Controls crawl permissions for Googlebot, Bingbot, GPTBot, and PerplexityBot.
              </p>
              <a
                href="/robots.txt"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#111113] text-white font-mono text-[11px] uppercase font-bold hover:bg-[#FF4D00] transition-colors"
              >
                Inspect Live <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="p-4 border-2 border-[#111113] bg-[#F8F7F4]">
              <div className="font-mono text-[11px] uppercase tracking-wider text-[#FF4D00] font-bold mb-1">
                [XML SITEMAP]
              </div>
              <h3 className="font-syne font-bold text-base text-[#111113] mb-1">sitemap.xml</h3>
              <p className="text-xs font-mono text-[#111113]/70 mb-4">
                Dynamic XML map indexing landing page, candidate directory, and individual profiles.
              </p>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#111113] text-white font-mono text-[11px] uppercase font-bold hover:bg-[#FF4D00] transition-colors"
              >
                Inspect Live <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="p-4 border-2 border-[#111113] bg-[#F8F7F4]">
              <div className="font-mono text-[11px] uppercase tracking-wider text-[#FF4D00] font-bold mb-1">
                [AI CONTEXT SPEC]
              </div>
              <h3 className="font-syne font-bold text-base text-[#111113] mb-1">llms.txt</h3>
              <p className="text-xs font-mono text-[#111113]/70 mb-4">
                Markdown brief formatted for LLMs (Perplexity, ChatGPT Search, Claude, Gemini).
              </p>
              <a
                href="/llms.txt"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#111113] text-white font-mono text-[11px] uppercase font-bold hover:bg-[#FF4D00] transition-colors"
              >
                Inspect Live <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
