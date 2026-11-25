import React, { useEffect, useState } from 'react';
import {
  Check,
  Plus,
  Trash2,
  Building2,
  Clock,
  ArrowRightLeft,
} from 'lucide-react';
import type {
  Lead,
  TaskFormInput,
  TaskHorizon,
  TaskItem,
  TaskPriority,
  TaskViewTab,
} from '../types';
import {
  TASK_HORIZONS,
  TASK_PRIORITIES,
  computeTaskProgress,
  filterAndSortTasks,
  getPriorityMeta,
  validateTaskInput,
} from '../utils/crmLogic';

interface TaskManagerProps {
  tasks: TaskItem[];
  leads: Lead[];
  activeTab: TaskViewTab;
  onChangeTab: (tab: TaskViewTab) => void;
  onAddTask: (input: TaskFormInput) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveHorizon: (taskId: string, horizon: TaskHorizon) => void;
  onOpenLeadFromTask: (leadId: string) => void;
  prefillLeadId?: string | null;
  onClearPrefillLead?: () => void;
}

const TABS: { id: TaskViewTab; label: string }[] = [
  { id: 'day', label: 'День' },
  { id: 'week', label: 'Неделя' },
  { id: 'month', label: 'Месяц' },
  { id: 'all', label: 'Обзор (все)' },
];

export function TaskManager({
  tasks,
  leads,
  activeTab,
  onChangeTab,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onMoveHorizon,
  onOpenLeadFromTask,
  prefillLeadId,
  onClearPrefillLead,
}: TaskManagerProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [horizon, setHorizon] = useState<TaskHorizon>(
    activeTab === 'all' ? 'day' : activeTab
  );
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [linkedLeadId, setLinkedLeadId] = useState<string>('');
  const [dueLabel, setDueLabel] = useState('');
  const [completionFilter, setCompletionFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [error, setError] = useState<string | null>(null);
  const [showNotesInput, setShowNotesInput] = useState(false);

  useEffect(() => {
    if (activeTab !== 'all') {
      setHorizon(activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (prefillLeadId) {
      setLinkedLeadId(prefillLeadId);
      const found = leads.find((l) => l.id === prefillLeadId);
      if (found && !title) {
        setTitle(`Связаться по ${found.projectName}: `);
      }
      onClearPrefillLead?.();
    }
  }, [prefillLeadId, leads, title, onClearPrefillLead]);

  const leadMap = new Map(leads.map((l) => [l.id, l]));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateTaskInput({
      title,
      notes,
      horizon,
      priority,
      linkedLeadId: linkedLeadId || undefined,
      dueLabel: dueLabel.trim() || undefined,
    });
    if (!validation.valid) {
      setError(validation.error ?? 'Введите задачу');
      return;
    }

    onAddTask({
      title: title.trim(),
      notes: notes.trim(),
      horizon,
      priority,
      linkedLeadId: linkedLeadId || undefined,
      dueLabel: dueLabel.trim() || undefined,
    });
    setTitle('');
    setNotes('');
    setDueLabel('');
    setLinkedLeadId('');
    setError(null);
    setShowNotesInput(false);
  };

  const currentProgress = computeTaskProgress(tasks, activeTab);

  const renderTaskRow = (task: TaskItem, compact = false) => {
    const priorityMeta = getPriorityMeta(task.priority);
    const linkedLead = task.linkedLeadId ? leadMap.get(task.linkedLeadId) : undefined;

    return (
      <div
        key={task.id}
        className={`group flex items-start gap-3.5 transition-all duration-150 ${
          compact
            ? `py-3 first:pt-1 last:pb-1 ${task.completed ? 'opacity-60' : ''}`
            : `rounded-xl border px-4 py-3.5 ${
                task.completed
                  ? 'border-white/[0.04] bg-[#0F131D]/70 opacity-65'
                  : 'border-white/[0.07] bg-[#121723] hover:border-[#3B82F6]/35'
              }`
        }`}
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={task.completed}
          aria-label={
            task.completed
              ? `Снять отметку выполнения с задачи «${task.title}»`
              : `Отметить задачу «${task.title}» выполненной`
          }
          onClick={() => onToggleTask(task.id)}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-150 active:scale-90 ${
            task.completed
              ? 'border-[#3B82F6] bg-[#3B82F6] text-white'
              : 'border-slate-600 bg-[#0B0E14] hover:border-[#3B82F6]'
          }`}
        >
          {task.completed && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p
              className={`text-sm font-medium leading-snug ${
                task.completed ? 'line-through text-slate-500' : 'text-[#F1F5F9]'
              }`}
            >
              {task.title}
            </p>
            <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
              {!compact && (
                <div className="relative flex items-center">
                  <ArrowRightLeft className="h-3 w-3 text-slate-500 mr-1 pointer-events-none" />
                  <select
                    aria-label={`Перенести задачу «${task.title}» на другой период`}
                    value={task.horizon}
                    onChange={(e) => onMoveHorizon(task.id, e.target.value as TaskHorizon)}
                    className="cursor-pointer rounded bg-transparent py-0.5 text-xs text-slate-400 hover:text-white focus:outline-none"
                  >
                    {TASK_HORIZONS.map((h) => (
                      <option key={h.id} value={h.id} className="bg-[#111622] text-slate-100">
                        {h.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button
                type="button"
                onClick={() => onDeleteTask(task.id)}
                aria-label={`Удалить задачу «${task.title}»`}
                className="rounded-md p-1 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {task.notes && (
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              {task.notes}
            </p>
          )}

          {/* Clean Unboxed Metadata Line */}
          <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
            <span className={`font-medium ${priorityMeta.tone}`}>{priorityMeta.label}</span>

            {task.dueLabel && (
              <>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 font-mono text-[11px] tabular-nums text-slate-400">
                  <Clock className="h-3 w-3 text-slate-500" />
                  {task.dueLabel}
                </span>
              </>
            )}

            {linkedLead && (
              <>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => onOpenLeadFromTask(linkedLead.id)}
                  className="inline-flex items-center gap-1 text-[#60A5FA] hover:text-[#93C5FD] transition-colors"
                >
                  <Building2 className="h-3 w-3" />
                  <span>{linkedLead.projectName}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Horizon Tabs + Progress Summary */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div
          role="tablist"
          aria-label="Период планирования"
          className="inline-flex items-center gap-1 rounded-lg border border-white/[0.07] bg-[#111622] p-1 self-start"
        >
          {TABS.map((tab) => {
            const count =
              tab.id === 'all'
                ? tasks.filter((t) => !t.completed).length
                : tasks.filter((t) => t.horizon === tab.id && !t.completed).length;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#3B82F6] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`font-mono text-xs tabular-nums ${
                    activeTab === tab.id ? 'text-blue-100' : 'text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Completion Progress Bar */}
        <div className="flex items-center gap-4 min-w-[260px]">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400">Прогресс выполнения</span>
              <span className="font-mono tabular-nums text-slate-200">
                {currentProgress.completed} / {currentProgress.total} · {currentProgress.percent}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full bg-[#3B82F6] transition-all duration-300 ease-out"
                style={{ width: `${currentProgress.percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick-Add Task Composer */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-white/[0.08] bg-[#111622] p-4 space-y-3"
      >
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="flex-1">
            <label htmlFor="new-task-title" className="sr-only">
              Новая задача
            </label>
            <input
              id="new-task-title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Добавить задачу в план (например: отправить аудит 5 застройщикам)..."
              className={`w-full rounded-lg border bg-[#0B0E14] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none transition-colors ${
                error ? 'border-rose-500/70' : 'border-white/[0.08] focus:border-[#3B82F6]'
              }`}
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#3B82F6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2563EB] transition-colors active:scale-[0.98] whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Добавить</span>
          </button>
        </div>

        {error && <p className="text-xs text-rose-400">{error}</p>}

        {/* Secondary Options Row */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <select
            aria-label="Горизонт новой задачи"
            value={horizon}
            onChange={(e) => setHorizon(e.target.value as TaskHorizon)}
            className="rounded-md border border-white/[0.08] bg-[#0B0E14] px-2.5 py-1.5 text-slate-200 focus:border-[#3B82F6] focus:outline-none"
          >
            {TASK_HORIZONS.map((h) => (
              <option key={h.id} value={h.id} className="bg-[#111622]">
                План: {h.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Приоритет новой задачи"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="rounded-md border border-white/[0.08] bg-[#0B0E14] px-2.5 py-1.5 text-slate-200 focus:border-[#3B82F6] focus:outline-none"
          >
            {TASK_PRIORITIES.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#111622]">
                Приоритет: {p.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Привязать ЖК из CRM"
            value={linkedLeadId}
            onChange={(e) => setLinkedLeadId(e.target.value)}
            className="max-w-[210px] rounded-md border border-white/[0.08] bg-[#0B0E14] px-2.5 py-1.5 text-slate-200 focus:border-[#3B82F6] focus:outline-none"
          >
            <option value="" className="bg-[#111622]">
              Без привязки к ЖК
            </option>
            {leads.map((l) => (
              <option key={l.id} value={l.id} className="bg-[#111622]">
                {l.projectName}
              </option>
            ))}
          </select>

          <input
            type="text"
            aria-label="Срок или время задачи"
            value={dueLabel}
            onChange={(e) => setDueLabel(e.target.value)}
            placeholder="Срок (15:00 или Пт)"
            className="w-44 rounded-md border border-white/[0.08] bg-[#0B0E14] px-2.5 py-1.5 text-slate-200 placeholder:text-slate-500 focus:border-[#3B82F6] focus:outline-none"
          />

          <button
            type="button"
            onClick={() => setShowNotesInput((v) => !v)}
            className="ml-auto text-slate-400 hover:text-[#60A5FA] transition-colors whitespace-nowrap"
          >
            {showNotesInput ? 'Скрыть заметку' : '+ Добавить заметку'}
          </button>
        </div>

        {showNotesInput && (
          <input
            type="text"
            aria-label="Заметка к задаче"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Дополнительный контекст или чеклист..."
            className="w-full rounded-lg border border-white/[0.08] bg-[#0B0E14] px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-[#3B82F6] focus:outline-none"
          />
        )}
      </form>

      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {activeTab === 'all'
            ? 'Все три горизонта планирования рядом'
            : TASK_HORIZONS.find((h) => h.id === activeTab)?.description}
        </p>

        <div className="inline-flex items-center gap-1 rounded-lg border border-white/[0.06] bg-[#111622] p-0.5 text-xs">
          {(
            [
              { id: 'all', label: 'Все' },
              { id: 'active', label: 'В работе' },
              { id: 'completed', label: 'Готово' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setCompletionFilter(f.id)}
              className={`rounded-md px-2.5 py-1 font-medium transition-colors whitespace-nowrap ${
                completionFilter === f.id
                  ? 'bg-white/[0.09] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task List or 3-Column Overview */}
      {activeTab === 'all' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {TASK_HORIZONS.map((h) => {
            const list = filterAndSortTasks(tasks, h.id, completionFilter);
            const prog = computeTaskProgress(tasks, h.id);
            return (
              <section
                key={h.id}
                aria-label={`План на ${h.label}`}
                className="rounded-xl border border-white/[0.07] bg-[#0F141F] p-4 space-y-3"
              >
                <div className="flex items-baseline justify-between pb-2.5 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{h.label}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{h.description}</p>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-[#60A5FA]">
                    {prog.completed}/{prog.total}
                  </span>
                </div>

                {list.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-500">
                    Задач нет
                  </p>
                ) : (
                  <div className="divide-y divide-white/[0.06]">
                    {list.map((t) => renderTaskRow(t, true))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2.5" data-testid="task-list">
          {(() => {
            const list = filterAndSortTasks(tasks, activeTab, completionFilter);
            if (list.length === 0) {
              return (
                <div className="rounded-xl border border-white/[0.07] bg-[#111622] px-6 py-14 text-center">
                  <p className="text-sm font-semibold text-white">
                    На этот период задач пока нет
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Добавьте первую задачу в поле выше, чтобы зафиксировать фокус.
                  </p>
                </div>
              );
            }
            return list.map((t) => renderTaskRow(t, false));
          })()}
        </div>
      )}
    </div>
  );
}
