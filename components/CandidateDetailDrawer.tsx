'use client';

import React, { useState } from 'react';
import { 
  Candidate, 
  getRoleMeta, 
  getAvailabilityMeta, 
  getPipelineStageMeta, 
  ENGLISH_LABELS,
  PipelineStage 
} from '@/types/candidate';
import { 
  X, 
  Mail, 
  ExternalLink, 
  GitBranch, 
  Briefcase, 
  Globe, 
  Clock, 
  DollarSign, 
  PlayCircle, 
  CheckCircle2, 
  Save, 
  FileText,
  Shield,
  Send,
  Copy,
  Check
} from 'lucide-react';

interface CandidateDetailDrawerProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  onStageChange: (id: string, stage: PipelineStage, notes: string) => Promise<void>;
}

export function CandidateDetailDrawer({
  candidate,
  isOpen,
  onClose,
  onStageChange,
}: CandidateDetailDrawerProps) {
  const [currentStage, setCurrentStage] = useState<PipelineStage>('new');
  const [internalNotes, setInternalNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const [prevCandidateId, setPrevCandidateId] = useState<string | null>(null);

  if (candidate && candidate.id !== prevCandidateId) {
    setPrevCandidateId(candidate.id);
    setCurrentStage(candidate.pipeline_stage);
    setInternalNotes(candidate.internal_notes || '');
    setSaveSuccess(false);
  }

  if (!isOpen || !candidate) return null;

  const roleMeta = getRoleMeta(candidate.primary_role);
  const availMeta = getAvailabilityMeta(candidate.availability_status);
  const stageMeta = getPipelineStageMeta(currentStage);

  const handleSaveNotesAndStage = async () => {
    setIsSaving(true);
    try {
      await onStageChange(candidate.id, currentStage, internalNotes);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(candidate.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const getEmbedVideoUrl = (url: string) => {
    if (!url) return null;
    if (url.includes('youtube.com/watch?v=')) {
      const id = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes('loom.com/share/')) {
      return url.replace('/share/', '/embed/');
    }
    return null;
  };

  const embedUrl = candidate.video_pitch_url ? getEmbedVideoUrl(candidate.video_pitch_url) : null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#111113]/70 backdrop-blur-xs flex justify-end">
      <div 
        className="relative w-full max-w-2xl bg-[#F8F7F4] border-l-2 border-[#111113] h-full flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="p-6 border-b-2 border-[#111113] bg-[#F8F7F4] flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 font-mono text-[10px] uppercase tracking-widest text-[#111113]/70 flex-wrap">
              <span className="font-bold text-[#FF4D00]">[{roleMeta.label || 'ENGINEER'}]</span>
              <span>•</span>
              <span className="text-[#111113] font-bold">[{availMeta.label || 'AVAILABLE'}]</span>
              {candidate.contractual_agreement_accepted && (
                <>
                  <span>•</span>
                  <span className="text-emerald-700 font-bold">[CONTRACT TERMS ACKNOWLEDGED]</span>
                </>
              )}
            </div>

            <h2 className="font-syne font-extrabold text-2xl sm:text-3xl text-[#111113]">
              {candidate.full_name}
            </h2>
            <div className="flex items-center gap-3 mt-1 font-mono text-xs text-[#111113]/60">
              <span>CREATED: {new Date(candidate.created_at).toLocaleDateString()}</span>
              <span>•</span>
              <span>UPDATED: {new Date(candidate.updated_at).toLocaleDateString()}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 border border-[#111113] hover:bg-[#111113] hover:text-[#F8F7F4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Dossier Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Metrics Bar */}
          <div className="grid grid-cols-3 gap-px bg-[#111113] border-2 border-[#111113]">
            <div className="bg-[#F8F7F4] p-3 sm:p-4">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#111113]/60 block font-bold">
                [CONTACT]
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#111113] block truncate mt-1 font-mono">
                {candidate.phone_number || 'N/A'}
              </span>
            </div>
            <div className="bg-[#F8F7F4] p-3 sm:p-4">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#111113]/60 block font-bold">
                [OVERLAP]
              </span>
              <span className="font-syne text-lg sm:text-xl font-bold text-[#111113] block mt-0.5">
                {candidate.overlap_hours_per_day} <span className="font-mono text-[10px] font-normal">HRS/DAY</span>
              </span>
            </div>
            <div className="bg-[#F8F7F4] p-3 sm:p-4">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#111113]/60 block font-bold">
                [ENGLISH]
              </span>
              <span className="font-mono text-xs font-bold text-[#FF4D00] block truncate mt-1 uppercase">
                {ENGLISH_LABELS[candidate.english_proficiency]}
              </span>
            </div>
          </div>

          {/* Quick Contact & Links */}
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] font-bold mb-2">
              [COMMUNICATION &amp; PROFILES]
            </div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              {candidate.phone_number && (
                <a
                  href={`tel:${candidate.phone_number}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#111113] bg-white text-[#111113] hover:bg-[#111113] hover:text-[#F8F7F4] transition-colors"
                >
                  <span className="text-[#FF4D00] font-bold">TEL:</span>
                  <span>{candidate.phone_number}</span>
                </a>
              )}

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#111113] bg-white text-[#111113]">
                <Mail className="w-3.5 h-3.5 text-[#FF4D00]" />
                <span>{candidate.email}</span>
                <button 
                  onClick={handleCopyEmail}
                  className="ml-1 text-[#111113]/60 hover:text-[#111113]"
                  title="Copy Email"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {candidate.linkedin_url && (
                <a
                  href={candidate.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#111113] bg-white hover:bg-[#111113] hover:text-[#F8F7F4] transition-colors"
                >
                  <Briefcase className="w-3.5 h-3.5 text-[#FF4D00]" />
                  <span>LinkedIn</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              )}

              {candidate.github_url && (
                <a
                  href={candidate.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#111113] bg-white hover:bg-[#111113] hover:text-[#F8F7F4] transition-colors"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>GitHub</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              )}

              {candidate.portfolio_url && (
                <a
                  href={candidate.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#111113] bg-white hover:bg-[#111113] hover:text-[#F8F7F4] transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-[#FF4D00]" />
                  <span>Portfolio</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              )}

              <a
                href={`mailto:${candidate.email}?subject=Contract%20Engagement%20Inquiry%20-%20TalentPulse%20Direct`}
                className="btn-brutalist btn-brutalist-primary text-xs py-1.5 px-3"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Contact</span>
              </a>
            </div>
          </div>

          {/* Video Pitch Screening */}
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] font-bold mb-2 flex items-center justify-between">
              <span>[VIDEO PITCH WALKTHROUGH]</span>
              {candidate.video_pitch_url && (
                <span className="text-emerald-700 font-bold lowercase">[verified]</span>
              )}
            </div>

            {candidate.video_pitch_url ? (
              <div className="border-2 border-[#111113] bg-[#111113] overflow-hidden">
                {embedUrl ? (
                  <div className="aspect-video w-full">
                    <iframe
                      src={embedUrl}
                      title="Candidate Video Pitch"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="p-4 flex items-center justify-between text-white font-mono text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <PlayCircle className="w-4 h-4 text-[#FF4D00]" />
                      <span className="truncate max-w-sm">{candidate.video_pitch_url}</span>
                    </div>
                    <a
                      href={candidate.video_pitch_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 border border-white bg-transparent hover:bg-white hover:text-[#111113] transition-colors uppercase font-bold text-[10px]"
                    >
                      Open Pitch
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-[#111113]/30 font-mono text-xs text-[#111113]/60 text-center uppercase">
                [No video pitch attached yet]
              </div>
            )}
          </div>

          {/* Resume / CV Section */}
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] font-bold mb-2 flex items-center justify-between">
              <span>[TECHNICAL RESUME / ARTIFACT]</span>
              {candidate.resume_url && (
                <span className="text-emerald-700 font-bold">[PDF ATTACHED]</span>
              )}
            </div>

            {candidate.resume_url ? (
              <div className="p-4 border-2 border-[#111113] bg-white flex items-center justify-between">
                <div className="truncate">
                  <span className="font-mono text-xs font-bold text-[#111113] block truncate">
                    {candidate.resume_filename || 'Candidate_Resume.pdf'}
                  </span>
                  <span className="font-mono text-[10px] text-[#111113]/60 uppercase">
                    Direct candidate dossier attachment
                  </span>
                </div>

                <a
                  href={candidate.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-brutalist btn-brutalist-primary text-xs py-1.5 px-3 shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View PDF</span>
                </a>
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-[#111113]/30 font-mono text-xs text-[#111113]/60 text-center uppercase">
                [No PDF resume uploaded]
              </div>
            )}
          </div>

          {/* Timezone & Overlap Breakdown */}
          <div className="p-4 border-2 border-[#111113] bg-white space-y-3 font-mono text-xs">
            <div className="font-bold uppercase tracking-widest text-[#FF4D00]">
              [TIMEZONE &amp; COVERAGE MATRIX]
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[#111113]/60 block uppercase text-[10px] font-bold">Home Timezone:</span>
                <p className="font-bold text-[#111113]">{candidate.home_timezone}</p>
              </div>
              <div>
                <span className="text-[#111113]/60 block uppercase text-[10px] font-bold">Available From:</span>
                <p className="font-bold text-[#111113]">{candidate.available_from}</p>
              </div>
              <div>
                <span className="text-[#111113]/60 block uppercase text-[10px] font-bold">Target Regions:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {candidate.target_timezones.map((tz) => (
                    <span key={tz} className="px-1.5 py-0.5 border border-[#111113] text-[#111113] bg-[#F8F7F4] text-[10px]">
                      {tz}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[#111113]/60 block uppercase text-[10px] font-bold">Work Mode:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {candidate.work_modes.map((mode) => (
                    <span key={mode} className="px-1.5 py-0.5 border border-[#FF4D00] text-[#FF4D00] bg-[#F8F7F4] text-[10px] uppercase font-bold">
                      {mode}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Written Pitch & Bio */}
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] font-bold mb-2">
              [ENGINEERING DOSSIER &amp; PROFILE]
            </div>
            <div className="p-4 border-2 border-[#111113] bg-white text-xs text-[#111113] leading-relaxed whitespace-pre-line font-sans">
              {candidate.written_pitch}
            </div>
          </div>

          {/* Tech Stack */}
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] font-bold mb-2">
              [VERIFIED TECH STACK] ({candidate.tech_stack.length})
            </div>
            <div className="flex flex-wrap gap-1.5 font-mono text-xs">
              {candidate.tech_stack.map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 border border-[#111113] bg-white text-[#111113] font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* HR Pipeline Stage Management & Notes */}
          <div className="p-5 border-2 border-[#111113] bg-[#F8F7F4] space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-xs uppercase tracking-widest text-[#FF4D00] font-bold">
                [PIPELINE STAGE &amp; EVALUATION]
              </div>
              <span className="font-mono text-[10px] uppercase font-bold border border-[#111113] px-2 py-0.5 bg-white">
                CURRENT: {stageMeta.label}
              </span>
            </div>

            {/* Stage Selector Buttons */}
            <div>
              <label className="font-mono text-xs text-[#111113]/70 mb-1.5 block uppercase">
                Change Pipeline Status:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 font-mono text-xs">
                {(['new', 'vetted', 'interviewing', 'assigned', 'on_hold'] as PipelineStage[]).map((stage) => {
                  const meta = getPipelineStageMeta(stage);
                  const isSelected = currentStage === stage;
                  return (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => setCurrentStage(stage)}
                      className={`text-xs font-bold uppercase px-3 py-2 border text-left transition ${
                        isSelected 
                          ? 'border-[#111113] bg-[#111113] text-[#F8F7F4]' 
                          : 'border-[#111113]/40 bg-white text-[#111113] hover:border-[#111113]'
                      }`}
                    >
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recruiter Evaluation Notes Text Area */}
            <div>
              <label className="font-mono text-xs text-[#111113]/70 mb-1.5 block uppercase flex items-center justify-between">
                <span>Evaluation Notes:</span>
                <span className="text-[#FF4D00] font-bold">[SYNCED]</span>
              </label>
              <textarea
                rows={4}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Screening takeaways, client match recommendations, hourly rate agreements..."
                className="w-full font-mono text-xs border-2 border-[#111113] bg-white p-3 text-[#111113] placeholder:text-[#111113]/40 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="font-mono text-xs text-[#111113]/70">
                {saveSuccess ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> [CHANGES SAVED]
                  </span>
                ) : (
                  <span>Click Save to commit changes.</span>
                )}
              </span>

              <button
                type="button"
                onClick={handleSaveNotesAndStage}
                disabled={isSaving}
                className="btn-brutalist btn-brutalist-primary text-xs py-2 px-4"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Evaluation'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-[#111113] bg-[#F8F7F4] flex items-center justify-between font-mono text-xs">
          <span className="text-[#111113]/60 truncate max-w-[200px]">
            ID: {candidate.id.slice(0, 13)}...
          </span>
          <button
            onClick={onClose}
            className="btn-brutalist text-xs py-1.5 px-4"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
