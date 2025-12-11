import * as XLSX from 'xlsx';
import { ExcelData, AnalysisPlan, FilterOperator, AggregationType, AnalysisResult } from '../types';

export const parseExcelFile = async (file: File): Promise<ExcelData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const result: ExcelData = {};

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          // Convert to JSON with header row 1
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });
          if (jsonData.length > 0) {
            result[sheetName] = jsonData;
          }
        });

        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const getWorkbookSchema = (data: ExcelData) => {
  return Object.keys(data).map((sheetName) => {
    const rows = data[sheetName];
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    return {
      sheetName,
      columns,
      rowCount: rows.length,
      sample: rows.slice(0, 3) // Provide a small sample to help AI understand values
    };
  });
};

const fuzzyMatchColumn = (availableColumns: string[], target: string): string | null => {
  if (!target) return null;
  const exact = availableColumns.find(c => c.toLowerCase() === target.toLowerCase());
  if (exact) return exact;
  
  // Try contains
  const partial = availableColumns.find(c => c.toLowerCase().includes(target.toLowerCase()));
  if (partial) return partial;

  return null;
};

export const executePlan = (data: ExcelData, plan: AnalysisPlan): AnalysisResult => {
  const sheetName = Object.keys(data).find(k => k.toLowerCase() === plan.sheetName.toLowerCase());
  
  if (!sheetName || !data[sheetName]) {
    throw new Error(`Sheet "${plan.sheetName}" not found. Available sheets: ${Object.keys(data).join(', ')}`);
  }

  let processedData = [...data[sheetName]];
  const availableColumns = processedData.length > 0 ? Object.keys(processedData[0]) : [];

  // Apply Filters
  if (plan.filters && plan.filters.length > 0) {
    plan.filters.forEach(filter => {
      const col = fuzzyMatchColumn(availableColumns, filter.column);
      if (!col) return; // Skip invalid columns

      processedData = processedData.filter(row => {
        const rowValue = row[col];
        const filterValue = filter.value;

        // Basic Type coercion for comparison
        const rv = isNaN(Number(rowValue)) ? String(rowValue).toLowerCase() : Number(rowValue);
        const fv = isNaN(Number(filterValue)) ? String(filterValue).toLowerCase() : Number(filterValue);

        switch (filter.operator) {
          case FilterOperator.EQUALS:
            return rv == fv; // Loose equality for string/number mix
          case FilterOperator.NOT_EQUALS:
            return rv != fv;
          case FilterOperator.GREATER_THAN:
            return rv > fv;
          case FilterOperator.LESS_THAN:
            return rv < fv;
          case FilterOperator.CONTAINS:
            return String(rowValue).toLowerCase().includes(String(filterValue).toLowerCase());
          default:
            return true;
        }
      });
    });
  }

  const recordCount = processedData.length;

  // Apply Aggregation
  let result: any = null;
  const aggType = plan.aggregation?.type || AggregationType.LIST;
  const aggColTarget = plan.aggregation?.column || '';
  const aggCol = fuzzyMatchColumn(availableColumns, aggColTarget);

  switch (aggType) {
    case AggregationType.COUNT:
      result = processedData.length;
      break;
    case AggregationType.SUM:
      if (!aggCol) throw new Error(`Column "${aggColTarget}" not found for summation.`);
      result = processedData.reduce((sum, row) => sum + (Number(row[aggCol]) || 0), 0);
      break;
    case AggregationType.AVERAGE:
      if (!aggCol) throw new Error(`Column "${aggColTarget}" not found for average.`);
      if (processedData.length === 0) result = 0;
      else {
        const sum = processedData.reduce((s, r) => s + (Number(r[aggCol]) || 0), 0);
        result = sum / processedData.length;
      }
      break;
    case AggregationType.MIN:
      if (!aggCol) throw new Error(`Column "${aggColTarget}" not found for min.`);
      if (processedData.length === 0) result = 0;
      else result = Math.min(...processedData.map(r => Number(r[aggCol]) || 0));
      break;
    case AggregationType.MAX:
      if (!aggCol) throw new Error(`Column "${aggColTarget}" not found for max.`);
      if (processedData.length === 0) result = 0;
      else result = Math.max(...processedData.map(r => Number(r[aggCol]) || 0));
      break;
    case AggregationType.LIST:
      // Limit results for list to prevent token overflow in next step
      result = processedData.slice(0, plan.limit || 10);
      break;
    default:
      result = processedData.slice(0, 10);
  }

  return {
    answer: result,
    meta: {
      recordCount,
      generatedPlan: plan
    }
  };
};