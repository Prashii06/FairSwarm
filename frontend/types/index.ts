export type Severity = "low" | "medium" | "high" | "critical";

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  organization?: string | null;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
  organization?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface DatasetRecord {
  id: string;
  name: string;
  file_size?: number;
  row_count?: number;
  sensitive_columns?: string[];
  status?: string;
  created_at?: string;
}

export interface MetricResult {
  metric_name: string;
  value: number;
  threshold_min: number;
  threshold_max: number;
  is_fair: boolean;
  severity: Severity;
  plain_english_explanation: string;
}

export interface AnalysisRecord {
  id: string;
  dataset_id: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  created_at: string;
  completed_at?: string | null;
}

export interface AnalysisStartRequest {
  dataset_id: string;
  sensitive_columns: string[];
  target_column: string;
  analysis_name?: string;
}
