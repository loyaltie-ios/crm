import React, { useEffect, useMemo, useState } from 'react';
import {
  Menu,
  Plus,
  Search,
  Table2,
  Columns3,
  X,
} from 'lucide-react';
import type {
  ActiveSection,
  CrmViewMode,
  Lead,
  LeadFormInput,
  LeadStage,
  LeadStatus,
  MessengerType,
  TaskFormInput,
  TaskHorizon,
  TaskItem,
  TaskViewTab,
} from './types';
import { loadLeads, loadTasks, saveLeads, saveTasks } from './utils/storage';
import {
  LEAD_STAGES,
  LEAD_STATUSES,
  MESSENGERS,
  computePipelineStats,
  filterLeads,
  formatBudgetRub,
  parseWorkspaceImport,
  serializeWorkspace,
} from './utils/crmLogic';
import { Sidebar } from './components/Sidebar';
import { LeadTable } from './components/LeadTable';
import { LeadKanban } from './components/LeadKanban';
import { LeadDrawer } from './components/LeadDrawer';
import { TaskManager } from './components/TaskManager';

export default function App() {
  const [leads, setLeads] = useState<Lead[]>(() => loadLeads());
  const [tasks, setTasks] = useState<TaskItem[]>(() => loadTasks());

  const [activeSection, setActiveSection] = useState<ActiveSection>('crm');
  const [crmView, setCrmView] = useState<CrmViewMode>('table');
  const [taskTab, setTaskTab] = useState<TaskViewTab>('day');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // CRM Filters
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<LeadStage | 'all'>('all');
  const [messengerFilter, setMessengerFilter] = useState<MessengerType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');

  // Lead Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Prefill link when jumping from Lead Drawer to Task Manager
  const [prefillTaskLeadId, setPrefillTaskLeadId] = useState<string | null>(null);

  // Subtle transient feedback toast
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    saveLeads(leads);
  }, [leads]);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => {
      setNotice((cur) => (cur === msg ? null : cur));
    }, 2600);
  };

  const filteredLeads = useMemo(
    () =>
      filterLeads(leads, {
        search,
        stage: stageFilter,
        messenger: messengerFilter,
        status: statusFilter,
      }),
    [leads, search, stageFilter, messengerFilter, statusFilter]
  );

  const stats = useMemo(() => computePipelineStats(leads), [leads]);
  const activeTodayTasksCount = useMemo(
    () => tasks.filter((t) => t.horizon === 'day' && !t.completed).length,
    [tasks]
  );
  const totalActiveTasksCount = useMemo(
    () => tasks.filter((t) => !t.completed).length,
    [tasks]
  );

  const hasActiveFilters =
    search.trim() !== '' ||
    stageFilter !== 'all' ||
    messengerFilter !== 'all' ||
    statusFilter !== 'all';

  const handleResetFilters = () => {
    setSearch('');
    setStageFilter('all');
    setMessengerFilter('all');
    setStatusFilter('all');
  };

  const handleOpenNewLead = () => {
    setEditingLead(null);
    setDrawerOpen(true);
  };

  const handleSelectLead = (lead: Lead) => {
    setEditingLead(lead);
    setDrawerOpen(true);
  };

  const handleSaveLead = (input: LeadFormInput, existingId?: string) => {
    const now = new Date().toISOString();
    if (existingId) {
      setLeads((prev) =>
        prev.map((item) =>
          item.id === existingId ? { ...item, ...input, updatedAt: now } : item
        )
      );
      showNotice(`Обновлен контакт «${input.projectName}»`);
    } else {
      const newLead: Lead = {
        ...input,
        id: `lead-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };
      setLeads((prev) => [newLead, ...prev]);
      showNotice(`Добавлен контакт «${input.projectName}»`);
    }
    setDrawerOpen(false);
    setEditingLead(null);
  };

  const handleDeleteLead = (id: string) => {
    const target = leads.find((l) => l.id === id);
    setLeads((prev) => prev.filter((item) => item.id !== id));
    setDrawerOpen(false);
    setEditingLead(null);
    if (target) showNotice(`Удален контакт «${target.projectName}»`);
  };

  const handleChangeStage = (leadId: string, stage: LeadStage) => {
    const now = new Date().toISOString();
    setLeads((prev) =>
      prev.map((item) => (item.id === leadId ? { ...item, stage, updatedAt: now } : item))
    );
  };

  const handleCreateTaskForLead = (lead: Lead) => {
    setDrawerOpen(false);
    setEditingLead(null);
    setPrefillTaskLeadId(lead.id);
    setActiveSection('tasks');
    setTaskTab('day');
  };

  // Task handlers
  const handleAddTask = (input: TaskFormInput) => {
    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: input.title,
      notes: input.notes ?? '',
      horizon: input.horizon,
      priority: input.priority,
      completed: false,
      linkedLeadId: input.linkedLeadId,
      dueLabel: input.dueLabel,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleMoveHorizon = (taskId: string, horizon: TaskHorizon) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, horizon } : t))
    );
  };

  const handleOpenLeadFromTask = (leadId: string) => {
    const found = leads.find((l) => l.id === leadId);
    if (!found) return;
    setActiveSection('crm');
    setEditingLead(found);
    setDrawerOpen(true);
  };

  // Backup Export / Import
  const handleExportJson = () => {
    const content = serializeWorkspace(leads, tasks);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monolit-crm-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice('Резервная копия базы сохранена');
  };

  const handleImportJson = async (file: File) => {
    try {
      const text = await file.text();
      const result = parseWorkspaceImport(text);
      if (!result.ok) {
        showNotice(result.error);
        return;
      }
      setLeads(result.leads);
      setTasks(result.tasks);
      showNotice(`Импортировано контактов: ${result.leads.length}, задач: ${result.tasks.length}`);
    } catch {
      showNotice('Ошибка чтения файла импорта');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#E6ECF5] flex">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        taskTab={taskTab}
        onSelectTaskTab={setTaskTab}
        leadsCount={leads.length}
        activeTodayTasksCount={activeTodayTasksCount}
        totalActiveTasksCount={totalActiveTasksCount}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar (Contextual Breadcrumb + 1 Primary Action) */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-white/[0.07] bg-[#0B0E14]/90 backdrop-blur-md px-5 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Открыть навигацию"
              className="lg:hidden rounded-lg p-2 text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-500 hidden sm:inline">Монолит</span>
              <span className="text-slate-600 hidden sm:inline" aria-hidden="true">/</span>
              <h1 className="text-[15px] font-semibold text-white truncate">
                {activeSection === 'crm' ? 'Клиенты и застройщики' : 'Планировщик задач'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {activeSection === 'crm' ? (
              <button
                type="button"
                onClick={handleOpenNewLead}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2563EB] transition-colors active:scale-[0.98] whitespace-nowrap shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Новый контакт</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setActiveSection('crm');
                  handleOpenNewLead();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-[#141A27] px-3.5 py-2 text-sm font-medium text-slate-200 hover:bg-[#1A2233] hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="h-4 w-4 text-[#3B82F6]" />
                <span>Новый ЖК</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-1 px-5 py-6 lg:px-8 lg:py-7 max-w-[1440px] w-full mx-auto">
          {activeSection === 'crm' ? (
            <div className="space-y-6">
              {/* Flat Hairline KPI Summary Strip (No nested cards, tabular numerals) */}
              <section
                aria-label="Сводка по воронке"
                className="grid grid-cols-2 lg:grid-cols-4 rounded-xl border border-white/[0.07] bg-[#111622] overflow-hidden"
              >
                <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-r border-white/[0.07] lg:border-b-0">
                  <p className="text-xs text-slate-400">Всего ЖК в базе</p>
                  <p className="mt-1.5 font-mono text-xl sm:text-2xl font-semibold tabular-nums text-white">
                    {stats.total}
                  </p>
                </div>
                <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-white/[0.07] lg:border-b-0 lg:border-r">
                  <p className="text-xs text-slate-400">Касание и диалог</p>
                  <p className="mt-1.5 font-mono text-xl sm:text-2xl font-semibold tabular-nums text-[#60A5FA]">
                    {stats.inDialogue}
                  </p>
                </div>
                <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-r border-white/[0.07]">
                  <p className="text-xs text-slate-400">КП и созвоны</p>
                  <p className="mt-1.5 font-mono text-xl sm:text-2xl font-semibold tabular-nums text-amber-400">
                    {stats.proposalsAndCalls}
                  </p>
                </div>
                <div className="px-4 py-3.5 sm:px-5 sm:py-4">
                  <p className="text-xs text-slate-400">Потенциал воронки</p>
                  <p className="mt-1.5 font-mono text-lg sm:text-2xl font-semibold tabular-nums text-emerald-400 whitespace-nowrap">
                    {formatBudgetRub(stats.pipelineBudget)}
                  </p>
                </div>
              </section>

              {/* Toolbar: Search + Filters + View Mode Switch */}
              <section
                aria-label="Фильтры и вид списка"
                className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"
              >
                <div className="flex flex-1 flex-wrap items-center gap-2.5">
                  {/* Live Search */}
                  <div className="relative flex-1 min-w-[230px] max-w-md">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Поиск по ЖК, застройщику, ЛПР или заметке..."
                      aria-label="Поиск по контактам"
                      className="w-full rounded-lg border border-white/[0.08] bg-[#111622] py-2 pl-10 pr-3.5 text-sm text-white placeholder:text-slate-500 focus:border-[#3B82F6] focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Stage Filter */}
                  <select
                    aria-label="Фильтр по этапу"
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value as LeadStage | 'all')}
                    className="rounded-lg border border-white/[0.08] bg-[#111622] px-3 py-2 text-sm text-slate-200 focus:border-[#3B82F6] focus:outline-none"
                  >
                    <option value="all" className="bg-[#111622]">Все этапы</option>
                    {LEAD_STAGES.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#111622]">
                        {s.label}
                      </option>
                    ))}
                  </select>

                  {/* Messenger Filter */}
                  <select
                    aria-label="Фильтр по мессенджеру"
                    value={messengerFilter}
                    onChange={(e) => setMessengerFilter(e.target.value as MessengerType | 'all')}
                    className="rounded-lg border border-white/[0.08] bg-[#111622] px-3 py-2 text-sm text-slate-200 focus:border-[#3B82F6] focus:outline-none"
                  >
                    <option value="all" className="bg-[#111622]">Все каналы</option>
                    {MESSENGERS.map((m) => (
                      <option key={m.id} value={m.id} className="bg-[#111622]">
                        {m.label}
                      </option>
                    ))}
                  </select>

                  {/* Status Filter */}
                  <select
                    aria-label="Фильтр по статусу"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
                    className="rounded-lg border border-white/[0.08] bg-[#111622] px-3 py-2 text-sm text-slate-200 focus:border-[#3B82F6] focus:outline-none"
                  >
                    <option value="all" className="bg-[#111622]">Все статусы</option>
                    {LEAD_STATUSES.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#111622]">
                        {s.label}
                      </option>
                    ))}
                  </select>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-400 hover:bg-white/[0.05] hover:text-white transition-colors whitespace-nowrap"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Сбросить</span>
                    </button>
                  )}
                </div>

                {/* View Mode Toggle */}
                <div
                  role="group"
                  aria-label="Вид отображения CRM"
                  className="inline-flex items-center gap-1 rounded-lg border border-white/[0.07] bg-[#111622] p-1 self-start xl:self-auto shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => setCrmView('table')}
                    aria-pressed={crmView === 'table'}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      crmView === 'table'
                        ? 'bg-[#3B82F6] text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Table2 className="h-3.5 w-3.5" />
                    <span>Таблица</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCrmView('kanban')}
                    aria-pressed={crmView === 'kanban'}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      crmView === 'kanban'
                        ? 'bg-[#3B82F6] text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Columns3 className="h-3.5 w-3.5" />
                    <span>Воронка</span>
                  </button>
                </div>
              </section>

              {/* Main CRM Data Area */}
              {crmView === 'table' ? (
                <LeadTable
                  leads={filteredLeads}
                  totalLeadsCount={leads.length}
                  onSelectLead={handleSelectLead}
                  onChangeStage={handleChangeStage}
                  onResetFilters={handleResetFilters}
                  onOpenNewLead={handleOpenNewLead}
                />
              ) : (
                <LeadKanban
                  leads={filteredLeads}
                  onSelectLead={handleSelectLead}
                  onChangeStage={handleChangeStage}
                />
              )}
            </div>
          ) : (
            <TaskManager
              tasks={tasks}
              leads={leads}
              activeTab={taskTab}
              onChangeTab={setTaskTab}
              onAddTask={handleAddTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onMoveHorizon={handleMoveHorizon}
              onOpenLeadFromTask={handleOpenLeadFromTask}
              prefillLeadId={prefillTaskLeadId}
              onClearPrefillLead={() => setPrefillTaskLeadId(null)}
            />
          )}
        </main>
      </div>

      {/* Lead Create / Edit Drawer */}
      <LeadDrawer
        isOpen={drawerOpen}
        lead={editingLead}
        onClose={() => {
          setDrawerOpen(false);
          setEditingLead(null);
        }}
        onSave={handleSaveLead}
        onDelete={handleDeleteLead}
        onCreateTaskForLead={handleCreateTaskForLead}
      />

      {/* Quiet Toast Feedback */}
      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 rounded-lg border border-[#3B82F6]/30 bg-[#141C2B] px-4 py-2.5 text-sm text-slate-100 shadow-xl"
        >
          {notice}
        </div>
      )}
    </div>
  );
}
