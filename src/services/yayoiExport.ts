import { ExpenseItem, Project } from '../types';

/**
 * 弥生会計の仕訳日記帳（インポート用）CSVフォーマットジェネレーター
 * 
 * 弥生会計の標準インポートフォーマット（25項目フォーマット）:
 * 1: 識別フラグ (2000 or 2111)
 * 2: 伝票番号
 * 3: 決算 (空)
 * 4: 取引日付 (YYYY/MM/DD)
 * 5: 借方勘定科目
 * 6: 借方補助科目
 * 7: 借方部門
 * 8: 借方税区分 (課税仕入 10%, 課税仕入 8%(軽), 対象外等)
 * 9: 借方金額
 * 10: 借方税額
 * 11: 貸方勘定科目 (事業主借, 現金, 普通預金等)
 * 12: 貸方補助科目
 * 13: 貸方部門
 * 14: 貸方税区分 (対象外)
 * 15: 貸方金額
 * 16: 貸方税額
 * 17: 摘要
 * 18: 番号
 * 19: 期日
 * 20: タイプ (0: 通常)
 * 21: 生成元 (弥生スマートコネクト or リフォーム現場収支)
 * 22: 仕訳メモ
 * 23: 付箋1
 * 24: 付箋2
 * 25: 調整
 */

export const YayoiExportService = {
  getPaymentMethodCreditAccount(method: string): string {
    switch (method) {
      case 'business_card':
        return '未払金'; // または クレジットカード
      case 'bank_transfer':
        return '普通預金';
      case 'cash':
        return '現金';
      case 'owner_advance':
      default:
        return '事業主借'; // 個人事業主で自分の立替・個人クレカの場合
    }
  },

  getTaxCategory(rate: number): string {
    if (rate === 0.08) return '課税仕入 8%(軽)';
    if (rate === 0.1) return '課税仕入 10%';
    return '対象外';
  },

  generateYayoiCsv(expenses: ExpenseItem[], projects: Project[]): string {
    const projectMap = new Map(projects.map((p) => [p.id, p]));

    // CSVヘッダー行（弥生会計の仕訳インポート時はヘッダー有無を選択できるが、明瞭にするため標準ヘッダーを付与）
    const headers = [
      '識別フラグ',
      '伝票番号',
      '決算',
      '取引日付',
      '借方勘定科目',
      '借方補助科目',
      '借方部門',
      '借方税区分',
      '借方金額',
      '借方税額',
      '貸方勘定科目',
      '貸方補助科目',
      '貸方部門',
      '貸方税区分',
      '貸方金額',
      '貸方税額',
      '摘要',
      '番号',
      '期日',
      'タイプ',
      '生成元',
      '仕訳メモ',
      '付箋1',
      '付箋2',
      '調整',
    ];

    const rows = expenses.map((item, index) => {
      const project = item.projectId ? projectMap.get(item.projectId) : undefined;
      const creditAccount = this.getPaymentMethodCreditAccount(item.paymentMethod);
      const debitTaxCategory = this.getTaxCategory(item.taxRate);
      const creditTaxCategory = '対象外';
      
      const department = project ? project.name.slice(0, 20) : '一般管理';
      const formattedDate = item.date.replace(/-/g, '/');
      const memo = item.memo || `${item.vendor} ${item.accountTitle}`;

      return [
        '2000',                              // 識別フラグ
        (index + 1).toString().padStart(6, '0'), // 伝票番号
        '',                                  // 決算
        formattedDate,                       // 取引日付
        `"${item.accountTitle}"`,            // 借方勘定科目
        `"${item.subAccountTitle || item.vendor}"`, // 借方補助科目
        `"${department}"`,                   // 借方部門
        `"${debitTaxCategory}"`,             // 借方税区分
        item.amount.toString(),              // 借方金額
        item.taxAmount.toString(),           // 借方税額
        `"${creditAccount}"`,                // 貸方勘定科目
        '""',                                // 貸方補助科目
        '""',                                // 貸方部門
        `"${creditTaxCategory}"`,            // 貸方税区分
        item.amount.toString(),              // 貸方金額
        '0',                                 // 貸方税額
        `"${memo.replace(/"/g, '""')}"`,      // 摘要
        '',                                  // 番号
        '',                                  // 期日
        '0',                                 // タイプ
        '"現場収支クラウド"',                // 生成元
        `"レシートID:${item.id}"`,          // 仕訳メモ
        item.yayoiSynced ? '1' : '0',        // 付箋1
        '',                                  // 付箋2
        'no',                                // 調整
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\r\n');
  },

  downloadCsv(content: string, filename: string = '弥生会計仕訳データ.csv') {
    // 弥生会計はShift_JISまたはBOM付きUTF-8をサポート
    // ブラウザで安全に開けるBOM付きUTF-8で出力
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const blob = new Blob([bom, content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
