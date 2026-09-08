let onUnauthorizedHandler = null;

export const setUnauthorizedHandler = (handler) => {
  onUnauthorizedHandler = handler;
};

export const getApiBaseUrl = () => {
  if (typeof localStorage !== 'undefined') {
    const customUrl = localStorage.getItem('studyvault_api_url');
    if (customUrl) {
      if (customUrl.includes('10.11.20.233')) {
        localStorage.removeItem('studyvault_api_url');
      } else {
        return customUrl.replace(/\/$/, '');
      }
    }
  }
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  }
  const isCapacitor = Boolean(
    typeof window !== 'undefined' && (
      window.Capacitor ||
      window.location.protocol === 'capacitor:' ||
      window.location.protocol === 'file:'
    )
  );
  if (isCapacitor) {
    return 'http://10.0.2.2:5000';
  }
  return '';
};

export const getFullApiUrl = (path) => {
  const base = getApiBaseUrl();
  if (!path) return base;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const formattedPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${formattedPath}` : formattedPath;
};

export const formatMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  return getFullApiUrl(url);
};

export const apiRequest = async (path, options = {}) => {
  const { method = 'GET', body, headers = {}, ...rest } = options;
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('studyvault_token') : null;
  const reqHeaders = { ...headers };
  if (token && !reqHeaders['Authorization']) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  const init = {
    method,
    credentials: 'include',
    headers: reqHeaders,
    ...rest,
  };

  if (body !== undefined && !(body instanceof FormData)) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  } else if (body instanceof FormData) {
    init.body = body;
  }

  try {
    const fullUrl = getFullApiUrl(path);
    const response = await fetch(fullUrl, init);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401 && onUnauthorizedHandler && !path.startsWith('/api/auth/login') && !path.startsWith('/api/auth/register')) {
        onUnauthorizedHandler();
      }
      let errorMsg;
      if (response.status === 401) {
        errorMsg = (typeof data?.error === 'string' ? data.error : null) || (data?.message) || 'Incorrect email or password.';
      } else if (response.status === 500) {
        errorMsg = 'Something went wrong on the server. Please try again.';
      } else if (response.status === 429) {
        errorMsg = (typeof data?.error === 'string' ? data.error : null) || 'Too many attempts, please try again later.';
      } else {
        errorMsg = typeof data?.error === 'object'
          ? data.error.message
          : (data?.error || data?.message || response.statusText || 'API request failed');
      }
      const err = new Error(errorMsg);
      err.status = response.status;
      err.details = data?.error?.details || data?.details || null;
      throw err;
    }
    return data;
  } catch (networkError) {
    if (networkError.status) {
      throw networkError;
    }
    const err = new Error('Unable to connect to StudyVault server. Please check your connection.');
    err.status = 0;
    throw err;
  }
};

export const uploadMedia = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('studyvault_token') : null;
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fullUrl = getFullApiUrl('/api/uploads');
  const response = await fetch(fullUrl, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: formData,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const errorMsg = typeof data?.error === 'object'
      ? data.error.message
      : (data?.error || 'Failed to upload media');
    throw new Error(errorMsg);
  }

  return data.data?.upload?.url || data.upload?.url;
};

