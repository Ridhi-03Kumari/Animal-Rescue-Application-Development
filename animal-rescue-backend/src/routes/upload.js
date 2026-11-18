const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const upload = require('../middleware/upload');
const { optionalProtect } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { isConfigured, uploadToCloudinary } = require('../config/cloudinary');
// Used as imageValidation.validateAnimalPhoto(...) (not destructured) so tests can replace it
const imageValidation = require('../services/imageValidationService');

const INVALID_IMAGE_MESSAGE =
  'Invalid image. Only an original photo of a real animal, taken on the spot, can be sent. Pictures without an animal, AI-generated images and pictures from the internet are not accepted.';

// POST /api/v1/upload (Single photo upload)
// A photo is only stored (Cloudinary, or local disk in development) after it passes the animal-photo check.
// Anything else is refused before it is saved anywhere, so every stored report photo is a checked one.
router.post('/', uploadLimiter, optionalProtect, (req, res, next) => {
  upload.single('photo')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: 'File too large: The selected image exceeds the maximum allowed size of 10 MB.',
          });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }
      // The file-type filter in middleware/upload.js rejects anything that is not an image
      return res.status(400).json({ error: err.message, code: 'INVALID_IMAGE' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'Missing file: Please provide an image file under the field "photo".',
        });
      }

      // 0. Animal-photo check (AI). Must pass before the photo is stored anywhere.
      const check = await imageValidation.validateAnimalPhoto({
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
      });

      if (check.status === 'invalid') {
        return res.status(422).json({ error: INVALID_IMAGE_MESSAGE, code: 'INVALID_IMAGE', reason: check.reason });
      }

      if (check.status !== 'valid') {
        // The check could not run (no key, timeout, service error). Never let an unchecked photo through.
        return res.status(503).json({
          error: 'We could not check the photo right now. Please try again in a moment.',
          code: 'IMAGE_CHECK_UNAVAILABLE',
        });
      }

      // 1. Production / Configured: Stream directly to Cloudinary
      if (isConfigured) {
        try {
          const result = await uploadToCloudinary(req.file.buffer, {
            public_id: `rescue-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
          });

          return res.status(201).json({
            success: true,
            message: 'Photo uploaded successfully to Cloudinary',
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            bytes: result.bytes,
          });
        } catch (cloudinaryErr) {
          const errorMsg = String(cloudinaryErr.message || '');
          const isAuthError = /api_key|signature|credentials|unauthorized|must supply/i.test(errorMsg);

          console.error('[CLOUDINARY ERROR]', isAuthError ? 'Authentication failure' : errorMsg);

          if (process.env.NODE_ENV === 'production') {
            if (isAuthError) {
              return res.status(502).json({
                error: 'Cloudinary authentication failure: Invalid or expired storage credentials.',
              });
            }
            return res.status(502).json({
              error: 'Cloudinary upload failure: Storage service unavailable. Please try again.',
            });
          }

          console.warn(
            '[UPLOAD DEV FALLBACK] Cloudinary failed. Falling back to local disk storage for development testing.'
          );
        }
      }

      // 2. Production safety guard: Refuse unconfigured storage in production
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({
          error: 'Cloudinary photo storage is required in production but not configured.',
        });
      }

      // 3. Development / Test fallback: Save buffer to public/uploads
      const uploadDir = path.join(__dirname, '../../public/uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
      const filename = `animal-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);

      const relativeUrl = `/uploads/${filename}`;
      const fullUrl = `${req.protocol}://${req.get('host')}${relativeUrl}`;

      return res.status(201).json({
        success: true,
        message: 'Photo uploaded successfully (local dev fallback)',
        filename,
        url: fullUrl,
        path: relativeUrl,
      });
    } catch (handlerErr) {
      next(handlerErr);
    }
  });
});

module.exports = router;
