import React, { useRef } from 'react';
import {
  Building2,
  CheckSquare,
  Download,
  Upload,
  X,
  Calendar,
  CalendarDays,
  CalendarRange,
  LayoutGrid,
} from 'lucide-react';
import type { ActiveSection, TaskViewTab } from '../types';

interface SidebarProps {
  activeSection: ActiveSection;
  onSelectSection: (section: ActiveSection) => void;
  taskTab: TaskViewTab;
  onSelectTaskTab: (tab: TaskViewTab) => void;
  leadsCount: number;
  activeTodayTasksCount: number;
  totalActiveTasksCount: number;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const TASK_SHORTCUTS: { id: TaskViewTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'day', label: 'На день', icon: Calendar },
  { id: 'week', label: 'На неделю', icon: CalendarDays },
  { id: 'month', label: 'На месяц', icon: CalendarRange },
  { id: 'all', label: 'Общий обзор', icon: LayoutGrid },
];

export function Sidebar({
  activeSection,
  onSelectSection,
  taskTab,
  onSelectTaskTab,
  leadsCount,
  activeTodayTasksCount,
  totalActiveTasksCount,
  onExportJson,
  onImportJson,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJson(file);
      e.target.value = '';
    }
  };

  const navContent = (
    <div className="flex h-full flex-col bg-[#0E121B] border-r border-white/[0.07]">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-5 border-b border-white/[0.07]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#3B82F6] text-white">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 13V4.5L6.5 2V13H2Z" fill="currentColor" fillOpacity="0.95" />
              <path d="M8.5 13V5.5L14 3V13H8.5Z" fill="currentColor" fillOpacity="0.55" />
            </svg>
          </div>
          <span className="text-[15px] font-bold tracking-tight text-[#F8FAFC] whitespace-nowrap">
            Монолит
          </span>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Закрыть меню"
          className="lg:hidden rounded-md p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Primary Navigation */}
      <nav aria-label="Основная навигация" className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              onSelectSection('crm');
              onCloseMobile();
            }}
            aria-current={activeSection === 'crm' ? 'page' : undefined}
            className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 active:scale-[0.99] whitespace-nowrap ${
              activeSection === 'crm'
                ? 'bg-[#3B82F6]/15 text-[#93C5FD]'
                : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Building2
                className={`h-4 w-4 shrink-0 ${
                  activeSection === 'crm' ? 'text-[#3B82F6]' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              <span>Клиенты и ЖК</span>
            </span>
            <span className="font-mono text-xs tabular-nums text-slate-400">
              {leadsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectSection('tasks');
              onCloseMobile();
            }}
            aria-current={activeSection === 'tasks' ? 'page' : undefined}
            className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 active:scale-[0.99] whitespace-nowrap ${
              activeSection === 'tasks'
                ? 'bg-[#3B82F6]/15 text-[#93C5FD]'
                : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <CheckSquare
                className={`h-4 w-4 shrink-0 ${
                  activeSection === 'tasks' ? 'text-[#3B82F6]' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              <span>Планировщик</span>
            </span>
            <span className="font-mono text-xs tabular-nums text-slate-400">
              {totalActiveTasksCount}
            </span>
          </button>
        </div>

        {/* Task Horizon Shortcuts */}
        <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
          <p className="px-3 text-xs font-medium text-slate-500">Горизонты задач</p>
          {TASK_SHORTCUTS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === 'tasks' && taskTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectSection('tasks');
                  onSelectTaskTab(item.id);
                  onCloseMobile();
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150 whitespace-nowrap ${
                  isActive
                    ? 'bg-white/[0.06] text-white'
                    : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-[#3B82F6]' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </span>
                {item.id === 'day' && activeTodayTasksCount > 0 && (
                  <span className="font-mono text-[11px] tabular-nums text-[#60A5FA]">
                    {activeTodayTasksCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer Data Controls */}
      <div className="border-t border-white/[0.07] px-3 py-3.5 space-y-1">
        <button
          type="button"
          onClick={onExportJson}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 transition-colors whitespace-nowrap"
        >
          <Download className="h-3.5 w-3.5 shrink-0" />
          <span>Экспорт базы (JSON)</span>
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 transition-colors whitespace-nowrap"
        >
          <Upload className="h-3.5 w-3.5 shrink-0" />
          <span>Импорт базы (JSON)</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Импортировать JSON-файл базы"
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 h-screen sticky top-0">
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/65 backdrop-blur-[2px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-64 max-w-[82vw] h-full shadow-2xl">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
