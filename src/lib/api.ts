import type { DatapointDef } from "@/types/datapoint";
import type {
  IntakeUploadResponse,
  ValidateResponse,
  PublishResponse,
} from "@/types/intake";
import type { ExportResponse } from "@/types/export";

const DEFAULT_API_BASE = "http://localhost:8000";
const TOKEN_STORAGE_KEY = "ssdr_token";

interface RequestOptions {
  auth?: boolean;
  rawResponse?: boolean;
}

type UnauthorizedHandler = () => void;

class ApiClient {
  private baseUrl: string;
  private unauthorizedHandler?: UnauthorizedHandler;

  constructor() {
    this.baseUrl = import.meta.env?.VITE_API_BASE ?? DEFAULT_API_BASE;
  }

  public setUnauthorizedHandler(handler: UnauthorizedHandler) {
    this.unauthorizedHandler = handler;
  }

  public setBaseUrl(url?: string) {
    this.baseUrl = url || DEFAULT_API_BASE;
  }

  private getAuthToken() {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  private async request<T = unknown>(
    path: string,
    init: RequestInit = {},
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = new Headers(init.headers ?? {});
    const requiresAuth = options.auth ?? true;

    if (requiresAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    if (
      init.body &&
      !(init.body instanceof FormData) &&
      !(init.body instanceof URLSearchParams) &&
      !headers.has("Content-Type")
    ) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, { ...init, headers });

    if (response.status === 401) {
      if (this.unauthorizedHandler) {
        this.unauthorizedHandler();
      }
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      let detail = response.statusText;
      try {
        const errorBody = await response.json();
        detail = errorBody.detail || JSON.stringify(errorBody);
      } catch (err) {
        // ignore json parse error
      }
      throw new Error(detail);
    }

    if (options.rawResponse) {
      return response as unknown as T;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    return JSON.parse(text) as T;
  }

  private async requestBlob(
    path: string,
    init: RequestInit = {}
  ): Promise<Blob> {
    const response = (await this.request<Response>(path, init, {
      rawResponse: true,
    })) as Response;
    return await response.blob();
  }

  public async login(username: string, password: string) {
    const body = new URLSearchParams();
    body.append("username", username);
    body.append("password", password);
    body.append("scope", "");

    return this.request<{ access_token: string; token_type: string }>(
      "/auth/token",
      {
        method: "POST",
        body,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
      { auth: false }
    );
  }

  public async getDatapoints(): Promise<DatapointDef[]> {
    return this.request<DatapointDef[]>("/datapoints");
  }

  public async uploadIntake(
    file: File,
    supplierId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<IntakeUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("supplier_id", supplierId);
    formData.append("period_start", periodStart);
    formData.append("period_end", periodEnd);

    return this.request<IntakeUploadResponse>("/intakes/upload", {
      method: "POST",
      body: formData,
    });
  }

  public async validateIntake(intakeId: string): Promise<ValidateResponse> {
    return this.request<ValidateResponse>(`/intakes/${intakeId}/validate`, {
      method: "POST",
    });
  }

  public async publishIntake(intakeId: string): Promise<PublishResponse> {
    return this.request<PublishResponse>(`/intakes/${intakeId}/publish`, {
      method: "POST",
    });
  }

  public async createExport(
    template: string,
    payload: {
      supplier_id: string;
      request_id: string;
      period_start: string;
      period_end: string;
    }
  ): Promise<ExportResponse> {
    return this.request<ExportResponse>(`/exports/${template}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  public async downloadExport(exportId: string): Promise<Blob> {
    return this.requestBlob(`/exports/jobs/${exportId}/download`, {
      method: "GET",
    });
  }
}

export const apiClient = new ApiClient();
export { TOKEN_STORAGE_KEY };
