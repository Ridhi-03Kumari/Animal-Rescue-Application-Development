import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Used only if the address of the PC serving the app cannot be detected.
// Set EXPO_PUBLIC_API_URL (e.g. http://192.168.1.20:5000/api/v1) to override everything.
const FALLBACK_HOST = '10.110.153.199';

// The app is loaded from http://<your PC>:8081, so the backend (port 5000) lives on that same PC.
// Reading the address from there means this keeps working when the Wi-Fi address changes.
function detectHost() {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' && window.location && window.location.hostname
      ? window.location.hostname
      : 'localhost';
  }

  // Where this app's JavaScript was downloaded from, e.g. http://192.168.1.20:8081/index.bundle?...
  // Older React Native exposes it as SourceCode.scriptURL; the new architecture only through getConstants().
  let scriptURL = null;
  try {
    const sourceCode = NativeModules && NativeModules.SourceCode;
    if (sourceCode) {
      scriptURL =
        sourceCode.scriptURL ||
        (typeof sourceCode.getConstants === 'function' ? sourceCode.getConstants().scriptURL : null);
    }
  } catch (e) {
    scriptURL = null;
  }

  const match = scriptURL && scriptURL.match(/^https?:\/\/([^/:]+)/);
  return match ? match[1] : FALLBACK_HOST;
}

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${detectHost()}:5000/api/v1`;

const REQUEST_TIMEOUT_MS = 6000;
const OFFLINE_MEMORY_MS = 5000;
const OFFLINE_MESSAGE =
  'Cannot reach the server. Make sure the backend is running and your phone is on the same Wi-Fi as your computer.';

// When the server can't be reached, remember it briefly so the next few calls fail straight away
// instead of each one waiting for its own timeout (the app then shows its offline fallback at once).
let offlineSince = 0;

// Called when the server says the saved login has expired, so the app can sign the user out
let onUnauthorized = null;
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

/**
 * Universal fetch wrapper: adds the saved login token, a timeout and readable errors
 */
async function request(endpoint, options = {}) {
  if (offlineSince && Date.now() - offlineSince < OFFLINE_MEMORY_MS) {
    throw new Error(OFFLINE_MESSAGE);
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const { headers: extraHeaders, timeout, ...rest } = options;

  let token = null;
  try {
    token = await AsyncStorage.getItem('user_token');
  } catch (e) {
    // no saved login - carry on as a guest
  }

  const config = {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
    },
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout || REQUEST_TIMEOUT_MS);

    const response = await fetch(url, {
      ...config,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    offlineSince = 0; // the server answered

    const data = await response.json();
    if (!response.ok) {
      // A saved login that no longer works (expired): sign out so the user lands on the login screen
      if (response.status === 401 && token && /token/i.test(data.error || '') && onUnauthorized) {
        onUnauthorized();
      }
      const httpError = new Error(data.error || `HTTP error ${response.status}`);
      httpError.status = response.status; // lets screens react to e.g. 401 "please log in"
      throw httpError;
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError' || error instanceof TypeError || /network request failed|fetch failed/i.test(error.message)) {
      offlineSince = Date.now();
      throw new Error(OFFLINE_MESSAGE);
    }
    throw error;
  }
}

export const api = {
  // 0. Authentication
  login: (phone, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    }),
  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  // 1. Health check
  checkHealth: () => request('/health'),

  // 2. AI Urgency Triage
  getTriage: ({ animalType, description, photoUrl }) =>
    request('/triage', {
      method: 'POST',
      body: JSON.stringify({ animalType, description, photoUrl }),
    }),

  // 3. Emergency Reporting
  // The AI check plus finding a rescuer can take several seconds, so this call waits longer than the rest.
  // It is safe to retry: the same clientRequestId always returns the same case.
  submitReport: (reportData) =>
    request('/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
      timeout: 30000,
    }),

  // 4. Cases
  getCaseById: (caseId) => request(`/cases/${caseId}`),
  getMyReports: () => request('/cases/my-reports'),
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
  getRescuerProfile: () => request('/rescuers/profile'),
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
