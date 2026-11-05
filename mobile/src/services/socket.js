import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './api';

let socket = null;
let currentCaseId = null;
const caseUpdateListeners = new Set();
const locationListeners = new Set();
const connectionListeners = new Set();

let lastLocationSentAt = 0;
let lastSentCoords = null;
const MIN_LOCATION_INTERVAL_MS = 4500; // ~5 second throttle window

/**
 * Derives Socket server base URL from API_BASE_URL
 * (e.g. http://192.168.1.10:5000/api/v1 -> http://192.168.1.10:5000)
 */
function getSocketUrl() {
  if (!API_BASE_URL) return 'http://localhost:5000';
  return API_BASE_URL.replace(/\/api\/v1\/?$/, '');
}

/**
 * Calculates rough distance in meters between two lat/lng coordinates
 */
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function notifyConnectionChange(connected) {
  connectionListeners.forEach((cb) => {
    try {
      cb(connected);
    } catch (e) {
      /* ignore */
    }
  });
}

/**
 * Initializes and returns the shared Socket.IO connection
 */
export async function connectSocket() {
  if (socket && socket.connected) {
    return socket;
  }

  const socketUrl = getSocketUrl();
  let token = null;
  try {
    token = await AsyncStorage.getItem('user_token');
  } catch (e) {
    // Guest or token unavailable
  }

  if (socket) {
    // If socket exists but disconnected or needs updated token, reconnect
    if (token) {
      socket.auth = { token };
    }
    socket.connect();
    return socket;
  }

  socket = io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('[SOCKET] Connected to realtime server:', socket.id);
    notifyConnectionChange(true);

    // If an active case was being tracked before disconnect/reconnect, rejoin its room
    if (currentCaseId) {
      console.log('[SOCKET] Rejoining active case room on reconnect:', currentCaseId);
      socket.emit('join_case', { caseId: currentCaseId });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('[SOCKET] Disconnected from realtime server:', reason);
    notifyConnectionChange(false);
  });

  socket.on('connect_error', (err) => {
    console.log('[SOCKET] Connection error:', err.message);
    notifyConnectionChange(false);
  });

  // Listen for case status broadcasts
  const handleCaseStatus = (data) => {
    caseUpdateListeners.forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
        console.error('Error in caseUpdateListener callback:', e);
      }
    });
  };

  socket.on('case_status', handleCaseStatus);
  socket.on('case:updated', handleCaseStatus);

  // Listen for rescuer location broadcasts
  const handleRescuerLocation = (data) => {
    locationListeners.forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
        console.error('Error in locationListener callback:', e);
      }
    });
  };

  socket.on('rescuer_location', handleRescuerLocation);
  socket.on('rescuer:location', handleRescuerLocation);

  return socket;
}

/**
 * Disconnects the socket cleanly
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentCaseId = null;
    notifyConnectionChange(false);
  }
}

/**
 * Checks if the socket is currently connected
 */
export function isSocketConnected() {
  return Boolean(socket && socket.connected);
}

/**
 * Subscribes to socket connection state changes
 * (used by screens to toggle fallback HTTP polling)
 */
export function onConnectionChange(callback) {
  connectionListeners.add(callback);
  // Immediately notify caller of current state
  callback(isSocketConnected());
  return () => {
    connectionListeners.delete(callback);
  };
}

/**
 * Joins a specific rescue case room and subscribes to events.
 * Returns an unsubscribe cleanup function.
 */
export async function joinCase(caseId, onCaseUpdate, onLocation) {
  if (!caseId) return () => {};

  currentCaseId = String(caseId);
  const s = await connectSocket();

  if (onCaseUpdate) {
    caseUpdateListeners.add(onCaseUpdate);
  }
  if (onLocation) {
    locationListeners.add(onLocation);
  }

  // Join case room
  s.emit('join_case', { caseId: currentCaseId });

  // Return cleanup function for component unmount
  return () => {
    if (onCaseUpdate) {
      caseUpdateListeners.delete(onCaseUpdate);
    }
    if (onLocation) {
      locationListeners.delete(onLocation);
    }
    if (caseUpdateListeners.size === 0 && locationListeners.size === 0) {
      leaveCase(caseId);
    }
  };
}

/**
 * Leaves a case room
 */
export function leaveCase(caseId) {
  if (socket && socket.connected && caseId) {
    socket.emit('leave_case', { caseId: String(caseId) });
  }
  if (String(currentCaseId) === String(caseId)) {
    currentCaseId = null;
  }
}

/**
 * Streams rescuer location to the case room.
 * Throttled to ~5 seconds and filtered by meaningful movement (> 5 meters)
 * unless 15 seconds have elapsed without an update.
 */
export function sendLocationUpdate({ caseId, latitude, longitude, heading = 0, speed = 0 }) {
  if (!socket || !socket.connected || !caseId) return false;
  if (latitude === undefined || longitude === undefined) return false;

  const now = Date.now();
  const timeSinceLastMs = now - lastLocationSentAt;

  // Enforce ~5s minimum throttle
  if (timeSinceLastMs < MIN_LOCATION_INTERVAL_MS) {
    return false;
  }

  // Check movement distance
  if (lastSentCoords) {
    const distanceMeters = calculateDistanceMeters(
      lastSentCoords.latitude,
      lastSentCoords.longitude,
      latitude,
      longitude
    );
    // If less than 5 meters moved and less than 15s since last update, skip to save battery
    if (distanceMeters < 5 && timeSinceLastMs < 15000) {
      return false;
    }
  }

  lastLocationSentAt = now;
  lastSentCoords = { latitude, longitude };

  socket.emit('rescuer_location_update', {
    caseId: String(caseId),
    latitude,
    longitude,
    heading,
    speed,
    timestamp: new Date().toISOString(),
  });

  return true;
}

export default {
  connectSocket,
  disconnectSocket,
  isSocketConnected,
  onConnectionChange,
  joinCase,
  leaveCase,
  sendLocationUpdate,
};

