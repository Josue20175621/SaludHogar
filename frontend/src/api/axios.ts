import axios from 'axios';

const baseConfig = {
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
};

export const familyApi = axios.create({
  ...baseConfig,
  baseURL: `${baseConfig.baseURL}/families`,
});

export const authApi = axios.create({
  ...baseConfig,
  baseURL: `${baseConfig.baseURL}/auth`,
});

// General instance for endpoints without specific prefix
export const api = axios.create(baseConfig);

// Also export the base instance as default for backward compatibility
export default api;