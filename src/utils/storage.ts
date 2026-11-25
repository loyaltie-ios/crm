import type { Lead, TaskItem } from '../types';
import { SEED_LEADS, SEED_TASKS } from '../data/seedData';

const LEADS_KEY = 'monolit_crm_leads_v1';
const TASKS_KEY = 'monolit_crm_tasks_v1';

export function loadLeads(): Lead[] {
  try {
    const raw = window.localStorage.getItem(LEADS_KEY);
    if (!raw) return SEED_LEADS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_LEADS;
  } catch {
    return SEED_LEADS;
  }
}

export function saveLeads(leads: Lead[]): void {
  try {
    window.localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
  } catch {
    // Ignore storage quota errors silently
  }
}

export function loadTasks(): TaskItem[] {
  try {
    const raw = window.localStorage.getItem(TASKS_KEY);
    if (!raw) return SEED_TASKS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_TASKS;
  } catch {
    return SEED_TASKS;
  }
}

export function saveTasks(tasks: TaskItem[]): void {
  try {
    window.localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch {
    // Ignore storage quota errors silently
  }
}
