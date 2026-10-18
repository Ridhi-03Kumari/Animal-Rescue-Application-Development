const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const upload = require('../middleware/upload');
const { optionalProtect } = require('../middleware/auth');
const { isConfigured, uploadToCloudinary } = require('../config/cloudinary');

// POST /api/v1/upload (Single photo upload)
router.post('/', optionalProtect, (req, res, next) => {
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
      return res.status(400).json({ error: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'Missing file: Please provide an image file under the field "photo".',
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
