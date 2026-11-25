import React from 'react';
import { ExternalLink, Globe, UserRound, Landmark, Plus, ChevronDown } from 'lucide-react';
import type { Lead, LeadStage } from '../types';
import {
  LEAD_STAGES,
  formatBudgetRub,
  getMessengerLabel,
  getStatusMeta,
  normalizeUrl,
} from '../utils/crmLogic';

interface LeadTableProps {
  leads: Lead[];
  totalLeadsCount: number;
  onSelectLead: (lead: Lead) => void;
  onChangeStage: (leadId: string, stage: LeadStage) => void;
  onResetFilters: () => void;
  onOpenNewLead: () => void;
}

export function LeadTable({
  leads,
  totalLeadsCount,
  onSelectLead,
  onChangeStage,
  onResetFilters,
  onOpenNewLead,
}: LeadTableProps) {
  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.07] bg-[#111622] px-6 py-16 text-center">
        <p className="text-base font-semibold text-white">
          {totalLeadsCount === 0
            ? 'База контактов пока пуста'
            : 'По выбранным фильтрам ничего не найдено'}
        </p>
        <p className="mt-1.5 text-sm text-slate-400">
          {totalLeadsCount === 0
            ? 'Добавьте первый ЖК и контакт ЛПР, чтобы начать вести воронку аутрича.'
            : 'Попробуйте изменить поисковый запрос или сбросить активные фильтры.'}
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          {totalLeadsCount > 0 ? (
            <button
              type="button"
              onClick={onResetFilters}
              className="rounded-lg border border-white/[0.1] bg-[#171E2E] px-4 py-2 text-sm font-medium text-slate-200 hover:bg-[#1E273B] transition-colors active:scale-[0.98]"
            >
              Сбросить фильтры
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenNewLead}
              className="inline-flex items-center gap-2 rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white hover:bg-[#2563EB] transition-colors active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>Добавить первый контакт</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#111622] overflow-hidden">
      {/* Mobile Stacked List (zero horizontal clipping on <768px) */}
      <div className="divide-y divide-white/[0.06] md:hidden">
        {leads.map((lead) => {
          const statusMeta = getStatusMeta(lead.status);
          const siteHref = normalizeUrl(lead.websiteUrl);
          const lprHref = normalizeUrl(lead.lprUrl);
          const nashDomHref = normalizeUrl(lead.nashDomUrl);

          return (
            <div key={lead.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onSelectLead(lead)}
                    className="text-left text-[15px] font-semibold text-[#F1F5F9] hover:text-[#60A5FA] transition-colors"
                  >
                    {lead.projectName}
                  </button>
                  <p className="mt-0.5 text-xs text-slate-400 truncate">
                    {lead.developerName || 'Застройщик не указан'}
                    {lead.city ? ` · ${lead.city}` : ''}
                  </p>
                </div>
                <span className={`text-xs font-semibold shrink-0 ${statusMeta.tone}`}>
                  {statusMeta.label}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs">
                {siteHref && (
                  <a
                    href={siteHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-slate-300 hover:text-[#60A5FA]"
                  >
                    <Globe className="h-3.5 w-3.5 text-slate-500" />
                    <span>Сайт</span>
                  </a>
                )}
                {lprHref && (
                  <a
                    href={lprHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-slate-300 hover:text-[#60A5FA]"
                  >
                    <UserRound className="h-3.5 w-3.5 text-slate-500" />
                    <span>ЛПР</span>
                  </a>
                )}
                {nashDomHref && (
                  <a
                    href={nashDomHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-slate-300 hover:text-[#60A5FA]"
                  >
                    <Landmark className="h-3.5 w-3.5 text-slate-500" />
                    <span>наш.дом.рф</span>
                  </a>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-300 truncate">
                  {lead.lprName || 'ЛПР не указан'} ·{' '}
                  <span className="text-slate-400">{getMessengerLabel(lead.messenger)}</span>
                </span>
                <div className="relative shrink-0">
                  <select
                    aria-label={`Этап для ${lead.projectName}`}
                    value={lead.stage}
                    onChange={(e) => onChangeStage(lead.id, e.target.value as LeadStage)}
                    className="appearance-none cursor-pointer rounded-md border border-white/[0.08] bg-[#0D111A] py-1.5 pl-2.5 pr-7 text-xs font-medium text-slate-200 focus:border-[#3B82F6] focus:outline-none"
                  >
                    {LEAD_STAGES.map((stage) => (
                      <option key={stage.id} value={stage.id} className="bg-[#111622] text-slate-100">
                        {stage.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              {lead.comment && (
                <p className="line-clamp-2 text-xs leading-relaxed text-slate-400">
                  {lead.comment}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop High-Density Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/[0.07] bg-[#0F141F] text-xs font-medium text-slate-400">
              <th className="py-3 pl-5 pr-4 w-[21%]">ЖК и застройщик</th>
              <th className="py-3 px-4 w-[16%]">Ссылки</th>
              <th className="py-3 px-4 w-[17%]">ЛПР и канал</th>
              <th className="py-3 px-4 w-[17%]">Этап</th>
              <th className="py-3 px-4 w-[9%]">Статус</th>
              <th className="py-3 pl-4 pr-5 w-[20%]">Комментарий</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05] text-sm">
            {leads.map((lead) => {
              const statusMeta = getStatusMeta(lead.status);
              const siteHref = normalizeUrl(lead.websiteUrl);
              const lprHref = normalizeUrl(lead.lprUrl);
              const nashDomHref = normalizeUrl(lead.nashDomUrl);

              return (
                <tr
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className="group cursor-pointer transition-colors duration-150 hover:bg-[#161D2C]"
                >
                  {/* ЖК & Застройщик */}
                  <td className="py-3.5 pl-5 pr-4 align-top">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLead(lead);
                      }}
                      className="text-left font-semibold text-[#F1F5F9] group-hover:text-[#60A5FA] transition-colors focus-visible:outline-none focus-visible:underline"
                    >
                      {lead.projectName}
                    </button>
                    <div className="mt-0.5 text-xs text-slate-400 truncate max-w-[230px]">
                      <span>{lead.developerName || 'Застройщик не указан'}</span>
                      {lead.city && (
                        <>
                          <span className="mx-1.5 text-slate-600" aria-hidden="true">·</span>
                          <span>{lead.city}</span>
                        </>
                      )}
                    </div>
                    {lead.estimatedBudget ? (
                      <div className="mt-1 font-mono text-[11px] tabular-nums text-slate-500">
                        {formatBudgetRub(lead.estimatedBudget)}
                      </div>
                    ) : null}
                  </td>

                  {/* Quick External Links */}
                  <td
                    className="py-3.5 px-4 align-top"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                      {siteHref ? (
                        <a
                          href={siteHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Открыть сайт ${lead.projectName}`}
                          className="inline-flex items-center gap-1 text-slate-300 hover:text-[#60A5FA] transition-colors whitespace-nowrap"
                        >
                          <Globe className="h-3.5 w-3.5 text-slate-500" />
                          <span>Сайт</span>
                          <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                        </a>
                      ) : (
                        <span className="text-slate-600 whitespace-nowrap">Нет сайта</span>
                      )}

                      {lprHref ? (
                        <a
                          href={lprHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Открыть контакт ЛПР для ${lead.projectName}`}
                          className="inline-flex items-center gap-1 text-slate-300 hover:text-[#60A5FA] transition-colors whitespace-nowrap"
                        >
                          <UserRound className="h-3.5 w-3.5 text-slate-500" />
                          <span>ЛПР</span>
                          <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                        </a>
                      ) : null}

                      {nashDomHref ? (
                        <a
                          href={nashDomHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Открыть наш.дом.рф для ${lead.projectName}`}
                          className="inline-flex items-center gap-1 text-slate-300 hover:text-[#60A5FA] transition-colors whitespace-nowrap"
                        >
                          <Landmark className="h-3.5 w-3.5 text-slate-500" />
                          <span>наш.дом.рф</span>
                          <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                        </a>
                      ) : null}
                    </div>
                  </td>

                  {/* ЛПР & Messenger */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="text-[13px] font-medium text-slate-200 truncate max-w-[185px]">
                      {lead.lprName || 'ЛПР не указан'}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-400 truncate max-w-[185px]">
                      <span>{getMessengerLabel(lead.messenger)}</span>
                      {lead.lprRole && (
                        <>
                          <span className="mx-1.5 text-slate-600" aria-hidden="true">·</span>
                          <span>{lead.lprRole}</span>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Stage Inline Selector — full untruncated width + crisp chevron */}
                  <td
                    className="py-3.5 px-4 align-top"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative w-full max-w-[178px]">
                      <select
                        aria-label={`Этап для ${lead.projectName}`}
                        value={lead.stage}
                        onChange={(e) => onChangeStage(lead.id, e.target.value as LeadStage)}
                        className="w-full appearance-none cursor-pointer rounded-md border border-white/[0.08] bg-[#0D111A] py-1.5 pl-2.5 pr-7 text-xs font-medium text-slate-200 transition-colors hover:border-[#3B82F6]/50 focus:border-[#3B82F6] focus:outline-none"
                      >
                        {LEAD_STAGES.map((stage) => (
                          <option key={stage.id} value={stage.id} className="bg-[#111622] text-slate-100">
                            {stage.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                    </div>
                  </td>

                  {/* Status (Clean Unboxed Typography) */}
                  <td className="py-3.5 px-4 align-top">
                    <div className={`text-xs font-semibold whitespace-nowrap ${statusMeta.tone}`}>
                      {statusMeta.label}
                    </div>
                    {lead.nextFollowUp && (
                      <div className="mt-1 font-mono text-[11px] tabular-nums text-slate-500 whitespace-nowrap">
                        {lead.nextFollowUp}
                      </div>
                    )}
                  </td>

                  {/* Comment */}
                  <td className="py-3.5 pl-4 pr-5 align-top">
                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-400">
                      {lead.comment || '—'}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
