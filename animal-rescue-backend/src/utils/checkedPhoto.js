const fs = require('fs');
const path = require('path');

// The upload route (routes/upload.js) only stores a photo after it passes the animal-photo check, and it is the
// only thing that creates these addresses. So a report may only carry a photo address that looks like one the
// upload route produced. Anything else (a link to some other website, a path on the sender's phone, a file that
// was rejected and never stored) did not pass the check and is not accepted.

const UPLOAD_DIR = path.join(__dirname, '../../public/uploads');

// Development fallback, when Cloudinary is not configured: public/uploads/animal-<time>-<random>.<ext>
const LOCAL_FILE_PATTERN = /^animal-\d+-\d+\.(jpe?g|png|webp)$/i;

// Cloudinary: https://res.cloudinary.com/<cloud>/image/upload/v<n>/animal_rescue/reports/rescue-<time>-<random>.<ext>
// (the folder comes from config/cloudinary.js and the file name from routes/upload.js)
const CLOUDINARY_PATH_PATTERN =
  /^\/([^/]+)\/image\/upload\/(?:v\d+\/)?animal_rescue\/reports\/rescue-\d+-\d+\.[a-z0-9]+$/i;

/**
 * @param {string} photoUrl  the address a report wants to attach
 * @param {{ host?: string }} [options]  `host` is this server's own host (e.g. "192.168.1.5:5000"). A full
 *   local address must point at it; a link to another website that happens to use a familiar file name is refused.
 */
function isCheckedPhotoUrl(photoUrl, { host } = {}) {
  if (typeof photoUrl !== 'string' || photoUrl.length === 0 || photoUrl.length > 500) return false;

  let url;
  try {
    url = new URL(photoUrl, 'http://placeholder.invalid');
  } catch (e) {
    return false;
  }

  // Cloudinary storage
  if (url.hostname === 'res.cloudinary.com') {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const match = url.pathname.match(CLOUDINARY_PATH_PATTERN);
    return url.protocol === 'https:' && Boolean(cloudName) && Boolean(match) && match[1] === cloudName;
  }

  // Local disk storage (development). A relative path is fine; a full address must be this server.
  const isRelative = !/^[a-z][a-z0-9+.-]*:/i.test(photoUrl) && !photoUrl.startsWith('//');
  if (!isRelative && (!host || url.host !== host)) return false;

  const match = url.pathname.match(/^\/uploads\/([^/]+)$/);
  if (!match || !LOCAL_FILE_PATTERN.test(match[1])) return false;
  return fs.existsSync(path.join(UPLOAD_DIR, match[1]));
}

module.exports = { isCheckedPhotoUrl };
