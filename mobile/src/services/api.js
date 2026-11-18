import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Set EXPO_PUBLIC_API_URL (e.g. http://<YOUR_LAN_IP>:5000/api/v1 or https://api.yourdomain.com/api/v1)
// in mobile/.env to explicitly configure the backend target.

// In development, Metro bundler serves the app from http://<your PC>:8081, so the backend (port 5000)
// lives on that same host. Reading the address from there means local testing works across Wi-Fi networks.
function detectHost() {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' && window.location && window.location.hostname
      ? window.location.hostname
      : null;
  }

  // Where this app's JavaScript bundle was loaded from, e.g. http://192.168.1.20:8081/index.bundle?...
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
  return match ? match[1] : null;
}

function resolveApiBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  const detected = detectHost();
  if (detected) {
    return `http://${detected}:5000/api/v1`;
  }

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.warn(
      '[API Config Warning] EXPO_PUBLIC_API_URL is not configured and bundler host could not be detected. ' +
      'Please set EXPO_PUBLIC_API_URL in mobile/.env (e.g. EXPO_PUBLIC_API_URL=http://<YOUR_COMPUTER_IP>:5000/api/v1).'
    );
  }

  return '';
}

export const API_BASE_URL = resolveApiBaseUrl();

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

  if (!API_BASE_URL) {
    throw new Error(
      'API server URL is not configured. Please set EXPO_PUBLIC_API_URL in your mobile environment.'
    );
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const { headers: extraHeaders, timeout, ...rest } = options;

  let token = null;
  try {
    token = await AsyncStorage.getItem('user_token');
  } catch (e) {
    // no saved login - carry on as a guest
  }

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };

  // Only set application/json if body is not FormData (fetch handles boundary automatically for FormData)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const config = {
    ...rest,
    headers,
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
      httpError.code = data.code; // e.g. INVALID_IMAGE, so a screen can tell "not an animal photo" from other errors
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

  // 4. Photo Upload (Cloudinary via Backend)
  uploadPhoto: async (photoInput) => {
    if (!photoInput) return null;

    if (!API_BASE_URL) {
      throw new Error(
        'API server URL is not configured. Please set EXPO_PUBLIC_API_URL in your mobile environment.'
      );
    }

    // Support both raw string URI and ImagePickerAsset object
    const uri = typeof photoInput === 'string' ? photoInput : photoInput.uri;
    if (!uri) return null;

    // If it's already an uploaded remote URL, return as-is
    if (/^https?:\/\//i.test(uri)) {
      return uri;
    }

    // Resolve filename & extension safely
    let fileName = typeof photoInput === 'object' && photoInput.fileName ? photoInput.fileName : '';
    let mimeType = typeof photoInput === 'object' && photoInput.mimeType ? photoInput.mimeType : '';

    if (!fileName) {
      const uriClean = uri.split('?')[0];
      fileName = uriClean.split('/').pop() || '';
    }

    // Detect extension from filename or mimeType
    let ext = 'jpg';
    const extMatch = /\.(\w+)$/.exec(fileName);
    if (extMatch) {
      ext = extMatch[1].toLowerCase();
      if (ext === 'jpeg') ext = 'jpg';
    } else if (mimeType && mimeType.includes('/')) {
      const mExt = mimeType.split('/')[1].toLowerCase();
      if (['jpeg', 'jpg', 'png', 'webp', 'gif'].includes(mExt)) {
        ext = mExt === 'jpeg' ? 'jpg' : mExt;
      }
    }

    // Guarantee valid filename with extension (e.g. "rescue-1731835000000.jpg" or "photo.jpg")
    const safeName = fileName && /\.\w+$/.test(fileName)
      ? fileName
      : `rescue-${Date.now()}.${ext}`;

    const safeType = mimeType || `image/${ext === 'jpg' ? 'jpeg' : ext}`;

    const formData = new FormData();

    if (Platform.OS === 'web') {
      const res = await fetch(uri);
      const blob = await res.blob();
      formData.append('photo', blob, safeName);
    } else {
      formData.append('photo', {
        uri,
        name: safeName,
        type: safeType,
      });
    }

    // Use XMLHttpRequest for multipart upload to completely bypass Expo fetch convertFormDataAsync limitation
    // (which throws "Unsupported FormDataPart implementation" on React Native objects)
    return new Promise(async (resolve, reject) => {
      let token = null;
      try {
        token = await AsyncStorage.getItem('user_token');
      } catch (e) {
        // Guest mode
      }

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/upload`);
      // The server checks the photo with AI before storing it (usually 2-4 s, up to ~17 s when the AI service
      // is slow and has to be retried), then stores it. Leave plenty of room so a good photo is not cut off.
      xhr.timeout = 45000;

      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      // Note: Never set Content-Type header manually on FormData XHR - boundary is calculated natively

      xhr.onload = () => {
        let data;
        try {
          data = JSON.parse(xhr.responseText);
        } catch (e) {
          data = null;
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          if (data && data.url) {
            resolve(data.url);
          } else {
            reject(new Error('Upload succeeded but server did not return a valid photo URL.'));
          }
        } else {
          const errMsg = (data && data.error) ? data.error : `Upload failed with HTTP ${xhr.status}`;
          const httpError = new Error(errMsg);
          httpError.status = xhr.status;
          // INVALID_IMAGE = the AI says it is not a photo of a real animal; IMAGE_CHECK_UNAVAILABLE = it could
          // not be checked right now. `reason` is the AI's one-line explanation for a rejected photo.
          httpError.code = data && data.code;
          httpError.reason = data && typeof data.reason === 'string' ? data.reason : '';
          reject(httpError);
        }
      };

      xhr.onerror = () => {
        reject(
          new Error(
            'Network failure: Cannot reach upload server. Make sure your phone is on the same Wi-Fi as your computer.'
          )
        );
      };

      xhr.ontimeout = () => {
        reject(
          new Error('Checking the photo took too long. The network connection may be slow. Please try again.')
        );
      };

      try {
        xhr.send(formData);
      } catch (sendErr) {
        reject(new Error(`Failed to transmit photo: ${sendErr.message}`));
      }
    });
  },

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
  registerDeviceToken: (token) =>
    request('/rescuers/device-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  // 7. Emergency Contacts
  getContacts: (category = '') =>
    request(`/contacts${category ? `?category=${encodeURIComponent(category)}` : ''}`),

  // 8. Animals & QR
  getAnimalByCaseId: (caseId) => request(`/animals/case/${caseId}`),
  getAnimalByQr: (identifier) => request(`/animals/qr/${identifier}`),

  // 9. Coordinator APIs
  getCoordinatorStats: () => request('/coordinator/stats'),
  getEscalatedCases: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/coordinator/cases${query ? `?${query}` : ''}`);
  },
  manualAssignRescuer: (caseId, rescuerId, note) =>
    request(`/coordinator/cases/${caseId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ rescuerId, note }),
    }),
  verifyRescuer: (rescuerId, verificationStatus) =>
    request(`/coordinator/rescuers/${rescuerId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ verificationStatus }),
    }),
  // Coordinator uses existing rescuers list (staff-only)
  getRescuersList: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/rescuers${query ? `?${query}` : ''}`);
  },
  // Coordinator uses existing cases endpoint (role-scoped)
  getActiveCases: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/cases${query ? `?${query}` : ''}`);
  },

  // 10. Adoption APIs
  getAdoptions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/adoptions${query ? `?${query}` : ''}`);
  },
  getAdoptionById: (id) => request(`/adoptions/${id}`),
  createAdoption: (data) =>
    request('/adoptions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAdoption: (id, data) =>
    request(`/adoptions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  submitAdoptionRequest: (id, requestData) =>
    request(`/adoptions/${id}/requests`, {
      method: 'POST',
      body: JSON.stringify(requestData),
    }),

  // 11. Password Recovery
  forgotPassword: (phone) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),
  resetPassword: (token, newPassword) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),
};

export default api;
