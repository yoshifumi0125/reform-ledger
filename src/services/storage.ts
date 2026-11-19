import { Project, ExpenseItem, LaborRecord, YayoiApiConfig, YayoiSyncLog } from '../types';
import { INITIAL_PROJECTS, INITIAL_EXPENSES, INITIAL_LABOR_RECORDS, INITIAL_YAYOI_CONFIG } from '../data/sampleData';

const KEYS = {
  PROJECTS: 'reform_ledger_live_projects_v2',
  EXPENSES: 'reform_ledger_live_expenses_v2',
  LABOR: 'reform_ledger_live_labor_v2',
  CONFIG: 'reform_ledger_live_config_v2',
  LOGS: 'reform_ledger_live_logs_v2',
};

export const StorageService = {
  getProjects(): Project[] {
    const raw = localStorage.getItem(KEYS.PROJECTS);
    if (!raw) return INITIAL_PROJECTS;
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
    if (!raw) return INITIAL_EXPENSES;
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
    if (!raw) return INITIAL_LABOR_RECORDS;
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
    if (!raw) return INITIAL_YAYOI_CONFIG;
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
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveYayoiLogs(logs: YayoiSyncLog[]) {
    localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
  },

  addYayoiLog(log: YayoiSyncLog) {
    const logs = this.getYayoiLogs();
    this.saveYayoiLogs([log, ...logs]);
  },

  resetToDefault() {
    localStorage.removeItem(KEYS.PROJECTS);
    localStorage.removeItem(KEYS.EXPENSES);
    localStorage.removeItem(KEYS.LABOR);
  },
};
