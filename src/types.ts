export type LeadStage =
  | 'research'
  | 'first_touch'
  | 'dialogue'
  | 'proposal'
  | 'call_scheduled'
  | 'contract'
  | 'rejected';

export type LeadStatus = 'hot' | 'warm' | 'cold' | 'paused' | 'won' | 'lost';

export type MessengerType = 'telegram' | 'whatsapp' | 'vk' | 'email' | 'phone';

export interface Lead {
  id: string;
  projectName: string; // Название ЖК
  developerName: string; // Застройщик / Девелопер
  city: string;
  websiteUrl: string; // Текущий сайт
  lprName: string; // Имя ЛПР
  lprRole: string; // Должность ЛПР
  lprUrl: string; // Ссылка на ЛПР (Telegram, WhatsApp, VK и т.д.)
  messenger: MessengerType;
  nashDomUrl: string; // Ссылка на наш.дом.рф
  stage: LeadStage;
  status: LeadStatus;
  comment: string;
  estimatedBudget?: number; // Оценка бюджета в рублях
  nextFollowUp: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export type LeadFormInput = Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>;

export type TaskHorizon = 'day' | 'week' | 'month';

export type TaskPriority = 'high' | 'medium' | 'low';

export interface TaskItem {
  id: string;
  title: string;
  notes: string;
  horizon: TaskHorizon;
  priority: TaskPriority;
  completed: boolean;
  linkedLeadId?: string;
  dueLabel?: string; // e.g., "14:00", "Чт", "До 30 ноя"
  createdAt: string;
}

export interface TaskFormInput {
  title: string;
  notes?: string;
  horizon: TaskHorizon;
  priority: TaskPriority;
  linkedLeadId?: string;
  dueLabel?: string;
}

export type ActiveSection = 'crm' | 'tasks';
export type CrmViewMode = 'table' | 'kanban';
export type TaskViewTab = 'day' | 'week' | 'month' | 'all';

export interface WorkspaceBackup {
  version: number;
  exportedAt: string;
  leads: Lead[];
  tasks: TaskItem[];
}
