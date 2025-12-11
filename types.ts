export interface ExcelData {
  [sheetName: string]: any[];
}

export interface SheetSchema {
  sheetName: string;
  columns: string[];
  rowCount: number;
  sample: any[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isLoading?: boolean;
}

export enum FilterOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'neq',
  GREATER_THAN = 'gt',
  LESS_THAN = 'lt',
  CONTAINS = 'contains'
}

export enum AggregationType {
  SUM = 'sum',
  AVERAGE = 'average',
  COUNT = 'count',
  MIN = 'min',
  MAX = 'max',
  LIST = 'list'
}

export interface Filter {
  column: string;
  operator: FilterOperator;
  value: string | number;
}

export interface AnalysisPlan {
  sheetName: string;
  filters?: Filter[];
  aggregation?: {
    type: AggregationType;
    column?: string;
  };
  limit?: number;
  reasoning: string;
}

export interface AnalysisResult {
  answer: string | number | any[];
  meta: {
    recordCount: number;
    generatedPlan: AnalysisPlan;
  };
}