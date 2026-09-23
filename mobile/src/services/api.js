import { Platform } from 'react-native';

// In Android emulator, 10.0.2.2 maps to the host machine's localhost
// In iOS simulator or web, localhost works directly
const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
export const API_BASE_URL = `http://${DEFAULT_HOST}:5000/api/v1`;

/**
 * Universal fetch wrapper with error handling and timeout
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);

    const response = await fetch(url, {
      ...config,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Network request timed out. Please check your backend connection.');
    }
    throw error;
  }
}

export const api = {
  // 1. Health check
  checkHealth: () => request('/health'),

  // 2. AI Urgency Triage
  getTriage: ({ animalType, description, photoUrl }) =>
    request('/triage', {
      method: 'POST',
      body: JSON.stringify({ animalType, description, photoUrl }),
    }),

  // 3. Emergency Reporting
  submitReport: (reportData) =>
    request('/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    }),

  // 4. Cases
  getCaseById: (caseId) => request(`/cases/${caseId}`),
  getAllCases: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/cases${query ? `?${query}` : ''}`);
  },
  updateCaseStatus: (caseId, statusData) =>
    request(`/cases/${caseId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    }),

  // 5. Rescuer Dispatch
  acceptCase: (caseId, rescuerId) =>
    request(`/dispatch/${caseId}/accept`, {
      method: 'POST',
      body: JSON.stringify({ rescuerId }),
    }),
  declineCase: (caseId, rescuerId, reason) =>
    request(`/dispatch/${caseId}/decline`, {
      method: 'POST',
      body: JSON.stringify({ rescuerId, reason }),
    }),
  getNearbyCases: () => request('/dispatch/nearby'),
  getActiveRescue: () => request('/dispatch/active'),

  // 6. Rescuer Profile & Availability
  updateAvailability: (available) =>
    request('/rescuers/availability', {
      method: 'PATCH',
      body: JSON.stringify({ available }),
    }),
  updateLocation: (latitude, longitude) =>
    request('/rescuers/location', {
      method: 'PATCH',
      body: JSON.stringify({ latitude, longitude }),
    }),

  // 7. Emergency Contacts
  getContacts: (category = '') =>
    request(`/contacts${category ? `?category=${encodeURIComponent(category)}` : ''}`),

  // 8. Animals & QR
  getAnimalByCaseId: (caseId) => request(`/animals/case/${caseId}`),
  getAnimalByQr: (identifier) => request(`/animals/qr/${identifier}`),
};

export default api;
