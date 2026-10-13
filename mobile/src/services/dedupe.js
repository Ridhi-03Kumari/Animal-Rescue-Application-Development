// The server now refuses to store the same report twice (same animal, text and place within minutes).
// This hides the ones that were stored before that, so a person's list shows each report once.
const WINDOW_MS = 5 * 60 * 1000;
const RADIUS_KM = 0.1;

const norm = (text) => String(text || '').trim().toLowerCase();

function kmBetween(a, b) {
  if (!a || !b || a.latitude == null || b.latitude == null) return null;
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function sameReport(a, b) {
  if (norm(a.animalType) !== norm(b.animalType)) return false;
  if (norm(a.description) !== norm(b.description)) return false;

  const gap = Math.abs(new Date(a.createdAt) - new Date(b.createdAt));
  if (!(gap <= WINDOW_MS)) return false;

  const km = kmBetween(a.location, b.location);
  if (km !== null) return km <= RADIUS_KM;
  return norm(a.location && a.location.address) === norm(b.location && b.location.address);
}

// Expects newest first (as both the server and the phone return them) and keeps the newest of each group
export function collapseDuplicateReports(reports) {
  const kept = [];
  for (const report of reports || []) {
    if (!kept.some((k) => sameReport(k, report))) kept.push(report);
  }
  return kept;
}
