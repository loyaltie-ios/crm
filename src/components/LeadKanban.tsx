import React, { useState } from 'react';
import { ArrowRight, Globe, Landmark, UserRound } from 'lucide-react';
import type { Lead, LeadStage } from '../types';
import {
  LEAD_STAGES,
  formatBudgetRub,
  getMessengerLabel,
  getNextStage,
  getStatusMeta,
  groupLeadsByStage,
  normalizeUrl,
} from '../utils/crmLogic';

interface LeadKanbanProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onChangeStage: (leadId: string, stage: LeadStage) => void;
}

const ACTIVE_KANBAN_STAGES = LEAD_STAGES.filter((s) => s.id !== 'rejected');

export function LeadKanban({ leads, onSelectLead, onChangeStage }: LeadKanbanProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStage | null>(null);

  const grouped = groupLeadsByStage(leads);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="grid grid-flow-col auto-cols-[290px] gap-4">
        {ACTIVE_KANBAN_STAGES.map((stage) => {
          const items = grouped[stage.id];
          const isDropTarget = dragOverStage === stage.id;

          return (
            <section
              key={stage.id}
              aria-label={`Колонка этапа ${stage.label}`}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverStage !== stage.id) setDragOverStage(stage.id);
              }}
              onDragLeave={() => {
                if (dragOverStage === stage.id) setDragOverStage(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const leadId = e.dataTransfer.getData('text/plain') || draggedId;
                if (leadId) {
                  onChangeStage(leadId, stage.id);
                }
                setDraggedId(null);
                setDragOverStage(null);
              }}
              className={`flex flex-col rounded-xl border p-3 transition-colors duration-150 ${
                isDropTarget
                  ? 'border-[#3B82F6]/60 bg-[#3B82F6]/[0.06]'
                  : 'border-white/[0.06] bg-[#0F141E]'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-1 pb-3 mb-2 border-b border-white/[0.06]">
                <h3 className="text-[13px] font-semibold text-slate-200">{stage.label}</h3>
                <span className="font-mono text-xs tabular-nums text-slate-500">
                  {items.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-1 flex-col gap-2.5 min-h-[160px]">
                {items.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-white/[0.06] px-3 py-8 text-center text-xs text-slate-500">
                    Перетащите ЖК сюда
                  </div>
                ) : (
                  items.map((lead) => {
                    const statusMeta = getStatusMeta(lead.status);
                    const nextStage = getNextStage(lead.stage);
                    const siteHref = normalizeUrl(lead.websiteUrl);
                    const lprHref = normalizeUrl(lead.lprUrl);
                    const nashDomHref = normalizeUrl(lead.nashDomUrl);

                    return (
                      <article
                        key={lead.id}
                        draggable
                        onDragStart={(e) => {
                          setDraggedId(lead.id);
                          e.dataTransfer.setData('text/plain', lead.id);
                        }}
                        onDragEnd={() => {
                          setDraggedId(null);
                          setDragOverStage(null);
                        }}
                        className={`rounded-lg border border-white/[0.07] bg-[#141A27] p-3.5 transition-all duration-150 hover:border-[#3B82F6]/45 ${
                          draggedId === lead.id ? 'opacity-50 scale-[0.98]' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectLead(lead)}
                            className="text-left text-sm font-semibold text-[#F1F5F9] hover:text-[#60A5FA] transition-colors"
                          >
                            {lead.projectName}
                          </button>
                          <span className={`text-[11px] font-semibold shrink-0 ${statusMeta.tone}`}>
                            {statusMeta.label}
                          </span>
                        </div>

                        <p className="mt-0.5 text-xs text-slate-400 truncate">
                          {lead.developerName || 'Застройщик'}
                          {lead.city ? ` · ${lead.city}` : ''}
                        </p>

                        <div className="mt-2 text-xs text-slate-300 truncate">
                          <span>{lead.lprName || 'ЛПР не указан'}</span>
                          <span className="mx-1.5 text-slate-600" aria-hidden="true">·</span>
                          <span className="text-slate-400">{getMessengerLabel(lead.messenger)}</span>
                        </div>

                        {lead.comment && (
                          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-400">
                            {lead.comment}
                          </p>
                        )}

                        <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 text-slate-400">
                            {siteHref && (
                              <a
                                href={siteHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Открыть текущий сайт"
                                aria-label={`Сайт ${lead.projectName}`}
                                className="hover:text-[#60A5FA] transition-colors"
                              >
                                <Globe className="h-3.5 w-3.5" />
                              </a>
                            )}
                            {lprHref && (
                              <a
                                href={lprHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Открыть ЛПР"
                                aria-label={`ЛПР ${lead.projectName}`}
                                className="hover:text-[#60A5FA] transition-colors"
                              >
                                <UserRound className="h-3.5 w-3.5" />
                              </a>
                            )}
                            {nashDomHref && (
                              <a
                                href={nashDomHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Открыть наш.дом.рф"
                                aria-label={`наш.дом.рф ${lead.projectName}`}
                                className="hover:text-[#60A5FA] transition-colors"
                              >
                                <Landmark className="h-3.5 w-3.5" />
                              </a>
                            )}
                            {lead.estimatedBudget ? (
                              <span className="font-mono text-[11px] tabular-nums text-slate-500">
                                {formatBudgetRub(lead.estimatedBudget)}
                              </span>
                            ) : null}
                          </div>

                          {nextStage && (
                            <button
                              type="button"
                              onClick={() => onChangeStage(lead.id, nextStage)}
                              aria-label={`Перевести ${lead.projectName} на следующий этап`}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[#60A5FA] hover:bg-[#3B82F6]/15 transition-colors active:scale-[0.97] whitespace-nowrap"
                            >
                              <span>Далее</span>
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
