const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

class ApiClient {
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

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        // Token might have expired, clear session
        localStorage.removeItem("diws_token");
        localStorage.removeItem("diws_user");
        // Force page reload or redirect could be handled by context, but we will emit or clear here
      }

      let errorMsg = "An error occurred while making the request.";
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorData.error || errorMsg;
      } catch (_) {
        // Fallback if response isn't JSON
        try {
          errorMsg = await response.text();
        } catch (_) {}
      }

      throw new Error(errorMsg);
    }

    // Return empty object for empty contents
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
        queryParams.append(key, String(val));
      });
      requestUrl += `?${queryParams.toString()}`;
    }

    const response = await fetch(requestUrl, {
      ...options,
      method: "GET",
      headers,
    });

    return this.handleResponse<T>(response);
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

    return this.handleResponse<T>(response);
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

    return this.handleResponse<T>(response);
  }

  async delete<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const headers = this.getHeaders(options.headers);
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      method: "DELETE",
      headers,
    });

    return this.handleResponse<T>(response);
  }
}

export const api = new ApiClient();
