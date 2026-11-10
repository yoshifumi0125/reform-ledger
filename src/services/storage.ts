import { Project, ExpenseItem, LaborRecord, YayoiApiConfig, YayoiSyncLog } from '../types';
import { INITIAL_PROJECTS, INITIAL_EXPENSES, INITIAL_LABOR_RECORDS, INITIAL_YAYOI_CONFIG } from '../data/sampleData';

const KEYS = {
  PROJECTS: 'reform_ledger_projects_v1',
  EXPENSES: 'reform_ledger_expenses_v1',
  LABOR: 'reform_ledger_labor_v1',
  CONFIG: 'reform_ledger_yayoi_config_v1',
  LOGS: 'reform_ledger_yayoi_logs_v1',
};

export const StorageService = {
  getProjects(): Project[] {
    const raw = localStorage.getItem(KEYS.PROJECTS);
    if (!raw) {
      localStorage.setItem(KEYS.PROJECTS, JSON.stringify(INITIAL_PROJECTS));
      return INITIAL_PROJECTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_PROJECTS;
    }
  },

  saveProjects(projects: Project[]) {
    localStorage.setItem(KEYS.PROJECTS, JSON.stringify(projects));
  },

  getExpenses(): ExpenseItem[] {
    const raw = localStorage.getItem(KEYS.EXPENSES);
    if (!raw) {
      localStorage.setItem(KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
      return INITIAL_EXPENSES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_EXPENSES;
    }
  },

  saveExpenses(expenses: ExpenseItem[]) {
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
  },

  getLaborRecords(): LaborRecord[] {
    const raw = localStorage.getItem(KEYS.LABOR);
    if (!raw) {
      localStorage.setItem(KEYS.LABOR, JSON.stringify(INITIAL_LABOR_RECORDS));
      return INITIAL_LABOR_RECORDS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_LABOR_RECORDS;
    }
  },

  saveLaborRecords(records: LaborRecord[]) {
    localStorage.setItem(KEYS.LABOR, JSON.stringify(records));
  },

  getYayoiConfig(): YayoiApiConfig {
    const raw = localStorage.getItem(KEYS.CONFIG);
    if (!raw) {
      localStorage.setItem(KEYS.CONFIG, JSON.stringify(INITIAL_YAYOI_CONFIG));
      return INITIAL_YAYOI_CONFIG;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_YAYOI_CONFIG;
    }
  },

  saveYayoiConfig(config: YayoiApiConfig) {
    localStorage.setItem(KEYS.CONFIG, JSON.stringify(config));
  },

  getYayoiLogs(): YayoiSyncLog[] {
    const raw = localStorage.getItem(KEYS.LOGS);
    if (!raw) return [
      {
        id: 'log-001',
        timestamp: '2026-11-05 18:30:12',
        type: 'api_export',
        count: 2,
        totalAmount: 89750,
        status: 'success',
        responseMessage: '弥生スマート取引取込API: 2件の仕訳を正常に登録しました。(取引ID: YY-202611-0082, YY-202611-0083)',
      },
      {
        id: 'log-002',
        timestamp: '2026-11-01 10:15:44',
        type: 'api_export',
        count: 3,
        totalAmount: 103000,
        status: 'success',
        responseMessage: '弥生スマート取引取込API: 3件の仕訳を正常に登録しました。',
      }
    ];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  addYayoiLog(log: YayoiSyncLog) {
    const current = this.getYayoiLogs();
    const updated = [log, ...current].slice(0, 50);
    localStorage.setItem(KEYS.LOGS, JSON.stringify(updated));
    return updated;
  },

  resetToDefault() {
    localStorage.setItem(KEYS.PROJECTS, JSON.stringify(INITIAL_PROJECTS));
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
    localStorage.setItem(KEYS.LABOR, JSON.stringify(INITIAL_LABOR_RECORDS));
    localStorage.setItem(KEYS.CONFIG, JSON.stringify(INITIAL_YAYOI_CONFIG));
    localStorage.removeItem(KEYS.LOGS);
  }
};
