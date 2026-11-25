import type {
  Lead,
  LeadFormInput,
  LeadStage,
  LeadStatus,
  MessengerType,
  TaskFormInput,
  TaskHorizon,
  TaskItem,
  TaskPriority,
  WorkspaceBackup,
} from '../types';

export const LEAD_STAGES: { id: LeadStage; label: string; shortLabel: string }[] = [
  { id: 'research', label: 'Поиск и разбор', shortLabel: 'Поиск' },
  { id: 'first_touch', label: 'Первое касание', shortLabel: '1-е касание' },
  { id: 'dialogue', label: 'В диалоге', shortLabel: 'Диалог' },
  { id: 'proposal', label: 'Аудит / КП', shortLabel: 'КП' },
  { id: 'call_scheduled', label: 'Созвон / Встреча', shortLabel: 'Созвон' },
  { id: 'contract', label: 'Договор', shortLabel: 'Договор' },
  { id: 'rejected', label: 'Отказ / Архив', shortLabel: 'Отказ' },
];

export const LEAD_STATUSES: { id: LeadStatus; label: string; tone: string }[] = [
  { id: 'hot', label: 'Горячий', tone: 'text-amber-400' },
  { id: 'warm', label: 'Теплый', tone: 'text-blue-400' },
  { id: 'cold', label: 'Холодный', tone: 'text-slate-400' },
  { id: 'paused', label: 'На паузе', tone: 'text-slate-500' },
  { id: 'won', label: 'Сделка', tone: 'text-emerald-400' },
  { id: 'lost', label: 'Закрыт', tone: 'text-rose-400' },
];

export const MESSENGERS: { id: MessengerType; label: string }[] = [
  { id: 'telegram', label: 'Telegram' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'vk', label: 'VK' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Телефон' },
];

export const TASK_HORIZONS: { id: TaskHorizon; label: string; description: string }[] = [
  { id: 'day', label: 'День', description: 'Фокус на сегодня' },
  { id: 'week', label: 'Неделя', description: 'Ключевые шаги недели' },
  { id: 'month', label: 'Месяц', description: 'Стратегические цели месяца' },
];

export const TASK_PRIORITIES: { id: TaskPriority; label: string; tone: string }[] = [
  { id: 'high', label: 'Высокий', tone: 'text-rose-400' },
  { id: 'medium', label: 'Средний', tone: 'text-blue-400' },
  { id: 'low', label: 'Низкий', tone: 'text-slate-400' },
];

export function getStageLabel(stage: LeadStage): string {
  return LEAD_STAGES.find((s) => s.id === stage)?.label ?? stage;
}

export function getStatusMeta(status: LeadStatus) {
  return LEAD_STATUSES.find((s) => s.id === status) ?? LEAD_STATUSES[2];
}

export function getMessengerLabel(messenger: MessengerType): string {
  return MESSENGERS.find((m) => m.id === messenger)?.label ?? messenger;
}

export function getPriorityMeta(priority: TaskPriority) {
  return TASK_PRIORITIES.find((p) => p.id === priority) ?? TASK_PRIORITIES[1];
}

export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('@')) {
    return `https://t.me/${trimmed.slice(1)}`;
  }
  return `https://${trimmed}`;
}

export function formatDomain(raw: string): string {
  const normalized = normalizeUrl(raw);
  if (!normalized) return '';
  try {
    const parsed = new URL(normalized);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return raw.trim();
  }
}

export function formatBudgetRub(amount?: number): string {
  if (!amount || amount <= 0) return '—';
  return `${new Intl.NumberFormat('ru-RU').format(amount)} ₽`;
}

export interface LeadValidationResult {
  valid: boolean;
  errors: Partial<Record<'projectName' | 'websiteUrl' | 'lprUrl' | 'nashDomUrl', string>>;
}

function isLikelyUrlOrHandle(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('@') && trimmed.length > 2) return true;
  try {
    const u = new URL(normalizeUrl(trimmed));
    return u.hostname.includes('.');
  } catch {
    return false;
  }
}

export function validateLeadInput(input: LeadFormInput): LeadValidationResult {
  const errors: LeadValidationResult['errors'] = {};

  if (!input.projectName.trim()) {
    errors.projectName = 'Укажите название ЖК';
  }
  if (input.websiteUrl.trim() && !isLikelyUrlOrHandle(input.websiteUrl)) {
    errors.websiteUrl = 'Некорректная ссылка на сайт';
  }
  if (input.lprUrl.trim() && !isLikelyUrlOrHandle(input.lprUrl)) {
    errors.lprUrl = 'Укажите ссылку или @username ЛПР';
  }
  if (input.nashDomUrl.trim() && !isLikelyUrlOrHandle(input.nashDomUrl)) {
    errors.nashDomUrl = 'Некорректная ссылка на наш.дом.рф';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface LeadFilterOptions {
  search: string;
  stage: LeadStage | 'all';
  messenger: MessengerType | 'all';
  status: LeadStatus | 'all';
}

export function filterLeads(leads: Lead[], filters: LeadFilterOptions): Lead[] {
  const q = filters.search.trim().toLowerCase();

  return leads.filter((lead) => {
    if (filters.stage !== 'all' && lead.stage !== filters.stage) return false;
    if (filters.messenger !== 'all' && lead.messenger !== filters.messenger) return false;
    if (filters.status !== 'all' && lead.status !== filters.status) return false;

    if (!q) return true;

    const haystack = [
      lead.projectName,
      lead.developerName,
      lead.city,
      lead.lprName,
      lead.lprRole,
      lead.comment,
      lead.websiteUrl,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(q);
  });
}

export interface PipelineStats {
  total: number;
  inDialogue: number;
  proposalsAndCalls: number;
  contracts: number;
  pipelineBudget: number;
}

export function computePipelineStats(leads: Lead[]): PipelineStats {
  let inDialogue = 0;
  let proposalsAndCalls = 0;
  let contracts = 0;
  let pipelineBudget = 0;

  for (const lead of leads) {
    if (lead.stage === 'first_touch' || lead.stage === 'dialogue') {
      inDialogue += 1;
    }
    if (lead.stage === 'proposal' || lead.stage === 'call_scheduled') {
      proposalsAndCalls += 1;
    }
    if (lead.stage === 'contract' || lead.status === 'won') {
      contracts += 1;
    }
    if (lead.stage !== 'rejected' && lead.status !== 'lost' && lead.estimatedBudget) {
      pipelineBudget += lead.estimatedBudget;
    }
  }

  return {
    total: leads.length,
    inDialogue,
    proposalsAndCalls,
    contracts,
    pipelineBudget,
  };
}

export function groupLeadsByStage(leads: Lead[]): Record<LeadStage, Lead[]> {
  const grouped: Record<LeadStage, Lead[]> = {
    research: [],
    first_touch: [],
    dialogue: [],
    proposal: [],
    call_scheduled: [],
    contract: [],
    rejected: [],
  };

  for (const lead of leads) {
    grouped[lead.stage].push(lead);
  }

  return grouped;
}

export function getNextStage(stage: LeadStage): LeadStage | null {
  const order: LeadStage[] = [
    'research',
    'first_touch',
    'dialogue',
    'proposal',
    'call_scheduled',
    'contract',
  ];
  const idx = order.indexOf(stage);
  if (idx === -1 || idx >= order.length - 1) return null;
  return order[idx + 1];
}

export interface TaskValidationResult {
  valid: boolean;
  error?: string;
}

export function validateTaskInput(input: TaskFormInput): TaskValidationResult {
  if (!input.title.trim()) {
    return { valid: false, error: 'Введите текст задачи' };
  }
  return { valid: true };
}

const PRIORITY_RANK: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function filterAndSortTasks(
  tasks: TaskItem[],
  horizon: TaskHorizon | 'all',
  completionFilter: 'all' | 'active' | 'completed'
): TaskItem[] {
  return tasks
    .filter((task) => {
      if (horizon !== 'all' && task.horizon !== horizon) return false;
      if (completionFilter === 'active' && task.completed) return false;
      if (completionFilter === 'completed' && !task.completed) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const pDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (pDiff !== 0) return pDiff;
      return b.createdAt.localeCompare(a.createdAt);
    });
}

export interface TaskProgress {
  completed: number;
  total: number;
  percent: number;
}

export function computeTaskProgress(
  tasks: TaskItem[],
  horizon: TaskHorizon | 'all'
): TaskProgress {
  const scoped = horizon === 'all' ? tasks : tasks.filter((t) => t.horizon === horizon);
  const total = scoped.length;
  const completed = scoped.filter((t) => t.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent };
}

export function serializeWorkspace(leads: Lead[], tasks: TaskItem[]): string {
  const payload: WorkspaceBackup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    leads,
    tasks,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseWorkspaceImport(
  rawJson: string
): { ok: true; leads: Lead[]; tasks: TaskItem[] } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(rawJson) as Partial<WorkspaceBackup>;
    if (!parsed || !Array.isArray(parsed.leads) || !Array.isArray(parsed.tasks)) {
      return { ok: false, error: 'Неверная структура файла: ожидаются списки leads и tasks.' };
    }
    const validLeads = parsed.leads.every(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.projectName === 'string' &&
        typeof item.stage === 'string'
    );
    const validTasks = parsed.tasks.every(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.horizon === 'string'
    );
    if (!validLeads || !validTasks) {
      return { ok: false, error: 'Некоторые записи в файле повреждены или неполные.' };
    }
    return { ok: true, leads: parsed.leads, tasks: parsed.tasks };
  } catch {
    return { ok: false, error: 'Не удалось прочитать JSON-файл.' };
  }
}
