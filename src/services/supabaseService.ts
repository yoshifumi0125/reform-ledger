import { createClient } from '@supabase/supabase-js';
import { Project, ExpenseItem, LaborRecord } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tmabejxorcgtirqejafh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtYWJlanhvcmNndGlycWVqYWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MTAyMzcsImV4cCI6MjA5OTQ4NjIzN30.iMMag6tTai1t63J1lTvY-jgOYxvUFMahwo2M-edzT3g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const SupabaseDbService = {
  // 現場案件 (Projects)
  async getProjects(): Promise<Project[]> {
    try {
      const { data, error } = await supabase
        .from('reform_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((row) => ({
        id: row.id,
        name: row.name,
        client: row.client,
        contractAmount: Number(row.contract_amount),
        taxRate: Number(row.tax_rate),
        status: row.status,
        startDate: row.start_date,
        endDate: row.end_date,
        invoicedDate: row.invoiced_date,
        paymentDueDate: row.payment_due_date,
        notes: row.notes,
        category: row.category,
      }));
    } catch (err) {
      console.error('Supabase getProjects error:', err);
      return [];
    }
  },

  async saveProject(project: Project): Promise<void> {
    try {
      await supabase.from('reform_projects').upsert({
        id: project.id,
        name: project.name,
        client: project.client,
        contract_amount: project.contractAmount,
        tax_rate: project.taxRate,
        status: project.status,
        start_date: project.startDate,
        end_date: project.endDate,
        invoiced_date: project.invoicedDate,
        payment_due_date: project.paymentDueDate,
        notes: project.notes,
        category: project.category,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Supabase saveProject error:', err);
    }
  },

  async deleteProject(id: string): Promise<void> {
    try {
      await supabase.from('reform_projects').delete().eq('id', id);
    } catch (err) {
      console.error('Supabase deleteProject error:', err);
    }
  },

  // 支出・レシート (Expenses)
  async getExpenses(): Promise<ExpenseItem[]> {
    try {
      const { data, error } = await supabase
        .from('reform_expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error || !data) return [];

      return data.map((row) => ({
        id: row.id,
        projectId: row.project_id || undefined,
        date: row.date,
        vendor: row.vendor,
        category: row.category,
        accountTitle: row.account_title,
        subAccountTitle: row.sub_account_title,
        amount: Number(row.amount),
        taxRate: Number(row.tax_rate),
        taxAmount: Number(row.tax_amount),
        paymentMethod: row.payment_method,
        receiptImageUrl: row.receipt_image_url,
        receiptItems: row.receipt_items || [],
        memo: row.memo || '',
        yayoiSynced: Boolean(row.yayoi_synced),
        yayoiSyncedAt: row.yayoi_synced_at,
        yayoiJournalId: row.yayoi_journal_id,
      }));
    } catch (err) {
      console.error('Supabase getExpenses error:', err);
      return [];
    }
  },

  async saveExpense(expense: ExpenseItem): Promise<void> {
    try {
      await supabase.from('reform_expenses').upsert({
        id: expense.id,
        project_id: expense.projectId || null,
        date: expense.date,
        vendor: expense.vendor,
        category: expense.category,
        account_title: expense.accountTitle,
        sub_account_title: expense.subAccountTitle || null,
        amount: expense.amount,
        tax_rate: expense.taxRate,
        tax_amount: expense.taxAmount,
        payment_method: expense.paymentMethod,
        receipt_image_url: expense.receiptImageUrl || null,
        receipt_items: expense.receiptItems || [],
        memo: expense.memo || '',
        yayoi_synced: expense.yayoiSynced,
        yayoi_synced_at: expense.yayoiSyncedAt || null,
        yayoi_journal_id: expense.yayoiJournalId || null,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Supabase saveExpense error:', err);
    }
  },

  async deleteExpense(id: string): Promise<void> {
    try {
      await supabase.from('reform_expenses').delete().eq('id', id);
    } catch (err) {
      console.error('Supabase deleteExpense error:', err);
    }
  },

  // 応援職人人工 (Labor)
  async getLaborRecords(): Promise<LaborRecord[]> {
    try {
      const { data, error } = await supabase
        .from('reform_labor_records')
        .select('*')
        .order('date', { ascending: false });

      if (error || !data) return [];

      return data.map((row) => ({
        id: row.id,
        projectId: row.project_id,
        date: row.date,
        craftsmanName: row.craftsman_name,
        tradeType: row.trade_type,
        manDays: Number(row.man_days),
        dailyRate: Number(row.daily_rate),
        totalAmount: Number(row.total_amount),
        withholdingTax: Number(row.withholding_tax),
        netPayment: Number(row.net_payment),
        status: row.status,
        yayoiSynced: Boolean(row.yayoi_synced),
      }));
    } catch (err) {
      console.error('Supabase getLaborRecords error:', err);
      return [];
    }
  },

  async saveLaborRecord(record: LaborRecord): Promise<void> {
    try {
      await supabase.from('reform_labor_records').upsert({
        id: record.id,
        project_id: record.projectId,
        date: record.date,
        craftsman_name: record.craftsmanName,
        trade_type: record.tradeType,
        man_days: record.manDays,
        daily_rate: record.dailyRate,
        total_amount: record.totalAmount,
        withholding_tax: record.withholdingTax,
        net_payment: record.netPayment,
        status: record.status,
        yayoi_synced: record.yayoiSynced,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Supabase saveLaborRecord error:', err);
    }
  },

  async deleteLaborRecord(id: string): Promise<void> {
    try {
      await supabase.from('reform_labor_records').delete().eq('id', id);
    } catch (err) {
      console.error('Supabase deleteLaborRecord error:', err);
    }
  },
};
