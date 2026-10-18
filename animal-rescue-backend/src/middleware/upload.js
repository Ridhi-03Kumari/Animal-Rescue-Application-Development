const multer = require('multer');
const path = require('path');

// Memory storage keeps uploaded files in RAM as a Buffer, allowing direct streaming
// to Cloudinary without creating temporary artifacts on the server filesystem.
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp|gif)$/i;

const fileFilter = (req, file, cb) => {
  const mime = (file.mimetype || '').toLowerCase();
  let ext = path.extname(file.originalname || '').toLowerCase();

  // 1. Strict MIME type validation
  if (!mime || !ALLOWED_MIME_TYPES.has(mime)) {
    return cb(
      new Error(`Invalid MIME type: "${mime || 'unknown'}". Only JPEG, PNG, WEBP, and GIF images are allowed.`)
    );
  }

  // 2. Extension validation & safe Android content URI normalization
  if (ext) {
    if (!ALLOWED_EXTENSIONS.test(ext)) {
      return cb(
        new Error(`Invalid file extension: "${ext}". Only .jpg, .jpeg, .png, .webp, and .gif extensions are allowed.`)
      );
    }
  } else {
    // Android ContentProvider URIs may submit extensionless filenames (e.g. "1000000034").
    // Safely append the legitimate extension matching the verified MIME type.
    const derivedExt =
      mime === 'image/png'
        ? '.png'
        : mime === 'image/webp'
        ? '.webp'
        : mime === 'image/gif'
        ? '.gif'
        : '.jpg';
    file.originalname = `${file.originalname || 'rescue-photo'}${derivedExt}`;
  }

  return cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1,
  },
  fileFilter,
});

module.exports = upload;
