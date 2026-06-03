const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class APIError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "APIError";
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body.detail || body.message || message;
    } catch {
      // ignore parse error
    }
    throw new APIError(res.status, message);
  }
  return res.json() as Promise<T>;
}

export const apiClient = {
  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<T>(res);
  },

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return handleResponse<T>(res);
  },

  async postForm<T>(path: string, formData: FormData): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      body: formData,
    });
    return handleResponse<T>(res);
  },

  async delete<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, { method: "DELETE" });
    return handleResponse<T>(res);
  },
};

// Typed endpoint helpers
export const api = {
  image: {
    analyze: (form: FormData) => apiClient.postForm("/api/image/analyze", form),
    history: () => apiClient.get("/api/image/history"),
    record: (id: string) => apiClient.get(`/api/image/history/${id}`),
  },
  video: {
    analyze: (form: FormData) => apiClient.postForm("/api/video/analyze", form),
    history: () => apiClient.get("/api/video/history"),
    record: (id: string) => apiClient.get(`/api/video/history/${id}`),
  },
  audio: {
    analyze: (form: FormData) => apiClient.postForm("/api/audio/analyze", form),
    history: () => apiClient.get("/api/audio/history"),
    record: (id: string) => apiClient.get(`/api/audio/history/${id}`),
  },
  document: {
    analyze: (form: FormData) => apiClient.postForm("/api/document/analyze-document", form),
    history: () => apiClient.get("/api/document/history"),
    record: (id: string) => apiClient.get(`/api/document/history/${id}`),
  },
  url: {
    analyze: (url: string) => apiClient.post("/api/url/analyze-url", { url }),
    history: () => apiClient.get("/api/url/history"),
    record: (id: string) => apiClient.get(`/api/url/history/${id}`),
  },
  analytics: {
    dashboard: () => apiClient.get("/api/analytics/dashboard"),
    summary: () => apiClient.get("/api/analytics/summary"),
    trends: () => apiClient.get("/api/analytics/trends"),
    breakdown: () => apiClient.get("/api/analytics/breakdown"),
    riskDistribution: () => apiClient.get("/api/analytics/risk-distribution"),
    contentTypes: () => apiClient.get("/api/analytics/content-types"),
    activity: (days = 14) => apiClient.get(`/api/analytics/activity?days=${days}`),
    recent: (limit = 10) => apiClient.get(`/api/analytics/recent?limit=${limit}`),
  },
  reports: {
    list: () => apiClient.get("/api/reports/"),
    generate: (id: string, mediaType: string) =>
      apiClient.post(`/api/reports/generate/${id}?media_type=${mediaType}`, {}),
    download: (id: string, format: "pdf" | "json" = "pdf") =>
      `${BASE_URL}/api/reports/download/${id}?format=${format}`,
  },
};
