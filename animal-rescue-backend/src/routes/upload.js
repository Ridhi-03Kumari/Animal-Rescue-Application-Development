const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { optionalProtect } = require('../middleware/auth');

// POST /api/v1/upload (Single photo upload)
router.post('/', optionalProtect, upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Please provide an image file under the field "photo"' });
  }

  const relativeUrl = `/uploads/${req.file.filename}`;
  const fullUrl = `${req.protocol}://${req.get('host')}${relativeUrl}`;

  res.status(201).json({
    success: true,
    message: 'Photo uploaded successfully',
    filename: req.file.filename,
    url: fullUrl,
    path: relativeUrl,
  });
});

module.exports = router;
