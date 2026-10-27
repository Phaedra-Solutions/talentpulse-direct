'use client';

import React from 'react';
import { 
  Candidate, 
  getRoleMeta, 
  getAvailabilityMeta, 
  getPipelineStageMeta 
} from '@/types/candidate';
import { 
  PlayCircle, 
  Clock, 
  Phone, 
  FileText, 
  ArrowUpRight, 
  ShieldCheck
} from 'lucide-react';

interface CandidateCardProps {
  candidate: Candidate;
  onSelect: (candidate: Candidate) => void;
  compact?: boolean;
}

export function CandidateCard({ candidate, onSelect, compact = false }: CandidateCardProps) {
  const roleMeta = getRoleMeta(candidate.primary_role);
  const availMeta = getAvailabilityMeta(candidate.availability_status);
  const stageMeta = getPipelineStageMeta(candidate.pipeline_stage);

  return (
    <div 
      onClick={() => onSelect(candidate)}
      className="group relative bg-[#F8F7F4] border-[1.5px] border-[#111113] p-5 sm:p-6 transition-all cursor-pointer flex flex-col justify-between hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#111113]"
    >
      <div>
        {/* Top Monospace Metadata */}
        <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-[#111113]/20 font-mono text-[10px] uppercase tracking-widest text-[#111113]/70">
          <span className="font-bold text-[#FF4D00]">
            [{roleMeta.label || 'ENGINEER'}]
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 ${candidate.availability_status === 'available_now' ? 'bg-[#FF4D00]' : 'bg-[#111113]'}`} />
            {availMeta.label || 'AVAILABLE'}
          </span>
        </div>

        {/* Candidate Name & Title */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-syne font-bold text-xl text-[#111113] group-hover:text-[#FF4D00] transition-colors leading-tight">
              {candidate.full_name}
            </h3>
            <span className="text-[#111113] group-hover:text-[#FF4D00] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0 mt-0.5">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>

          <p className="font-sans text-xs text-[#111113]/80 line-clamp-2 mt-2 leading-relaxed">
            {candidate.written_pitch}
          </p>
        </div>

        {/* Contact Phone & Overlap Info Bar */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-white border border-[#111113] mb-4 font-mono text-xs">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-[#FF4D00] text-[10px] font-bold">[TEL]</span>
            <span className="text-[#111113] truncate font-medium">
              {candidate.phone_number || 'N/A'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-[#FF4D00] text-[10px] font-bold">[SYNC]</span>
            <span className="text-[#111113] font-medium">
              {candidate.overlap_hours_per_day}h/day
            </span>
          </div>
        </div>

        {/* Target Timezones */}
        <div className="flex items-center gap-1.5 mb-3 flex-wrap font-mono text-[10px]">
          <span className="uppercase text-[#111113]/60 tracking-wider">REGIONS:</span>
          {candidate.target_timezones.map(region => (
            <span 
              key={region} 
              className="px-1.5 py-0.5 border border-[#111113] text-[#111113] bg-white font-medium"
            >
              {region}
            </span>
          ))}
          <span className="text-[#111113]/60 ml-auto truncate max-w-[120px]">
            {candidate.home_timezone.split(' — ')[0] || candidate.home_timezone.split(' ')[0]}
          </span>
        </div>

        {/* Tech Stack Chips */}
        <div className="flex flex-wrap gap-1.5 mb-4 font-mono text-[10px]">
          {candidate.tech_stack.slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="px-2 py-0.5 border border-[#111113]/30 text-[#111113] bg-white"
            >
              {tech}
            </span>
          ))}
          {candidate.tech_stack.length > 4 && (
            <span className="px-1.5 py-0.5 text-[#111113]/60 border border-[#111113]/20">
              +{candidate.tech_stack.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="pt-3 border-t border-[#111113] flex items-center justify-between font-mono text-[10px]">
        <div className="flex items-center gap-2 flex-wrap">
          {candidate.resume_url && (
            <span className="inline-flex items-center gap-1 border border-[#111113] px-1.5 py-0.5 bg-white text-[#111113] font-bold">
              [RESUME]
            </span>
          )}
          {candidate.video_pitch_url && (
            <span className="inline-flex items-center gap-1 border border-[#FF4D00] text-[#FF4D00] px-1.5 py-0.5 bg-white font-bold">
              [PITCH]
            </span>
          )}
          {candidate.contractual_agreement_accepted && (
            <span className="text-[#111113]/70 font-bold">
              [CONTRACTUAL]
            </span>
          )}
        </div>

        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#111113] bg-white border border-[#111113] px-2 py-0.5">
          {stageMeta?.label || 'NEW'}
        </span>
      </div>
    </div>
  );
}
