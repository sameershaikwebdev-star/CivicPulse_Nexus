const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

/**
 * Generic fetch wrapper. Automatically attaches the JWT token (if present)
 * and parses JSON responses, throwing an Error with the server's message
 * on non-2xx responses.
 */
async function request(path, { method = "GET", body, isFormData = false, token } = {}) {
  const headers = {};

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body
  }

  if (!res.ok) {
    throw new Error(data?.message || `Request failed with status ${res.status}`);
  }

  return data;
}

export const authApi = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  me: (token) => request("/auth/me", { token }),
};

export const complaintApi = {
  create: (formData, token) =>
    request("/complaints", {
      method: "POST",
      body: formData,
      isFormData: true,
      token,
    }),
  list: (token, query = "") => request(`/complaints${query}`, { token }),
  getById: (id, token) => request(`/complaints/${id}`, { token }),
  updateStatus: (id, status, token) =>
    request(`/complaints/${id}/status`, { method: "PATCH", body: { status }, token }),
  remove: (id, token) => request(`/complaints/${id}`, { method: "DELETE", token }),
};

export { API_BASE_URL };
