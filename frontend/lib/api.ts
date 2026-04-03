import axios, { type AxiosError } from "axios";

import type {
  AnalysisRecord,
  AnalysisStartRequest,
  DatasetRecord,
  LoginRequest,
  RegisterRequest,
} from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1",
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("fairswarm_access_token");
    const csrfToken = localStorage.getItem("fairswarm_csrf_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (csrfToken) {
      config.headers["x-csrf-token"] = csrfToken;
    }
  }
  return config;
});

export function normalizeApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    return axiosError.response?.data?.detail ?? axiosError.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected error occurred.";
}

export const authApi = {
  register: (payload: RegisterRequest) => api.post("/auth/register", payload),
  login: (payload: LoginRequest) => api.post("/auth/login", payload),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

export const datasetsApi = {
  list: () => api.get<{ items: DatasetRecord[] }>("/datasets"),
  details: (datasetId: string) => api.get<DatasetRecord>(`/datasets/${datasetId}`),
  preview: (datasetId: string) => api.get(`/datasets/${datasetId}/preview`),
};

export const analysisApi = {
  list: () => api.get<{ items: AnalysisRecord[] }>("/analysis"),
  details: (analysisId: string) => api.get(`/analysis/${analysisId}`),
  start: (payload: AnalysisStartRequest) => api.post(`/analysis/start`, payload),
};

export default api;
