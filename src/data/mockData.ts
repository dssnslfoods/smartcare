// CompanyData interface - used by all dashboard components
export interface CompanyData {
  company: string;
  branch: string;
  kpi: {
    total_calls: number;
    total_records: number;
    closed: number;
    not_closed: number;
    close_rate: number;
    avg_response_days: number;
    median_response_days: number;
  };
  monthly_trend: { year: number; month: string; calls: number; records: number }[];
  status: Record<string, number>;
  category: Record<string, number>;
  problem_type: Record<string, number>;
  sub_problem: Record<string, number>;
  group: Record<string, number>;
  group_code_map: Record<string, string>;
  caller: Record<string, number>;
  close_rate_by_type: Record<string, { total: number; closed: number; rate: number }>;
  response_by_category: Record<string, { avg: number; median: number; max: number }>;
  response_distribution: Record<string, number>;
  group_problem_matrix: { group: string; problem: string; count: number }[];
  monthly_status: { year: number; month: string; status: string; count: number }[];
  monthly_category: Record<string, any>[];
  raw_complaints?: any[];
}
