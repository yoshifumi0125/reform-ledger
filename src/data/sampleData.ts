import { Project, ExpenseItem, LaborRecord, YayoiApiConfig } from '../types';

// 初期実データ（空の状態でスタート）
export const INITIAL_PROJECTS: Project[] = [];

export const INITIAL_EXPENSES: ExpenseItem[] = [];

export const INITIAL_LABOR_RECORDS: LaborRecord[] = [];

export const INITIAL_YAYOI_CONFIG: YayoiApiConfig = {
  clientId: '',
  clientSecret: '',
  companyId: '',
  isConnected: false,
  autoSync: false,
  defaultDebitAccount: '材料費（仕入高）',
  defaultCreditAccount: '事業主借',
  yayoiType: 'online',
};
