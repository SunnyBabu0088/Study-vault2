export const apiRequest = async (path, options = {}) => {
  const { method = 'GET', body, headers = {}, ...rest } = options;
  const init = {
    method,
    credentials: 'include',
    headers: { ...headers },
    ...rest,
  };

  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const response = await fetch(path, init);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const errorText = data?.error || response.statusText || 'API request failed';
    throw new Error(errorText);
  }
  return data;
};

export const uploadMedia = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/uploads', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to upload media');
  }

  return data.upload.url;
};
