import React, { useEffect, useState } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  ListPlus,
} from 'lucide-react';
import type {
  Lead,
  LeadFormInput,
  LeadStage,
  LeadStatus,
  MessengerType,
} from '../types';
import {
  LEAD_STAGES,
  LEAD_STATUSES,
  MESSENGERS,
  normalizeUrl,
  validateLeadInput,
} from '../utils/crmLogic';

interface LeadDrawerProps {
  isOpen: boolean;
  lead: Lead | null; // null = create mode
  onClose: () => void;
  onSave: (input: LeadFormInput, existingId?: string) => void;
  onDelete?: (id: string) => void;
  onCreateTaskForLead?: (lead: Lead) => void;
}

const EMPTY_FORM: LeadFormInput = {
  projectName: '',
  developerName: '',
  city: '',
  websiteUrl: '',
  lprName: '',
  lprRole: '',
  lprUrl: '',
  messenger: 'telegram',
  nashDomUrl: '',
  stage: 'research',
  status: 'warm',
  comment: '',
  estimatedBudget: undefined,
  nextFollowUp: '',
};

export function LeadDrawer({
  isOpen,
  lead,
  onClose,
  onSave,
  onDelete,
  onCreateTaskForLead,
}: LeadDrawerProps) {
  const [form, setForm] = useState<LeadFormInput>(EMPTY_FORM);
  const [budgetText, setBudgetText] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (lead) {
      setForm({
        projectName: lead.projectName,
        developerName: lead.developerName,
        city: lead.city,
        websiteUrl: lead.websiteUrl,
        lprName: lead.lprName,
        lprRole: lead.lprRole,
        lprUrl: lead.lprUrl,
        messenger: lead.messenger,
        nashDomUrl: lead.nashDomUrl,
        stage: lead.stage,
        status: lead.status,
        comment: lead.comment,
        estimatedBudget: lead.estimatedBudget,
        nextFollowUp: lead.nextFollowUp,
      });
      setBudgetText(lead.estimatedBudget ? String(lead.estimatedBudget) : '');
    } else {
      setForm(EMPTY_FORM);
      setBudgetText('');
    }
    setErrors({});
    setConfirmDelete(false);
    setCopiedField(null);
  }, [isOpen, lead]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const updateField = <K extends keyof LeadFormInput>(key: K, value: LeadFormInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleCopy = async (field: string, value: string) => {
    if (!value.trim()) return;
    try {
      await navigator.clipboard.writeText(value.trim());
      setCopiedField(field);
      setTimeout(() => setCopiedField((cur) => (cur === field ? null : cur)), 1600);
    } catch {
      // Clipboard might be restricted in non-HTTPS contexts
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericBudget = budgetText.trim()
      ? Number(budgetText.replace(/\s+/g, ''))
      : undefined;
    const candidate: LeadFormInput = {
      ...form,
      projectName: form.projectName.trim(),
      developerName: form.developerName.trim(),
      city: form.city.trim(),
      websiteUrl: form.websiteUrl.trim(),
      lprName: form.lprName.trim(),
      lprRole: form.lprRole.trim(),
      lprUrl: form.lprUrl.trim(),
      nashDomUrl: form.nashDomUrl.trim(),
      comment: form.comment.trim(),
      estimatedBudget: Number.isFinite(numericBudget) && numericBudget! > 0 ? numericBudget : undefined,
    };

    const validation = validateLeadInput(candidate);
    if (!validation.valid) {
      setErrors(validation.errors as Record<string, string>);
      return;
    }

    onSave(
      {
        ...candidate,
        websiteUrl: candidate.websiteUrl ? normalizeUrl(candidate.websiteUrl) : '',
        lprUrl: candidate.lprUrl ? normalizeUrl(candidate.lprUrl) : '',
        nashDomUrl: candidate.nashDomUrl ? normalizeUrl(candidate.nashDomUrl) : '',
      },
      lead?.id
    );
  };

  const renderLinkActions = (field: string, value: string) => {
    const href = normalizeUrl(value);
    if (!href) return null;
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => handleCopy(field, href)}
          aria-label={`Копировать ${field}`}
          className="rounded-md p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors"
        >
          {copiedField === field ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Открыть ${field} в новой вкладке`}
          className="rounded-md p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-[#60A5FA] transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-drawer-title"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full w-full max-w-xl flex-col border-l border-white/[0.08] bg-[#0F141F] shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <div>
            <h2 id="lead-drawer-title" className="text-base font-semibold text-white">
              {lead ? lead.projectName : 'Новый контакт ЖК'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {lead ? 'Карточка застройщика и история касаний' : 'Заполните данные объекта и ЛПР'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть карточку контакта"
            className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form id="lead-drawer-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Quick action bar for existing lead */}
          {lead && onCreateTaskForLead && (
            <div className="flex items-center justify-between rounded-lg border border-[#3B82F6]/25 bg-[#3B82F6]/[0.08] px-4 py-2.5">
              <span className="text-xs text-slate-300">
                Запланировать следующий шаг по этому ЖК?
              </span>
              <button
                type="button"
                onClick={() => onCreateTaskForLead(lead)}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#3B82F6] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2563EB] transition-colors active:scale-[0.98] whitespace-nowrap"
              >
                <ListPlus className="h-3.5 w-3.5" />
                <span>Создать задачу</span>
              </button>
            </div>
          )}

          {/* Object Info */}
          <div className="space-y-3.5">
            <div>
              <label htmlFor="lead-project-name" className="block text-xs font-medium text-slate-300 mb-1.5">
                Название ЖК *
              </label>
              <input
                id="lead-project-name"
                type="text"
                value={form.projectName}
                onChange={(e) => updateField('projectName', e.target.value)}
                placeholder="Например: ЖК Речной Квартал"
                className={`w-full rounded-lg border bg-[#141B29] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none transition-colors ${
                  errors.projectName
                    ? 'border-rose-500/70 focus:border-rose-400'
                    : 'border-white/[0.08] focus:border-[#3B82F6]'
                }`}
              />
              {errors.projectName && (
                <p className="mt-1 text-xs text-rose-400">{errors.projectName}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="lead-developer" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Застройщик / Девелопер
                </label>
                <input
                  id="lead-developer"
                  type="text"
                  value={form.developerName}
                  onChange={(e) => updateField('developerName', e.target.value)}
                  placeholder="ГК Основа Строй"
                  className="w-full rounded-lg border border-white/[0.08] bg-[#141B29] px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[#3B82F6] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="lead-city" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Город
                </label>
                <input
                  id="lead-city"
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="Москва"
                  className="w-full rounded-lg border border-white/[0.08] bg-[#141B29] px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[#3B82F6] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Links Section */}
          <div className="space-y-3.5 pt-4 border-t border-white/[0.06]">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="lead-website" className="text-xs font-medium text-slate-300">
                  Текущий сайт ЖК / застройщика
                </label>
                {renderLinkActions('сайт', form.websiteUrl)}
              </div>
              <input
                id="lead-website"
                type="text"
                value={form.websiteUrl}
                onChange={(e) => updateField('websiteUrl', e.target.value)}
                placeholder="https://example-jk.ru"
                className={`w-full rounded-lg border bg-[#141B29] px-3.5 py-2 text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none ${
                  errors.websiteUrl
                    ? 'border-rose-500/70'
                    : 'border-white/[0.08] focus:border-[#3B82F6]'
                }`}
              />
              {errors.websiteUrl && (
                <p className="mt-1 text-xs text-rose-400">{errors.websiteUrl}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="lead-nashdom" className="text-xs font-medium text-slate-300">
                  Ссылка на наш.дом.рф
                </label>
                {renderLinkActions('наш.дом.рф', form.nashDomUrl)}
              </div>
              <input
                id="lead-nashdom"
                type="text"
                value={form.nashDomUrl}
                onChange={(e) => updateField('nashDomUrl', e.target.value)}
                placeholder="https://наш.дом.рф/сервисы/каталог-новостроек/объект/..."
                className={`w-full rounded-lg border bg-[#141B29] px-3.5 py-2 text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none ${
                  errors.nashDomUrl
                    ? 'border-rose-500/70'
                    : 'border-white/[0.08] focus:border-[#3B82F6]'
                }`}
              />
              {errors.nashDomUrl && (
                <p className="mt-1 text-xs text-rose-400">{errors.nashDomUrl}</p>
              )}
            </div>
          </div>

          {/* LPR & Messenger Section */}
          <div className="space-y-3.5 pt-4 border-t border-white/[0.06]">
            <div>
              <span className="block text-xs font-medium text-slate-300 mb-2">
                Канал связи (мессенджер)
              </span>
              <div className="grid grid-cols-5 gap-1 rounded-lg bg-[#141B29] p-1 border border-white/[0.07]">
                {MESSENGERS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => updateField('messenger', m.id as MessengerType)}
                    className={`rounded-md py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      form.messenger === m.id
                        ? 'bg-[#3B82F6] text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="lead-lpr-name" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Имя ЛПР
                </label>
                <input
                  id="lead-lpr-name"
                  type="text"
                  value={form.lprName}
                  onChange={(e) => updateField('lprName', e.target.value)}
                  placeholder="Алексей Морозов"
                  className="w-full rounded-lg border border-white/[0.08] bg-[#141B29] px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[#3B82F6] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="lead-lpr-role" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Должность ЛПР
                </label>
                <input
                  id="lead-lpr-role"
                  type="text"
                  value={form.lprRole}
                  onChange={(e) => updateField('lprRole', e.target.value)}
                  placeholder="Руководитель маркетинга"
                  className="w-full rounded-lg border border-white/[0.08] bg-[#141B29] px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[#3B82F6] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="lead-lpr-url" className="text-xs font-medium text-slate-300">
                  Ссылка на ЛПР (Telegram, WhatsApp, VK или @username)
                </label>
                {renderLinkActions('контакт ЛПР', form.lprUrl)}
              </div>
              <input
                id="lead-lpr-url"
                type="text"
                value={form.lprUrl}
                onChange={(e) => updateField('lprUrl', e.target.value)}
                placeholder="https://t.me/username или @username"
                className={`w-full rounded-lg border bg-[#141B29] px-3.5 py-2 text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none ${
                  errors.lprUrl
                    ? 'border-rose-500/70'
                    : 'border-white/[0.08] focus:border-[#3B82F6]'
                }`}
              />
              {errors.lprUrl && (
                <p className="mt-1 text-xs text-rose-400">{errors.lprUrl}</p>
              )}
            </div>
          </div>

          {/* Pipeline Stage, Status, Budget, Follow-up */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4 border-t border-white/[0.06]">
            <div>
              <label htmlFor="lead-stage" className="block text-xs font-medium text-slate-300 mb-1.5">
                Этап воронки
              </label>
              <select
                id="lead-stage"
                value={form.stage}
                onChange={(e) => updateField('stage', e.target.value as LeadStage)}
                className="w-full rounded-lg border border-white/[0.08] bg-[#141B29] px-3 py-2 text-sm text-white focus:border-[#3B82F6] focus:outline-none"
              >
                {LEAD_STAGES.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#111622]">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="lead-status" className="block text-xs font-medium text-slate-300 mb-1.5">
                Статус контакта
              </label>
              <select
                id="lead-status"
                value={form.status}
                onChange={(e) => updateField('status', e.target.value as LeadStatus)}
                className="w-full rounded-lg border border-white/[0.08] bg-[#141B29] px-3 py-2 text-sm text-white focus:border-[#3B82F6] focus:outline-none"
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#111622]">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="lead-budget" className="block text-xs font-medium text-slate-300 mb-1.5">
                Оценка бюджета (₽)
              </label>
              <input
                id="lead-budget"
                type="text"
                inputMode="numeric"
                value={budgetText}
                onChange={(e) => setBudgetText(e.target.value.replace(/[^\d\s]/g, ''))}
                placeholder="750000"
                className="w-full rounded-lg border border-white/[0.08] bg-[#141B29] px-3.5 py-2 text-sm font-mono tabular-nums text-white placeholder:text-slate-500 focus:border-[#3B82F6] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="lead-followup" className="block text-xs font-medium text-slate-300 mb-1.5">
                Следующее касание
              </label>
              <input
                id="lead-followup"
                type="date"
                value={form.nextFollowUp}
                onChange={(e) => updateField('nextFollowUp', e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-[#141B29] px-3.5 py-2 text-sm font-mono tabular-nums text-white focus:border-[#3B82F6] focus:outline-none"
              />
            </div>
          </div>

          {/* Comment */}
          <div className="pt-4 border-t border-white/[0.06]">
            <label htmlFor="lead-comment" className="block text-xs font-medium text-slate-300 mb-1.5">
              Комментарий и заметки по переписке
            </label>
            <textarea
              id="lead-comment"
              rows={4}
              value={form.comment}
              onChange={(e) => updateField('comment', e.target.value)}
              placeholder="Что не так с текущим сайтом, о чем договорились в мессенджере, когда написать повторно..."
              className="w-full rounded-lg border border-white/[0.08] bg-[#141B29] px-3.5 py-2.5 text-sm leading-relaxed text-white placeholder:text-slate-500 focus:border-[#3B82F6] focus:outline-none resize-y"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-white/[0.07] bg-[#0C1019]">
          <div>
            {lead && onDelete && (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onDelete(lead.id)}
                    className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-medium text-white hover:bg-rose-500 transition-colors"
                  >
                    Удалить точно
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-lg px-2.5 py-2 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Удалить</span>
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/[0.09] px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/[0.05] hover:text-white transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              form="lead-drawer-form"
              className="rounded-lg bg-[#3B82F6] px-5 py-2 text-sm font-semibold text-white hover:bg-[#2563EB] transition-colors active:scale-[0.98]"
            >
              {lead ? 'Сохранить изменения' : 'Добавить контакт'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
