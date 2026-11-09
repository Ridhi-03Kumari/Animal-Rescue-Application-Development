import * as Location from 'expo-location';

const POSITION_TIMEOUT_MS = 15000;

// Joins address pieces into one readable line, skipping blanks and repeats
// ("100 Feet Road", "Indiranagar", "Bengaluru", "Karnataka")
function joinParts(parts) {
  const clean = [];
  parts.forEach((part) => {
    const text = typeof part === 'string' ? part.trim() : '';
    if (text && !clean.some((c) => c.toLowerCase() === text.toLowerCase())) {
      clean.push(text);
    }
  });
  return clean.join(', ');
}

// Address from expo-location's reverse geocoder (the phone's own Google / Apple service)
function fromPlacemark(place) {
  if (!place) return '';
  const street = [place.streetNumber, place.street].filter(Boolean).join(' ');
  return joinParts([
    street || place.name,
    place.district || place.subregion,
    place.city,
    place.region,
  ]);
}

// Address from OpenStreetMap's Nominatim. Used when the phone has no geocoder (e.g. browsers).
function fromNominatim(data) {
  if (!data) return '';
  const a = data.address || {};
  const text = joinParts([
    a.road || a.pedestrian || a.footway,
    a.suburb || a.neighbourhood || a.city_district,
    a.city || a.town || a.village || a.county,
    a.state,
  ]);
  if (text) return text;
  // Last resort: the first few parts of the long display name
  return data.display_name ? data.display_name.split(',').slice(0, 4).join(',').trim() : '';
}

/**
 * Turns coordinates into a readable address, or returns '' if none can be found.
 * Coordinates are only ever sent to the phone's own geocoder and, as a fallback, to OpenStreetMap.
 */
export async function reverseGeocode(latitude, longitude) {
  try {
    const places = await Location.reverseGeocodeAsync({ latitude, longitude });
    const text = fromPlacemark(places && places[0]);
    if (text) return text;
  } catch (e) {
    // no geocoder on this device (e.g. web) - fall through
  }

  try {
    const url =
      'https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1' +
      `&lat=${latitude}&lon=${longitude}&accept-language=en`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      return fromNominatim(await res.json());
    }
  } catch (e) {
    // offline - the caller handles an empty address
  }

  return '';
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Location timed out')), ms)),
  ]);
}

/**
 * Checks and requests foreground location permissions if not already granted.
 * Safe to call repeatedly; returns boolean granted status without throwing.
 */
export async function ensureLocationPermission() {
  try {
    const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
    if (existingStatus === 'granted') {
      return true;
    }
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (e) {
    console.warn('[LOCATION] Permission check error:', e.message);
    return false;
  }
}

/**
 * Current GPS position with high accuracy. If the GPS is slow to lock on, falls back to the
 * last position the phone knows about. Throws if neither is available.
 */
export async function getCurrentCoordinates() {
  try {
    const hasPermission = await ensureLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    const position = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      POSITION_TIMEOUT_MS
    );
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch (e) {
    const last = await Location.getLastKnownPositionAsync().catch(() => null);
    if (last && last.coords) {
      return { latitude: last.coords.latitude, longitude: last.coords.longitude };
    }
    throw e;
  }
}
