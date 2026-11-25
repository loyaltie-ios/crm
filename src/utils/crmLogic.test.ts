import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computePipelineStats,
  computeTaskProgress,
  filterAndSortTasks,
  filterLeads,
  getNextStage,
  groupLeadsByStage,
  normalizeUrl,
  parseWorkspaceImport,
  serializeWorkspace,
  validateLeadInput,
  validateTaskInput,
} from './crmLogic';
import type { Lead, TaskItem } from '../types';

const sampleLeads: Lead[] = [
  {
    id: 'l-1',
    projectName: 'ЖК Речной Квартал',
    developerName: 'ГК Основа Строй',
    city: 'Москва',
    websiteUrl: 'https://rechnoy-kvartal.ru',
    lprName: 'Алексей Морозов',
    lprRole: 'Руководитель маркетинга',
    lprUrl: 'https://t.me/amorozov_dev',
    messenger: 'telegram',
    nashDomUrl: 'https://наш.дом.рф/сервисы/каталог-новостроек/объект/54210',
    stage: 'dialogue',
    status: 'hot',
    comment: 'Просят аудит текущего сайта и оценку по срокам.',
    estimatedBudget: 650000,
    nextFollowUp: '2026-11-25',
    createdAt: '2026-11-20T10:00:00Z',
    updatedAt: '2026-11-24T09:00:00Z',
  },
  {
    id: 'l-2',
    projectName: 'ЖК Северный Берег',
    developerName: 'Девелопмент Нева',
    city: 'Санкт-Петербург',
    websiteUrl: 'https://severny-bereg.spb.ru',
    lprName: 'Елена Соколова',
    lprRole: 'Коммерческий директор',
    lprUrl: 'https://wa.me/79215550192',
    messenger: 'whatsapp',
    nashDomUrl: 'https://наш.дом.рф/сервисы/каталог-новостроек/объект/61802',
    stage: 'proposal',
    status: 'warm',
    comment: 'Отправил КП на разработку с интерактивным генпланом.',
    estimatedBudget: 900000,
    nextFollowUp: '2026-11-26',
    createdAt: '2026-11-18T11:00:00Z',
    updatedAt: '2026-11-23T14:00:00Z',
  },
  {
    id: 'l-3',
    projectName: 'ЖК Тихая Гавань',
    developerName: 'ЮгСтрой',
    city: 'Краснодар',
    websiteUrl: 'https://gavan-yug.ru',
    lprName: 'Дмитрий Волков',
    lprRole: 'Директор по продажам',
    lprUrl: 'https://t.me/dvolkov_yug',
    messenger: 'telegram',
    nashDomUrl: 'https://наш.дом.рф/сервисы/каталог-новостроек/объект/49112',
    stage: 'rejected',
    status: 'lost',
    comment: 'Делают сайт своими силами.',
    estimatedBudget: 400000,
    nextFollowUp: '',
    createdAt: '2026-11-10T08:00:00Z',
    updatedAt: '2026-11-19T12:00:00Z',
  },
];

const sampleTasks: TaskItem[] = [
  {
    id: 't-1',
    title: 'Собрать аудит мобильной версии ЖК Речной Квартал',
    notes: 'Показать 3 узких места в каталоге квартир',
    horizon: 'day',
    priority: 'high',
    completed: false,
    linkedLeadId: 'l-1',
    dueLabel: '16:00',
    createdAt: '2026-11-24T08:00:00Z',
  },
  {
    id: 't-2',
    title: 'Отправить follow-up в WhatsApp по ЖК Северный Берег',
    notes: '',
    horizon: 'day',
    priority: 'medium',
    completed: true,
    linkedLeadId: 'l-2',
    dueLabel: '12:00',
    createdAt: '2026-11-24T07:00:00Z',
  },
  {
    id: 't-3',
    title: 'Спарсить 30 новых ЖК в Казани с наш.дом.рф',
    notes: '',
    horizon: 'week',
    priority: 'high',
    completed: false,
    dueLabel: 'До Пт',
    createdAt: '2026-11-23T09:00:00Z',
  },
];

test('normalizeUrl formats bare domains and telegram handles', () => {
  assert.equal(normalizeUrl('example.ru'), 'https://example.ru');
  assert.equal(normalizeUrl('@manager_dev'), 'https://t.me/manager_dev');
  assert.equal(normalizeUrl('https://site.ru/path'), 'https://site.ru/path');
  assert.equal(normalizeUrl('   '), '');
});

test('validateLeadInput requires projectName and validates URLs', () => {
  const emptyRes = validateLeadInput({
    projectName: '   ',
    developerName: '',
    city: '',
    websiteUrl: 'not-a-domain',
    lprName: '',
    lprRole: '',
    lprUrl: '@valid_handle',
    messenger: 'telegram',
    nashDomUrl: '',
    stage: 'research',
    status: 'cold',
    comment: '',
    nextFollowUp: '',
  });
  assert.equal(emptyRes.valid, false);
  assert.ok(emptyRes.errors.projectName);
  assert.ok(emptyRes.errors.websiteUrl);
  assert.equal(emptyRes.errors.lprUrl, undefined);

  const validRes = validateLeadInput({
    projectName: 'ЖК Горизонт',
    developerName: 'Альфа Девелопмент',
    city: 'Екатеринбург',
    websiteUrl: 'gorizont-ekb.ru',
    lprName: 'Иван',
    lprRole: 'Маркетолог',
    lprUrl: '@ivan_dev',
    messenger: 'telegram',
    nashDomUrl: 'https://наш.дом.рф/сервисы/каталог-новостроек/объект/123',
    stage: 'first_touch',
    status: 'warm',
    comment: 'Отправил первое сообщение',
    nextFollowUp: '2026-11-27',
  });
  assert.equal(validRes.valid, true);
});

test('filterLeads filters by search query, stage, messenger, and status', () => {
  const bySearch = filterLeads(sampleLeads, {
    search: 'соколова',
    stage: 'all',
    messenger: 'all',
    status: 'all',
  });
  assert.equal(bySearch.length, 1);
  assert.equal(bySearch[0].id, 'l-2');

  const byMessengerAndStage = filterLeads(sampleLeads, {
    search: '',
    stage: 'dialogue',
    messenger: 'telegram',
    status: 'all',
  });
  assert.equal(byMessengerAndStage.length, 1);
  assert.equal(byMessengerAndStage[0].id, 'l-1');
});

test('computePipelineStats excludes rejected leads from pipeline budget', () => {
  const stats = computePipelineStats(sampleLeads);
  assert.equal(stats.total, 3);
  assert.equal(stats.inDialogue, 1);
  assert.equal(stats.proposalsAndCalls, 1);
  assert.equal(stats.contracts, 0);
  assert.equal(stats.pipelineBudget, 1550000);
});

test('groupLeadsByStage and getNextStage behave deterministically', () => {
  const grouped = groupLeadsByStage(sampleLeads);
  assert.equal(grouped.dialogue.length, 1);
  assert.equal(grouped.proposal.length, 1);
  assert.equal(grouped.rejected.length, 1);
  assert.equal(getNextStage('research'), 'first_touch');
  assert.equal(getNextStage('contract'), null);
  assert.equal(getNextStage('rejected'), null);
});

test('task filtering, sorting, progress, and validation work correctly', () => {
  assert.equal(validateTaskInput({ title: '  ', horizon: 'day', priority: 'medium' }).valid, false);
  assert.equal(validateTaskInput({ title: 'Написать 5 ЛПР', horizon: 'day', priority: 'high' }).valid, true);

  const dayTasks = filterAndSortTasks(sampleTasks, 'day', 'all');
  assert.equal(dayTasks.length, 2);
  assert.equal(dayTasks[0].completed, false);
  assert.equal(dayTasks[1].completed, true);

  const dayProgress = computeTaskProgress(sampleTasks, 'day');
  assert.deepEqual(dayProgress, { completed: 1, total: 2, percent: 50 });
});

test('serializeWorkspace and parseWorkspaceImport roundtrip safely', () => {
  const json = serializeWorkspace(sampleLeads, sampleTasks);
  const imported = parseWorkspaceImport(json);
  assert.equal(imported.ok, true);
  if (imported.ok) {
    assert.equal(imported.leads.length, 3);
    assert.equal(imported.tasks.length, 3);
  }

  const invalid = parseWorkspaceImport('{"foo":"bar"}');
  assert.equal(invalid.ok, false);
});
