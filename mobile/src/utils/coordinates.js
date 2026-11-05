/**
 * Coordinate Validation & Geo Utilities for Live Rescue Maps
 */

/**
 * Validates whether an object has numeric, finite, in-range latitude and longitude.
 * Latitude must be -90..90, Longitude must be -180..180.
 *
 * @param {any} coord
 * @returns {boolean}
 */
export function isValidCoordinate(coord) {
  if (!coord || typeof coord !== 'object') return false;

  const lat = typeof coord.latitude === 'number' ? coord.latitude : parseFloat(coord.latitude);
  const lon = typeof coord.longitude === 'number' ? coord.longitude : parseFloat(coord.longitude);

  if (isNaN(lat) || !isFinite(lat) || lat < -90 || lat > 90) return false;
  if (isNaN(lon) || !isFinite(lon) || lon < -180 || lon > 180) return false;

  return true;
}

/**
 * Parses and sanitizes a coordinate object, or returns null if invalid.
 *
 * @param {any} coord
 * @returns {{ latitude: number, longitude: number } | null}
 */
export function sanitizeCoordinate(coord) {
  if (!isValidCoordinate(coord)) return null;
  const lat = typeof coord.latitude === 'number' ? coord.latitude : parseFloat(coord.latitude);
  const lon = typeof coord.longitude === 'number' ? coord.longitude : parseFloat(coord.longitude);
  return {
    latitude: Number(lat.toFixed(6)),
    longitude: Number(lon.toFixed(6)),
  };
}

/**
 * Computes the distance in kilometers between two coordinates using the Haversine formula.
 *
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in kilometers
 */
export function getDistanceKm(lat1, lon1, lat2, lon2) {
  if (
    !isValidCoordinate({ latitude: lat1, longitude: lon1 }) ||
    !isValidCoordinate({ latitude: lat2, longitude: lon2 })
  ) {
    return 0;
  }

  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Formats a distance in km for human display (e.g. "850 m" or "2.4 km").
 *
 * @param {number} km
 * @returns {string}
 */
export function formatDistance(km) {
  if (typeof km !== 'number' || isNaN(km) || km < 0) return '';
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Formats distance with natural, human-friendly phrasing for citizens.
 * Avoids raw numbers or 0 meters when rescuer has arrived.
 *
 * @param {number} km
 * @param {boolean} isReached
 * @returns {string}
 */
export function formatFriendlyDistance(km, isReached = false) {
  if (isReached || (typeof km === 'number' && km <= 0.03)) {
    return "The rescuer has reached the animal's reported location.";
  }
  if (typeof km !== 'number' || isNaN(km) || km < 0) return '';
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `About ${meters} metres away`;
  }
  return `About ${km.toFixed(1)} km away`;
}

/**
 * Formats coordinates for compact display (e.g. "12.9716° N, 77.5946° E").
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {string}
 */
export function formatCoordinates(lat, lon) {
  if (!isValidCoordinate({ latitude: lat, longitude: lon })) return '';
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
}

/**
 * Calculates a map region (center + deltas) to display one or two coordinates with comfortable padding.
 *
 * @param {object|null} coordA Primary coordinate (e.g. case)
 * @param {object|null} coordB Optional second coordinate (e.g. responder)
 * @param {number} minDelta Minimum span in degrees to avoid over-zooming (default 0.012 ~= 1.3km)
 * @returns {{ latitude: number, longitude: number, latitudeDelta: number, longitudeDelta: number } | null}
 */
export function calculateRegion(coordA, coordB = null, minDelta = 0.012) {
  const validA = sanitizeCoordinate(coordA);
  const validB = sanitizeCoordinate(coordB);

  if (!validA && !validB) return null;

  if (validA && !validB) {
    return {
      latitude: validA.latitude,
      longitude: validA.longitude,
      latitudeDelta: minDelta,
      longitudeDelta: minDelta,
    };
  }

  if (!validA && validB) {
    return {
      latitude: validB.latitude,
      longitude: validB.longitude,
      latitudeDelta: minDelta,
      longitudeDelta: minDelta,
    };
  }

  // Both exist: find bounding box and center
  const minLat = Math.min(validA.latitude, validB.latitude);
  const maxLat = Math.max(validA.latitude, validB.latitude);
  const minLon = Math.min(validA.longitude, validB.longitude);
  const maxLon = Math.max(validA.longitude, validB.longitude);

  const centerLat = (minLat + maxLat) / 2;
  const centerLon = (minLon + maxLon) / 2;

  // Add 45% padding so markers don't sit on the edge
  const rawLatDelta = (maxLat - minLat) * 1.45;
  const rawLonDelta = (maxLon - minLon) * 1.45;

  return {
    latitude: centerLat,
    longitude: centerLon,
    latitudeDelta: Math.max(rawLatDelta, minDelta),
    longitudeDelta: Math.max(rawLonDelta, minDelta),
  };
}

// Common fallback center: Bengaluru city center
export const DEFAULT_BENGALURU_COORDINATES = {
  latitude: 12.9716,
  longitude: 77.5946,
};

