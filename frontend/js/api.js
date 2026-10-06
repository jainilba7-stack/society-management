// Intelligently resolve API Base URL (port 5000 is safe and permitted by Chromium/Edge/Firefox)
const getApiBaseUrl = () => {
  if (window.location.port === '5000') {
    return window.location.origin + '/api';
  }
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Global HTTP Fetch Wrapper for Society API
 */
const api = {
  getToken() {
    return localStorage.getItem('society_token');
  },

  setToken(token) {
    localStorage.setItem('society_token', token);
  },

  removeToken() {
    localStorage.removeItem('society_token');
    localStorage.removeItem('society_user');
  },

  getUser() {
    const u = localStorage.getItem('society_user');
    return u ? JSON.parse(u) : null;
  },

  setUser(user) {
    localStorage.setItem('society_user', JSON.stringify(user));
  },

  async request(endpoint, method = 'GET', body = null, isMultipart = false) {
    const token = this.getToken();
    const headers = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!isMultipart && body) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      method,
      headers,
    };

    if (body) {
      config.body = isMultipart ? body : JSON.stringify(body);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const contentType = response.headers.get('content-type') || '';

      let data;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        if (!response.ok) {
          throw new Error(`Server Error (${response.status}): Could not connect to API backend at ${API_BASE_URL}`);
        }
        data = { success: true, message: text };
      }

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          this.removeToken();
          if (!window.location.pathname.includes('login') && !window.location.pathname.includes('register') && window.location.pathname !== '/') {
            window.location.href = 'login.html?expired=true';
          }
        }
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`[API Error ${method} ${endpoint}]:`, error.message);
      throw error;
    }
  },

  get(endpoint) {
    return this.request(endpoint, 'GET');
  },

  post(endpoint, body, isMultipart = false) {
    return this.request(endpoint, 'POST', body, isMultipart);
  },

  put(endpoint, body, isMultipart = false) {
    return this.request(endpoint, 'PUT', body, isMultipart);
  },

  delete(endpoint) {
    return this.request(endpoint, 'DELETE');
  },
};
