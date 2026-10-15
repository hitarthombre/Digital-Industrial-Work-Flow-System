const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  _retry?: boolean;
}

class ApiClient {
  private refreshPromise: Promise<string | null> | null = null;

  private getHeaders(customHeaders: HeadersInit = {}): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const token = localStorage.getItem("diws_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return { ...headers, ...customHeaders };
  }

  private handleAuthFailure() {
    localStorage.removeItem("diws_token");
    localStorage.removeItem("diws_refresh_token");
    localStorage.removeItem("diws_user");
    window.dispatchEvent(new Event("diws_auth_logout"));

    // If currently inside protected workspace, redirect cleanly to login
    if (window.location.pathname.startsWith("/app")) {
      window.location.href = `/login?from=${encodeURIComponent(window.location.pathname)}`;
    }
  }

  private async tryRefreshToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem("diws_refresh_token");
    if (!refreshToken) return null;

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (!res.ok) {
          throw new Error("Refresh failed");
        }

        const data = await res.json();
        const newAccessToken = data?.data?.accessToken;
        if (newAccessToken) {
          localStorage.setItem("diws_token", newAccessToken);
          return newAccessToken;
        }
        return null;
      } catch {
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async handleResponse<T>(
    response: Response,
    retryFn?: () => Promise<T>,
    isAuthEndpoint: boolean = false
  ): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        if (!isAuthEndpoint && retryFn) {
          const newToken = await this.tryRefreshToken();
          if (newToken) {
            return retryFn();
          }
        }
        this.handleAuthFailure();
      }

      let errorMsg = "An error occurred while making the request.";
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorData.error || errorMsg;
      } catch (_) {
        try {
          errorMsg = await response.text();
        } catch (_) {}
      }

      throw new Error(errorMsg);
    }

    if (response.status === 204) {
      return {} as T;
    }

    try {
      return await response.json();
    } catch (_) {
      return {} as T;
    }
  }

  async get<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const headers = this.getHeaders(options.headers);
    let requestUrl = `${API_BASE_URL}${url}`;

    if (options.params) {
      const queryParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, val]) => {
        if (val === undefined || val === null || val === "") return;
        queryParams.append(key, String(val));
      });
      requestUrl += `?${queryParams.toString()}`;
    }

    const response = await fetch(requestUrl, {
      ...options,
      method: "GET",
      headers,
    });

    const isAuth = url.startsWith("/auth");
    const retryFn = !options._retry && !isAuth ? () => this.get<T>(url, { ...options, _retry: true }) : undefined;

    return this.handleResponse<T>(response, retryFn, isAuth);
  }

  async post<T>(url: string, body: any, options: RequestOptions = {}): Promise<T> {
    const headers = { ...this.getHeaders(options.headers) } as Record<string, string>;
    if (body instanceof FormData) {
      delete headers["Content-Type"];
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      method: "POST",
      headers,
      body: body instanceof FormData ? body : JSON.stringify(body),
    });

    const isAuth = url.startsWith("/auth");
    const retryFn =
      !options._retry && !isAuth ? () => this.post<T>(url, body, { ...options, _retry: true }) : undefined;

    return this.handleResponse<T>(response, retryFn, isAuth);
  }

  async put<T>(url: string, body: any, options: RequestOptions = {}): Promise<T> {
    const headers = { ...this.getHeaders(options.headers) } as Record<string, string>;
    if (body instanceof FormData) {
      delete headers["Content-Type"];
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      method: "PUT",
      headers,
      body: body instanceof FormData ? body : JSON.stringify(body),
    });

    const isAuth = url.startsWith("/auth");
    const retryFn =
      !options._retry && !isAuth ? () => this.put<T>(url, body, { ...options, _retry: true }) : undefined;

    return this.handleResponse<T>(response, retryFn, isAuth);
  }

  async delete<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const headers = this.getHeaders(options.headers);
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      method: "DELETE",
      headers,
    });

    const isAuth = url.startsWith("/auth");
    const retryFn =
      !options._retry && !isAuth ? () => this.delete<T>(url, { ...options, _retry: true }) : undefined;

    return this.handleResponse<T>(response, retryFn, isAuth);
  }

  async download(url: string, params?: Record<string, string | number | boolean | undefined>): Promise<Blob> {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, val]) => {
      if (val !== undefined && val !== "") query.append(key, String(val));
    });
    const qs = query.toString();
    const response = await fetch(`${API_BASE_URL}${url}${qs ? `?${qs}` : ""}`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    if (!response.ok) {
      await this.handleResponse(response);
    }
    return response.blob();
  }

  async patch<T>(url: string, body?: any, options: RequestOptions = {}): Promise<T> {
    const headers = { ...this.getHeaders(options.headers) } as Record<string, string>;
    if (body instanceof FormData) {
      delete headers["Content-Type"];
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      method: "PATCH",
      headers,
      body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    });

    const isAuth = url.startsWith("/auth");
    const retryFn =
      !options._retry && !isAuth ? () => this.patch<T>(url, body, { ...options, _retry: true }) : undefined;

    return this.handleResponse<T>(response, retryFn, isAuth);
  }
}

export const api = new ApiClient();
