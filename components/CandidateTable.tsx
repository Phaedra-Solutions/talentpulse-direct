'use client';

import React from 'react';
import { 
  Candidate, 
  getRoleMeta, 
  getAvailabilityMeta, 
  getPipelineStageMeta,
  ENGLISH_LABELS,
  PipelineStage 
} from '@/types/candidate';
import { 
  PlayCircle, 
  Clock, 
  ExternalLink, 
  ArrowUpDown, 
  Eye, 
  Mail, 
  Linkedin, 
  Github,
  Phone,
  FileText
} from 'lucide-react';

interface CandidateTableProps {
  candidates: Candidate[];
  onSelectCandidate: (candidate: Candidate) => void;
  onQuickStageChange: (id: string, stage: PipelineStage, notes: string) => Promise<void>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (column: any) => void;
}

export function CandidateTable({
  candidates,
  onSelectCandidate,
  onQuickStageChange,
  sortBy,
  sortOrder,
  onSortChange,
}: CandidateTableProps) {
  return (
    <div className="overflow-x-auto border-2 border-[#111113] bg-white shadow-[4px_4px_0px_0px_#111113]">
      <table className="w-full text-left text-xs">
        <thead className="bg-[#111113] text-[#F8F7F4] uppercase font-mono text-[10px] tracking-wider border-b-2 border-[#111113]">
          <tr>
            <th 
              onClick={() => onSortChange('full_name')}
              className="py-3.5 px-4 cursor-pointer hover:text-[#FF4D00] transition"
            >
              <div className="flex items-center gap-1.5">
                <span>[CANDIDATE &amp; TEL]</span>
                <ArrowUpDown className="w-3 h-3 text-[#FF4D00]" />
              </div>
            </th>

            <th className="py-3.5 px-4">[TRACK &amp; STACK]</th>

            <th 
              onClick={() => onSortChange('availability_status')}
              className="py-3.5 px-4 cursor-pointer hover:text-[#FF4D00] transition"
            >
              <div className="flex items-center gap-1.5">
                <span>[STATUS]</span>
                <ArrowUpDown className="w-3 h-3 text-[#FF4D00]" />
              </div>
            </th>

            <th 
              onClick={() => onSortChange('overlap_hours_per_day')}
              className="py-3.5 px-4 cursor-pointer hover:text-[#FF4D00] transition"
            >
              <div className="flex items-center gap-1.5">
                <span>[OVERLAP]</span>
                <ArrowUpDown className="w-3 h-3 text-[#FF4D00]" />
              </div>
            </th>

            <th className="py-3.5 px-4">[RESUME]</th>

            <th className="py-3.5 px-4">[VIDEO]</th>

            <th className="py-3.5 px-4">[STAGE]</th>

            <th className="py-3.5 px-4 text-right">[ACTION]</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#111113]/20 font-sans">
          {candidates.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-12 text-center font-mono text-xs text-[#111113]/60 uppercase">
                [No candidates matched current search and filter parameters]
              </td>
            </tr>
          ) : (
            candidates.map((c) => {
              const roleMeta = getRoleMeta(c.primary_role);
              const availMeta = getAvailabilityMeta(c.availability_status);
              const stageMeta = getPipelineStageMeta(c.pipeline_stage);

              return (
                <tr 
                  key={c.id}
                  className="hover:bg-[#F8F7F4] transition-colors group"
                >
                  {/* Candidate Name & Contact Info */}
                  <td className="py-3.5 px-4">
                    <div 
                      onClick={() => onSelectCandidate(c)}
                      className="cursor-pointer"
                    >
                      <span className="font-syne font-bold text-sm text-[#111113] group-hover:text-[#FF4D00] transition-colors block">
                        {c.full_name}
                      </span>
                      <span className="text-[11px] text-[#111113]/60 font-mono block">
                        {c.email}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 flex-wrap font-mono text-[11px]">
                      {c.phone_number && (
                        <a
                          href={`tel:${c.phone_number}`}
                          className="inline-flex items-center gap-1 text-[#111113] hover:text-[#FF4D00]"
                        >
                          <Phone className="w-3 h-3 text-[#FF4D00]" />
                          <span>{c.phone_number}</span>
                        </a>
                      )}
                      {c.linkedin_url && (
                        <a 
                          href={c.linkedin_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#111113]/60 hover:text-[#FF4D00] transition"
                          title="LinkedIn Profile"
                        >
                          <Linkedin className="w-3 h-3" />
                        </a>
                      )}
                      {c.github_url && (
                        <a 
                          href={c.github_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#111113]/60 hover:text-[#111113] transition"
                          title="GitHub Profile"
                        >
                          <Github className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </td>

                  {/* Role & Tech Stack */}
                  <td className="py-3.5 px-4 max-w-xs font-mono">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#FF4D00] mb-1.5">
                      [{roleMeta?.label || 'ENGINEER'}]
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {c.tech_stack.slice(0, 3).map((tech) => (
                        <span 
                          key={tech} 
                          className="text-[10px] font-mono px-1.5 py-0.5 border border-[#111113]/30 bg-white text-[#111113]"
                        >
                          {tech}
                        </span>
                      ))}
                      {c.tech_stack.length > 3 && (
                        <span className="text-[10px] text-[#111113]/60 px-1">+{c.tech_stack.length - 3}</span>
                      )}
                    </div>
                  </td>

                  {/* Availability */}
                  <td className="py-3.5 px-4 font-mono text-xs">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1.5 font-bold uppercase text-[10px] text-[#111113]">
                        <span className={`w-1.5 h-1.5 ${c.availability_status === 'available_now' ? 'bg-[#FF4D00]' : 'bg-[#111113]'}`} />
                        {availMeta?.label || 'AVAILABLE'}
                      </span>
                      <span className="text-[10px] text-[#111113]/60 block">
                        From: {c.available_from}
                      </span>
                    </div>
                  </td>

                  {/* Client Overlap */}
                  <td className="py-3.5 px-4 font-mono text-xs">
                    <div className="space-y-1">
                      <div className="font-bold text-[#111113]">
                        {c.overlap_hours_per_day}h/day
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {c.target_timezones.map(t => (
                          <span key={t} className="text-[9px] px-1 border border-[#111113] bg-[#F8F7F4] text-[#111113]">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>

                  {/* Resume / CV */}
                  <td className="py-3.5 px-4 font-mono">
                    {c.resume_url ? (
                      <button
                        onClick={() => onSelectCandidate(c)}
                        className="inline-flex items-center gap-1 text-[11px] text-[#111113] font-bold hover:text-[#FF4D00] border border-[#111113] px-2 py-0.5 bg-white"
                      >
                        <FileText className="w-3 h-3 text-[#FF4D00]" />
                        <span className="truncate max-w-[90px]">[PDF]</span>
                      </button>
                    ) : (
                      <span className="text-[#111113]/40 text-[10px]">[NONE]</span>
                    )}
                  </td>

                  {/* Video Pitch */}
                  <td className="py-3.5 px-4 font-mono">
                    {c.video_pitch_url ? (
                      <button
                        onClick={() => onSelectCandidate(c)}
                        className="inline-flex items-center gap-1 text-[11px] text-[#FF4D00] font-bold hover:text-[#111113] border border-[#FF4D00] px-2 py-0.5 bg-white"
                      >
                        <PlayCircle className="w-3 h-3" />
                        <span>[PLAY]</span>
                      </button>
                    ) : (
                      <span className="text-[#111113]/40 text-[10px]">[NONE]</span>
                    )}
                  </td>

                  {/* Stage Switcher */}
                  <td className="py-3.5 px-4 font-mono">
                    <select
                      value={c.pipeline_stage}
                      onChange={(e) => onQuickStageChange(c.id, e.target.value as PipelineStage, c.internal_notes)}
                      className="text-xs font-bold uppercase px-2 py-1 border-2 border-[#111113] bg-white text-[#111113] cursor-pointer focus:outline-hidden"
                    >
                      <option value="new">New Lead</option>
                      <option value="vetted">Vetted</option>
                      <option value="interviewing">Interviewing</option>
                      <option value="assigned">Assigned</option>
                      <option value="on_hold">On Hold</option>
                    </select>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onSelectCandidate(c)}
                      className="btn-brutalist btn-brutalist-primary text-[10px] py-1 px-2.5"
                    >
                      <span>Dossier</span>
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
